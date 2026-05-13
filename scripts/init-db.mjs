import { ensureSchema, openDb, runInTransaction, writeSetting } from "./db.mjs";
import { keywordMap } from "./constants.mjs";
import { seedAll } from "./seed.mjs";
import { loadEnv } from "./env.mjs";

loadEnv();

const db = openDb();
ensureSchema(db);

const defaults = {
  update_interval_hours: process.env.UPDATE_INTERVAL_HOURS || 12,
  data_period_days: 7,
  data_retention_days: process.env.DATA_RETENTION_DAYS || 90,
  xhs_cookie: process.env.XHS_COOKIE || "",
  xhs_user_agent: process.env.XHS_USER_AGENT || "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
  xhs_rate_limit_ms: process.env.XHS_RATE_LIMIT_MS || 2500,
  xhs_max_retries: process.env.XHS_MAX_RETRIES || 2,
  xhs_proxy_url: process.env.XHS_PROXY_URL || ""
};

for (const [key, value] of Object.entries(defaults)) {
  const exists = db.prepare("select key from settings where key = ?").get(key);
  if (!exists) writeSetting(db, key, value);
}

const keywordStmt = db.prepare(
  "insert into keywords(keyword, market, related_symbols, aliases) values(?, ?, ?, ?) on conflict(keyword) do update set market = excluded.market, related_symbols = excluded.related_symbols, aliases = excluded.aliases, updated_at = datetime('now')"
);
runInTransaction(db, () => {
  for (const item of keywordMap) {
    keywordStmt.run(item.keyword, item.market, JSON.stringify(item.relatedSymbols), JSON.stringify(item.aliases));
  }
});

const topicCount = db.prepare("select count(*) as count from topics").get().count;
if (topicCount === 0) {
  await seedAll(db);
}

db.close();
console.log("SQLite database initialized at", process.env.DATABASE_PATH || "./data/fomo.db");
