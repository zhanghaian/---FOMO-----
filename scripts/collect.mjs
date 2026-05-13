import { ensureSchema, openDb, readSettings, runInTransaction } from "./db.mjs";
import { fetchPrice } from "./price.mjs";
import { fetchXhsHotFeed } from "./xhs-client.mjs";
import { keywordMap } from "./constants.mjs";
import { mockHotFeed } from "./mock-data.mjs";
import { countWords, fomoScore, heatScore } from "./scoring.mjs";
import { loadEnv } from "./env.mjs";

loadEnv();

const db = openDb();
ensureSchema(db);
const startedAt = new Date().toISOString();
const run = db.prepare("insert into collection_runs(started_at, mode, status) values(?, ?, ?)").run(startedAt, "auto", "running");

try {
  const settings = readSettings(db);
  const rules = loadKeywordRules(db);
  const config = {
    cookie: settings.xhs_cookie || process.env.XHS_COOKIE || "",
    userAgent: settings.xhs_user_agent || process.env.XHS_USER_AGENT || "Mozilla/5.0",
    rateLimitMs: Number(settings.xhs_rate_limit_ms || process.env.XHS_RATE_LIMIT_MS || 2500),
    maxRetries: Number(settings.xhs_max_retries || process.env.XHS_MAX_RETRIES || 2),
    proxyUrl: settings.xhs_proxy_url || process.env.XHS_PROXY_URL || ""
  };

  let candidates = [];
  let mode = "real-hot-feed";
  try {
    if (!config.cookie && !config.proxyUrl) {
      throw new Error("XHS_COOKIE is empty; use mock hot feed");
    }
    candidates = await fetchXhsHotFeed(config);
  } catch {
    candidates = mockHotFeed();
    mode = "mock-hot-feed";
  }

  const discovered = discoverFinancialTopics(candidates, rules)
    .sort((a, b) => b.discoveryScore - a.discoveryScore)
    .slice(0, 20);

  db.prepare("update topics set is_active = 0").run();
  for (const item of discovered) {
    await persistTopic(db, item, item.notes, mode);
  }

  cleanupOldData(db, Number(settings.data_retention_days || process.env.DATA_RETENTION_DAYS || 90));

  db.prepare("update collection_runs set finished_at = ?, mode = ?, status = ?, message = ? where id = ?")
    .run(new Date().toISOString(), mode, "success", `candidates=${candidates.length}, topics=${discovered.length}`, run.lastInsertRowid);
  console.log(`Collection finished. mode=${mode}, candidates=${candidates.length}, topics=${discovered.length}`);
} catch (error) {
  db.prepare("update collection_runs set finished_at = ?, status = ?, message = ? where id = ?")
    .run(new Date().toISOString(), "failed", error?.message || String(error), run.lastInsertRowid);
  console.error(error);
  process.exitCode = 1;
} finally {
  db.close();
}

