import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import type { AppConfig, KeywordConfig, Market, Topic, TopicDetail, XhsNote } from "./types";

const dbPath = process.env.DATABASE_PATH ?? "./data/fomo.db";
const resolvedPath = path.resolve(process.cwd(), dbPath);
let instance: DatabaseSync | null = null;

export function getDb() {
  if (!instance) {
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
    instance = new DatabaseSync(resolvedPath);
    instance.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
    ensureColumn(instance, "topics", "is_active", "integer not null default 1");
  }
  return instance;
}

export function getTopics(params: {
  period?: string;
  market?: Market | "all";
  sort?: "heat" | "growth" | "commentGrowth" | "fomo";
  limit?: number;
}) {
  const db = getDb();
  const where: string[] = ["is_active = 1"];
  const values: (string | number | null)[] = [];

  if (params.market && params.market !== "all") {
    where.push("market = ?");
    values.push(params.market);
  }

  const orderBy =
    params.sort === "growth"
      ? "growth_rate DESC"
      : params.sort === "commentGrowth"
        ? "comment_growth_rate DESC"
        : params.sort === "fomo"
          ? "fomo_score DESC"
          : "heat_score DESC";

  const rows = db
    .prepare(
      `select * from topics ${where.length ? `where ${where.join(" and ")}` : ""}
       order by ${orderBy}, updated_at desc limit ?`
    )
    .all(...values, params.limit ?? 50) as TopicRow[];

  return rows.map(topicFromRow);
}

export function getTopicDetail(id: number): TopicDetail | null {
  const db = getDb();
  const row = db.prepare("select * from topics where id = ?").get(id) as TopicRow | undefined;
  if (!row) return null;

  const topic = topicFromRow(row);
  const notes = db
    .prepare("select * from notes where topic_id = ? order by published_at desc limit 8")
    .all(id) as NoteRow[];
  const history = db
    .prepare("select * from topic_history where topic_id = ? order by captured_at asc")
    .all(id) as HistoryRow[];
  const prices = db
    .prepare("select * from prices where topic_id = ? order by captured_at asc")
    .all(id) as PriceRow[];
  const fomoHistory = db
    .prepare("select * from fomo_history where topic_id = ? order by captured_at asc")
    .all(id) as FomoRow[];
  const fomo = db
    .prepare("select * from fomo_history where topic_id = ? order by captured_at desc limit 1")
    .get(id) as FomoRow | undefined;

  return {
    ...topic,
    notes: notes.map(noteFromRow),
    heatHistory: history.map((item) => ({ date: item.captured_at, value: item.heat_score })),
    commentHistory: history.map((item) => ({ date: item.captured_at, value: item.comment_count })),
    priceHistory: prices.map((item) => ({ date: item.captured_at, value: item.price })),
    fomoHistory: fomoHistory.map((item) => ({ date: item.captured_at, value: item.fomo_score })),
    fomoBreakdown: {
      commentVelocity: fomo?.comment_velocity ?? 0,
      heatGrowth: fomo?.heat_growth ?? 0,
      fomoWords: fomo?.fomo_words ?? 0,
      explosiveWords: fomo?.explosive_words ?? 0,
      crowding: fomo?.crowding ?? 0
    }
  };
}

export function getConfig(): AppConfig {
  const db = getDb();
  const rows = db.prepare("select key, value from settings").all() as { key: string; value: string }[];
  const map = Object.fromEntries(rows.map((item) => [item.key, item.value]));
  return {
    updateIntervalHours: Number(map.update_interval_hours ?? process.env.UPDATE_INTERVAL_HOURS ?? 12),
    dataPeriodDays: Number(map.data_period_days ?? 7),
    dataRetentionDays: Number(map.data_retention_days ?? process.env.DATA_RETENTION_DAYS ?? 90),
    xhsCookie: map.xhs_cookie ?? process.env.XHS_COOKIE ?? "",
    xhsUserAgent: map.xhs_user_agent ?? process.env.XHS_USER_AGENT ?? "",
    xhsRateLimitMs: Number(map.xhs_rate_limit_ms ?? process.env.XHS_RATE_LIMIT_MS ?? 2500),
    xhsMaxRetries: Number(map.xhs_max_retries ?? process.env.XHS_MAX_RETRIES ?? 2),
    xhsProxyUrl: map.xhs_proxy_url ?? process.env.XHS_PROXY_URL ?? ""
  };
}

