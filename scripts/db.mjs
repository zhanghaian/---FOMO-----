import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

export function dbPath() {
  return path.resolve(process.cwd(), process.env.DATABASE_PATH || "./data/fomo.db");
}

export function openDb() {
  const file = dbPath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  return db;
}

export const schema = `
create table if not exists settings (
  key text primary key,
  value text not null,
  updated_at text not null default (datetime('now'))
);

create table if not exists keywords (
  id integer primary key autoincrement,
  keyword text not null unique,
  market text not null check(market in ('us','cn','hk','crypto')),
  related_symbols text not null default '[]',
  aliases text not null default '[]',
  enabled integer not null default 1,
  created_at text not null default (datetime('now')),
  updated_at text not null default (datetime('now'))
);

create table if not exists topics (
  id integer primary key autoincrement,
  keyword text not null,
  market text not null check(market in ('us','cn','hk','crypto')),
  heat_score real not null default 0,
  growth_rate real not null default 0,
  comment_interaction_rate real not null default 0,
  comment_growth_rate real not null default 0,
  summary text not null default '',
  source_url text not null default '',
  related_symbols text not null default '[]',
  price_change_pct real,
  latest_price real,
  fomo_score real not null default 0,
  is_active integer not null default 1,
  updated_at text not null default (datetime('now')),
  unique(keyword, market)
);

create table if not exists topic_history (
  id integer primary key autoincrement,
  topic_id integer not null references topics(id) on delete cascade,
  captured_at text not null,
  heat_score real not null,
  comment_count integer not null,
  likes integer not null,
  favorites integer not null,
  growth_rate real not null,
  comment_growth_rate real not null
);

create index if not exists idx_topic_history_topic_time on topic_history(topic_id, captured_at);

create table if not exists notes (
  id integer primary key autoincrement,
  topic_id integer not null references topics(id) on delete cascade,
  title text not null,
  body text not null,
  author text not null,
  published_at text not null,
  likes integer not null default 0,
  favorites integer not null default 0,
  comment_count integer not null default 0,
  comments_json text not null default '[]',
  source_url text not null,
  raw_json text not null default '{}',
  captured_at text not null default (datetime('now'))
);

create table if not exists comment_analysis (
  id integer primary key autoincrement,
  topic_id integer not null references topics(id) on delete cascade,
  note_id integer references notes(id) on delete cascade,
  comment_text text not null,
  sentiment text not null,
  fomo_terms text not null default '[]',
  created_at text not null default (datetime('now'))
);

create table if not exists prices (
  id integer primary key autoincrement,
  topic_id integer not null references topics(id) on delete cascade,
  symbol text not null,
  market text not null,
  price real not null,
  change_pct real,
  captured_at text not null
);

create index if not exists idx_prices_topic_time on prices(topic_id, captured_at);

create table if not exists fomo_history (
  id integer primary key autoincrement,
  topic_id integer not null references topics(id) on delete cascade,
  captured_at text not null,
  fomo_score real not null,
  comment_velocity real not null,
  heat_growth real not null,
  fomo_words real not null,
  explosive_words real not null,
  crowding real not null
);

create table if not exists collection_runs (
  id integer primary key autoincrement,
  started_at text not null,
  finished_at text,
  mode text not null,
  status text not null,
  message text not null default ''
);
`;

export function ensureSchema(db) {
  db.exec(schema);
  ensureColumn(db, "topics", "is_active", "integer not null default 1");
}

export function writeSetting(db, key, value) {
  db.prepare(
    "insert into settings(key, value, updated_at) values(?, ?, datetime('now')) on conflict(key) do update set value = excluded.value, updated_at = excluded.updated_at"
  ).run(key, String(value));
}

export function readSettings(db) {
  const rows = db.prepare("select key, value from settings").all();
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

export function runInTransaction(db, fn) {
  db.exec("BEGIN");
  try {
    fn();
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function ensureColumn(db, table, column, definition) {
  const columns = db.prepare(`pragma table_info(${table})`).all().map((row) => row.name);
  if (!columns.includes(column)) {
    db.exec(`alter table ${table} add column ${column} ${definition}`);
  }
}
