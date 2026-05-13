import fs from "node:fs/promises";
import { ensureSchema, openDb } from "./db.mjs";
import { keywordMap } from "./constants.mjs";
import { mockPrice } from "./mock-data.mjs";
import { countWords, fomoScore, heatScore } from "./scoring.mjs";
import { loadEnv } from "./env.mjs";

loadEnv();

const file = process.argv[2];
if (!file) {
  console.error("Usage: npm run import -- /path/to/data.csv");
  process.exit(1);
}

const raw = await fs.readFile(file, "utf8");
const rows = file.endsWith(".json")
  ? JSON.parse(raw)
  : parseCsv(raw);

const db = openDb();
ensureSchema(db);

const groups = new Map();
for (const row of rows) {
  const keyword = row.keyword || row.topic || row.title?.slice(0, 12) || "手动导入";
  if (!groups.has(keyword)) groups.set(keyword, []);
  groups.get(keyword).push(row);
}

for (const [keyword, notes] of groups.entries()) {
  const mapping = keywordMap.find((item) => keyword.includes(item.keyword) || item.aliases.some((alias) => keyword.includes(alias))) || keywordMap[0];
  persistImported(db, keyword, mapping, notes);
}

db.close();
console.log(`Imported ${rows.length} rows from ${file}`);

function persistImported(db, keyword, mapping, rows) {
  const now = new Date().toISOString();
  const normalized = rows.map((row, index) => ({
    title: row.title || `${keyword} 手动导入 ${index + 1}`,
    body: row.body || row.content || row.summary || "",
    author: row.author || row.username || "manual-import",
    publishedAt: row.published_at || row.publishedAt || now,
    likes: Number(row.likes || 0),
    favorites: Number(row.favorites || row.collects || 0),
    commentCount: Number(row.comment_count || row.commentCount || 0),
    comments: typeof row.comments === "string" ? row.comments.split(/[|,，]/).filter(Boolean) : row.comments || [],
    sourceUrl: row.source_url || row.sourceUrl || ""
  }));
  const totals = normalized.reduce((sum, note) => ({ likes: sum.likes + note.likes, favorites: sum.favorites + note.favorites, comments: sum.comments + note.commentCount }), { likes: 0, favorites: 0, comments: 0 });
  const text = normalized.map((note) => `${note.title} ${note.body} ${note.comments.join(" ")}`).join(" ");
  const growthRate = 24 + normalized.length * 7;
  const commentGrowthRate = 20 + Math.min(80, totals.comments / 20);
  const heat = heatScore({ keywordHits: countWords(text, [keyword, ...mapping.aliases]), comments: totals.comments, likes: totals.likes, favorites: totals.favorites, commentGrowthRate, heatGrowthRate: growthRate, publishedAt: normalized[0].publishedAt });
  const fomo = fomoScore({ text, comments: totals.comments, commentGrowthRate, heatGrowthRate: growthRate });
  const price = mockPrice(mapping.relatedSymbols[0], mapping.market);
  db.prepare(`
    insert into topics(keyword, market, heat_score, growth_rate, comment_interaction_rate, comment_growth_rate, summary, source_url, related_symbols, price_change_pct, latest_price, fomo_score, updated_at)
    values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    on conflict(keyword, market) do update set heat_score=excluded.heat_score, growth_rate=excluded.growth_rate, comment_interaction_rate=excluded.comment_interaction_rate, comment_growth_rate=excluded.comment_growth_rate, summary=excluded.summary, source_url=excluded.source_url, related_symbols=excluded.related_symbols, price_change_pct=excluded.price_change_pct, latest_price=excluded.latest_price, fomo_score=excluded.fomo_score, updated_at=excluded.updated_at
  `).run(keyword, mapping.market, heat, growthRate, totals.comments / Math.max(1, totals.likes + totals.favorites) * 100, commentGrowthRate, normalized[0].body, normalized[0].sourceUrl, JSON.stringify(mapping.relatedSymbols), price.changePct, price.price, fomo.score, now);
  const topicId = db.prepare("select id from topics where keyword = ? and market = ?").get(keyword, mapping.market).id;
  db.prepare("delete from notes where topic_id = ?").run(topicId);
  for (const note of normalized) {
    db.prepare("insert into notes(topic_id, title, body, author, published_at, likes, favorites, comment_count, comments_json, source_url, raw_json, captured_at) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(topicId, note.title, note.body, note.author, note.publishedAt, note.likes, note.favorites, note.commentCount, JSON.stringify(note.comments), note.sourceUrl, JSON.stringify(note), now);
  }
  db.prepare("insert into topic_history(topic_id, captured_at, heat_score, comment_count, likes, favorites, growth_rate, comment_growth_rate) values(?, ?, ?, ?, ?, ?, ?, ?)")
    .run(topicId, now, heat, totals.comments, totals.likes, totals.favorites, growthRate, commentGrowthRate);
  db.prepare("insert into prices(topic_id, symbol, market, price, change_pct, captured_at) values(?, ?, ?, ?, ?, ?)")
    .run(topicId, mapping.relatedSymbols[0], mapping.market, price.price, price.changePct, now);
  db.prepare("insert into fomo_history(topic_id, captured_at, fomo_score, comment_velocity, heat_growth, fomo_words, explosive_words, crowding) values(?, ?, ?, ?, ?, ?, ?, ?)")
    .run(topicId, now, fomo.score, fomo.breakdown.commentVelocity, fomo.breakdown.heatGrowth, fomo.breakdown.fomoWords, fomo.breakdown.explosiveWords, fomo.breakdown.crowding);
}

function parseCsv(raw) {
  const lines = raw.split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return [];
  const headers = splitCsvLine(lines[0]).map((item) => item.trim());
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function splitCsvLine(line) {
  const values = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      value += '"';
      index++;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(value);
      value = "";
    } else {
      value += char;
    }
  }
  values.push(value);
  return values;
}