export function saveConfig(config: AppConfig) {
  const db = getDb();
  const stmt = db.prepare(
    "insert into settings(key, value, updated_at) values(?, ?, datetime('now')) on conflict(key) do update set value = excluded.value, updated_at = excluded.updated_at"
  );
  const values: Record<string, string> = {
    update_interval_hours: String(config.updateIntervalHours),
    data_period_days: String(config.dataPeriodDays),
    data_retention_days: String(config.dataRetentionDays),
    xhs_cookie: config.xhsCookie,
    xhs_user_agent: config.xhsUserAgent,
    xhs_rate_limit_ms: String(config.xhsRateLimitMs),
    xhs_max_retries: String(config.xhsMaxRetries),
    xhs_proxy_url: config.xhsProxyUrl
  };
  runInTransaction(db, () => {
    for (const [key, value] of Object.entries(values)) stmt.run(key, value);
  });
}

export function getKeywords(): KeywordConfig[] {
  const db = getDb();
  const rows = db.prepare("select keyword, market, related_symbols, aliases from keywords where enabled = 1 order by id").all() as {
    keyword: string;
    market: Market;
    related_symbols: string;
    aliases: string;
  }[];
  return rows.map((row) => ({
    keyword: row.keyword,
    market: row.market,
    relatedSymbols: JSON.parse(row.related_symbols || "[]"),
    aliases: JSON.parse(row.aliases || "[]")
  }));
}

export function saveKeywords(items: KeywordConfig[]) {
  const db = getDb();
  const stmt = db.prepare(
    "insert into keywords(keyword, market, related_symbols, aliases, enabled, updated_at) values(?, ?, ?, ?, 1, datetime('now')) on conflict(keyword) do update set market = excluded.market, related_symbols = excluded.related_symbols, aliases = excluded.aliases, enabled = 1, updated_at = excluded.updated_at"
  );
  runInTransaction(db, () => {
    for (const item of items) {
      stmt.run(item.keyword, item.market, JSON.stringify(item.relatedSymbols), JSON.stringify(item.aliases));
    }
  });
}

function runInTransaction(db: DatabaseSync, fn: () => void) {
  db.exec("BEGIN");
  try {
    fn();
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function ensureColumn(db: DatabaseSync, table: string, column: string, definition: string) {
  const columns = db.prepare(`pragma table_info(${table})`).all() as { name: string }[];
  if (!columns.some((item) => item.name === column)) {
    db.exec(`alter table ${table} add column ${column} ${definition}`);
  }
}

type TopicRow = {
  id: number;
  keyword: string;
  market: Market;
  heat_score: number;
  growth_rate: number;
  comment_interaction_rate: number;
  comment_growth_rate: number;
  summary: string;
  source_url: string;
  related_symbols: string;
  price_change_pct: number | null;
  latest_price: number | null;
  fomo_score: number;
  updated_at: string;
};

type NoteRow = {
  id: number;
  title: string;
  body: string;
  author: string;
  published_at: string;
  likes: number;
  favorites: number;
  comment_count: number;
  comments_json: string;
  source_url: string;
};

type HistoryRow = {
  captured_at: string;
  heat_score: number;
  comment_count: number;
};

type PriceRow = {
  captured_at: string;
  price: number;
};

type FomoRow = {
  captured_at: string;
  fomo_score: number;
  comment_velocity: number;
  heat_growth: number;
  fomo_words: number;
  explosive_words: number;
  crowding: number;
};

function topicFromRow(row: TopicRow): Topic {
  return {
    id: row.id,
    keyword: row.keyword,
    market: row.market,
    heatScore: row.heat_score,
    growthRate: row.growth_rate,
    commentInteractionRate: row.comment_interaction_rate,
    commentGrowthRate: row.comment_growth_rate,
    summary: row.summary,
    sourceUrl: row.source_url,
    relatedSymbols: JSON.parse(row.related_symbols || "[]"),
    priceChangePct: row.price_change_pct,
    latestPrice: row.latest_price,
    fomoScore: row.fomo_score,
    updatedAt: row.updated_at
  };
}

function noteFromRow(row: NoteRow): XhsNote {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    author: row.author,
    publishedAt: row.published_at,
    likes: row.likes,
    favorites: row.favorites,
    commentCount: row.comment_count,
    comments: JSON.parse(row.comments_json || "[]"),
    sourceUrl: row.source_url
  };
}
