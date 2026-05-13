import { ensureSchema, openDb, runInTransaction } from "./db.mjs";
import { keywordMap } from "./constants.mjs";
import { mockNotesForKeyword, mockPrice } from "./mock-data.mjs";
import { isMarketOpen } from "./price.mjs";
import { countWords, fomoScore, heatScore } from "./scoring.mjs";
import { loadEnv } from "./env.mjs";

loadEnv();

export async function seedAll(db = openDb()) {
  ensureSchema(db);
  const now = new Date();
  const upsertTopic = db.prepare(`
    insert into topics(keyword, market, heat_score, growth_rate, comment_interaction_rate, comment_growth_rate, summary, source_url, related_symbols, price_change_pct, latest_price, fomo_score, updated_at)
    values(@keyword, @market, @heatScore, @growthRate, @commentInteractionRate, @commentGrowthRate, @summary, @sourceUrl, @relatedSymbols, @priceChangePct, @latestPrice, @fomoScore, @updatedAt)
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
      updated_at = excluded.updated_at
  `);
  const insertNote = db.prepare(`
    insert into notes(topic_id, title, body, author, published_at, likes, favorites, comment_count, comments_json, source_url, raw_json, captured_at)
    values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertHistory = db.prepare(`
    insert into topic_history(topic_id, captured_at, heat_score, comment_count, likes, favorites, growth_rate, comment_growth_rate)
    values(?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertPrice = db.prepare(`
    insert into prices(topic_id, symbol, market, price, change_pct, captured_at) values(?, ?, ?, ?, ?, ?)
  `);
  const insertFomo = db.prepare(`
    insert into fomo_history(topic_id, captured_at, fomo_score, comment_velocity, heat_growth, fomo_words, explosive_words, crowding)
    values(?, ?, ?, ?, ?, ?, ?, ?)
  `);

  runInTransaction(db, () => {
    for (const item of keywordMap) {
      const notes = mockNotesForKeyword(item, now);
      const totals = notes.reduce(
        (sum, note) => ({
          likes: sum.likes + note.likes,
          favorites: sum.favorites + note.favorites,
          comments: sum.comments + note.commentCount
        }),
        { likes: 0, favorites: 0, comments: 0 }
      );
      const growthRate = 18 + ((item.keyword.length * 17) % 72);
      const commentGrowthRate = 15 + ((item.keyword.length * 23) % 85);
      const text = notes.map((note) => `${note.title} ${note.body} ${note.comments.join(" ")}`).join(" ");
      const heat = heatScore({
        keywordHits: countWords(text, [item.keyword, ...item.aliases]),
        comments: totals.comments,
        likes: totals.likes,
        favorites: totals.favorites,
        commentGrowthRate,
        heatGrowthRate: growthRate,
        publishedAt: notes[0].publishedAt
      });
      const fomo = fomoScore({ text, comments: totals.comments, commentGrowthRate, heatGrowthRate: growthRate });
      const price = mockPrice(item.relatedSymbols[0] || item.keyword, item.market);
      const priceChangePct = item.market === "crypto" || isMarketOpen(item.market, now) ? price.changePct : null;
      const summary = notes[0].body;
      const updatedAt = now.toISOString();

      upsertTopic.run({
        keyword: item.keyword,
        market: item.market,
        heatScore: heat,
        growthRate,
        commentInteractionRate: Number((totals.comments / Math.max(1, totals.likes + totals.favorites) * 100).toFixed(2)),
        commentGrowthRate,
        summary,
        sourceUrl: notes[0].sourceUrl,
        relatedSymbols: JSON.stringify(item.relatedSymbols),
        priceChangePct,
        latestPrice: price.price,
        fomoScore: fomo.score,
        updatedAt
      });
      const topicId = db.prepare("select id from topics where keyword = ? and market = ?").get(item.keyword, item.market).id;
      db.prepare("delete from notes where topic_id = ?").run(topicId);
      for (const note of notes) {
        const noteResult = insertNote.run(topicId, note.title, note.body, note.author, note.publishedAt, note.likes, note.favorites, note.commentCount, JSON.stringify(note.comments), note.sourceUrl, JSON.stringify(note), updatedAt);
        for (const comment of note.comments) {
          db.prepare("insert into comment_analysis(topic_id, note_id, comment_text, sentiment, fomo_terms) values(?, ?, ?, ?, ?)").run(topicId, noteResult.lastInsertRowid, comment, /上车|踏空|梭哈|起飞|牛市/.test(comment) ? "fomo" : "neutral", JSON.stringify(["上车", "踏空"].filter((word) => comment.includes(word))));
        }
      }
      for (let day = 6; day >= 0; day--) {
        const capturedAt = new Date(now.getTime() - day * 86400000).toISOString();
        const factor = 1 - day * 0.055 + Math.sin(day + item.keyword.length) * 0.04;
        insertHistory.run(topicId, capturedAt, Math.max(4, heat * factor), Math.round(totals.comments * factor), Math.round(totals.likes * factor), Math.round(totals.favorites * factor), growthRate * factor, commentGrowthRate * factor);
        const p = mockPrice(item.relatedSymbols[0] || item.keyword, item.market, day);
        insertPrice.run(topicId, item.relatedSymbols[0] || item.keyword, item.market, p.price, p.changePct, capturedAt);
        insertFomo.run(topicId, capturedAt, Math.max(3, fomo.score * factor), fomo.breakdown.commentVelocity * factor, fomo.breakdown.heatGrowth * factor, fomo.breakdown.fomoWords, fomo.breakdown.explosiveWords, fomo.breakdown.crowding);
      }
    }
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const db = openDb();
  await seedAll(db);
  db.close();
  console.log("Seed data generated.");
}