async function persistTopic(db, item, notes, mode) {
  const now = new Date().toISOString();
  const totals = notes.reduce(
    (sum, note) => ({
      likes: sum.likes + Number(note.likes || 0),
      favorites: sum.favorites + Number(note.favorites || 0),
      comments: sum.comments + Number(note.commentCount || note.comment_count || 0)
    }),
    { likes: 0, favorites: 0, comments: 0 }
  );
  const text = notes.map((note) => `${note.title} ${note.body} ${(note.comments || []).join(" ")}`).join(" ");
  const previous = db.prepare("select heat_score, comment_growth_rate from topics where keyword = ? and market = ?").get(item.keyword, item.market);
  const growthRate = average(notes.map((note) => Number(note.heatGrowthRate || 0)).filter(Boolean)) || (previous?.heat_score ? Math.max(0, heatDeltaEstimate(totals, previous.heat_score)) : 18 + item.keyword.length * 2);
  const commentGrowthRate = average(notes.map((note) => Number(note.commentGrowthRate || 0)).filter(Boolean)) || (previous?.comment_growth_rate ? Math.max(0, previous.comment_growth_rate * 0.62 + totals.comments / 180) : 12 + item.keyword.length * 1.5);
  const heat = heatScore({
    keywordHits: countWords(text, [item.keyword, ...item.aliases]),
    comments: totals.comments,
    likes: totals.likes,
    favorites: totals.favorites,
    commentGrowthRate,
    heatGrowthRate: growthRate,
    publishedAt: notes[0]?.publishedAt || now
  });
  const fomo = fomoScore({ text, comments: totals.comments, commentGrowthRate, heatGrowthRate: growthRate });
  const price = await fetchPrice(item.relatedSymbols, item.market);
  const sourceUrl = bestSourceUrl(notes, item.keyword);

  const upsert = db.prepare(`
    insert into topics(keyword, market, heat_score, growth_rate, comment_interaction_rate, comment_growth_rate, summary, source_url, related_symbols, price_change_pct, latest_price, fomo_score, is_active, updated_at)
    values(@keyword, @market, @heatScore, @growthRate, @commentInteractionRate, @commentGrowthRate, @summary, @sourceUrl, @relatedSymbols, @priceChangePct, @latestPrice, @fomoScore, 1, @updatedAt)
    on conflict(keyword, market) do update set
      heat_score = excluded.heat_score,
      growth_rate = excluded.growth_rate,
      comment_interaction_rate = excluded.comment_interaction_rate,
      comment_growth_rate = excluded.comment_growth_rate,
      summary = excluded.summary,
      source_url = excluded.source_url,
      related_symbols = excluded.related_symbols,
      price_change_pct = excluded.price_change_pct,
      latest_price = excluded.latest_price,
      fomo_score = excluded.fomo_score,
      is_active = 1,
      updated_at = excluded.updated_at
  `);

  runInTransaction(db, () => {
    upsert.run({
      keyword: item.keyword,
      market: item.market,
      heatScore: heat,
      growthRate,
      commentInteractionRate: Number((totals.comments / Math.max(1, totals.likes + totals.favorites) * 100).toFixed(2)),
      commentGrowthRate,
      summary: `${mode === "mock-hot-feed" ? "热榜 Mock 降级：" : "热榜识别："}${notes[0]?.body || item.keyword}`.slice(0, 420),
      sourceUrl,
      relatedSymbols: JSON.stringify(item.relatedSymbols),
      priceChangePct: price.changePct,
      latestPrice: price.price,
      fomoScore: fomo.score,
      updatedAt: now
    });
    const topicId = db.prepare("select id from topics where keyword = ? and market = ?").get(item.keyword, item.market).id;
    db.prepare("delete from notes where topic_id = ?").run(topicId);
    const insertNote = db.prepare("insert into notes(topic_id, title, body, author, published_at, likes, favorites, comment_count, comments_json, source_url, raw_json, captured_at) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    const insertComment = db.prepare("insert into comment_analysis(topic_id, note_id, comment_text, sentiment, fomo_terms) values(?, ?, ?, ?, ?)");
    for (const note of notes) {
      const noteUrl = normalizeNoteUrl(note.sourceUrl) || sourceUrl;
      const noteId = insertNote.run(topicId, note.title, note.body, note.author || "unknown", note.publishedAt || now, note.likes || 0, note.favorites || 0, note.commentCount || 0, JSON.stringify(note.comments || []), noteUrl, JSON.stringify(note.raw || note), now).lastInsertRowid;
      for (const comment of note.comments || []) {
        const terms = ["上车", "踏空", "梭哈", "还能买吗", "翻倍", "AI", "牛市", "起飞", "抄底"].filter((word) => comment.includes(word));
        insertComment.run(topicId, noteId, comment, terms.length ? "fomo" : "neutral", JSON.stringify(terms));
      }
    }
    db.prepare("insert into topic_history(topic_id, captured_at, heat_score, comment_count, likes, favorites, growth_rate, comment_growth_rate) values(?, ?, ?, ?, ?, ?, ?, ?)")
      .run(topicId, now, heat, totals.comments, totals.likes, totals.favorites, growthRate, commentGrowthRate);
    if (price.price !== null) {
      db.prepare("insert into prices(topic_id, symbol, market, price, change_pct, captured_at) values(?, ?, ?, ?, ?, ?)")
        .run(topicId, price.symbol, item.market, price.price, price.changePct, now);
    }
    db.prepare("insert into fomo_history(topic_id, captured_at, fomo_score, comment_velocity, heat_growth, fomo_words, explosive_words, crowding) values(?, ?, ?, ?, ?, ?, ?, ?)")
      .run(topicId, now, fomo.score, fomo.breakdown.commentVelocity, fomo.breakdown.heatGrowth, fomo.breakdown.fomoWords, fomo.breakdown.explosiveWords, fomo.breakdown.crowding);
  });
}

function discoverFinancialTopics(candidates, rules) {
  const groups = new Map();
  for (const note of candidates) {
    const match = classifyNote(note, rules);
    if (!match) continue;
    const topicKeyword = note.topicKeyword || match.matchedAlias || match.rule.keyword;
    const key = `${match.rule.market}:${topicKeyword}`;
    const existing = groups.get(key) || {
      keyword: topicKeyword,
      market: match.rule.market,
      relatedSymbols: note.relatedSymbols?.length ? note.relatedSymbols : match.rule.relatedSymbols,
      aliases: unique([match.rule.keyword, ...match.rule.aliases, topicKeyword]),
      notes: [],
      discoveryScore: 0
    };
    existing.notes.push(normalizeNote(note, topicKeyword));
    existing.discoveryScore += match.score + Math.log1p((note.likes || 0) + (note.favorites || 0) + (note.commentCount || 0) * 2);
    groups.set(key, existing);
  }
  return Array.from(groups.values());
}

function classifyNote(note, rules) {
  const text = `${note.title || ""} ${note.body || ""} ${(note.comments || []).join(" ")}`;
  if (note.ruleKeyword) {
    const rule = rules.find((item) => item.keyword === note.ruleKeyword) || rules.find((item) => item.aliases.includes(note.ruleKeyword));
    if (rule) return { rule, matchedAlias: note.topicKeyword || note.ruleKeyword, score: 10 };
  }
  let best = null;
  for (const rule of rules) {
    const words = [rule.keyword, ...rule.aliases];
    const hits = words
      .map((word) => ({ word, count: countWords(text, [word]) }))
      .filter((item) => item.count > 0);
    if (!hits.length) continue;
    const score = hits.reduce((sum, item) => sum + item.count, 0);
    const matchedAlias = hits.sort((a, b) => b.count - a.count)[0].word;
    if (!best || score > best.score) best = { rule, matchedAlias, score };
  }
  return best;
}

function normalizeNote(note, topicKeyword) {
  return {
    ...note,
    title: note.title || topicKeyword,
    body: note.body || "",
    author: note.author || "小红书热榜",
    publishedAt: note.publishedAt || new Date().toISOString(),
    likes: Number(note.likes || 0),
    favorites: Number(note.favorites || 0),
    commentCount: Number(note.commentCount || note.comment_count || 0),
    comments: note.comments || [],
    sourceUrl: normalizeNoteUrl(note.sourceUrl)
  };
}

function bestSourceUrl(notes, keyword) {
  const noteUrl = notes.map((note) => normalizeNoteUrl(note.sourceUrl)).find(Boolean);
  return noteUrl || `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(keyword)}`;
}

function normalizeNoteUrl(url) {
  if (!url) return "";
  if (/^https?:\/\//.test(url)) return url;
  if (url.startsWith("/")) return `https://www.xiaohongshu.com${url}`;
  return "";
}

function loadKeywordRules(db) {
  const rows = db.prepare("select * from keywords where enabled = 1 order by id").all();
  return rows.length
    ? rows.map((row) => ({
        keyword: row.keyword,
        market: row.market,
        relatedSymbols: JSON.parse(row.related_symbols || "[]"),
        aliases: JSON.parse(row.aliases || "[]")
      }))
    : keywordMap;
}

function cleanupOldData(db, retentionDays) {
  const cutoff = new Date(Date.now() - Math.max(7, retentionDays) * 86400000).toISOString();
  db.prepare("delete from topic_history where captured_at < ?").run(cutoff);
  db.prepare("delete from prices where captured_at < ?").run(cutoff);
  db.prepare("delete from fomo_history where captured_at < ?").run(cutoff);
  db.prepare("delete from notes where captured_at < ?").run(cutoff);
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function heatDeltaEstimate(totals, previousHeat) {
  return ((totals.likes + totals.favorites + totals.comments - previousHeat * 38) / Math.max(1, previousHeat * 38)) * 100;
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}
