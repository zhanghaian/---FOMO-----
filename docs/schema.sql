create table settings (
  key text primary key,
  value text not null,
  updated_at text not null default (datetime('now'))
);

create table keywords (
  id integer primary key autoincrement,
  keyword text not null unique,
  market text not null check(market in ('us','cn','hk','crypto')),
  related_symbols text not null default '[]',
  aliases text not null default '[]',
  enabled integer not null default 1,
  created_at text not null default (datetime('now')),
  updated_at text not null default (datetime('now'))
);

create table topics (
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

create table topic_history (
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

create table notes (
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

create table comment_analysis (
  id integer primary key autoincrement,
  topic_id integer not null references topics(id) on delete cascade,
  note_id integer references notes(id) on delete cascade,
  comment_text text not null,
  sentiment text not null,
  fomo_terms text not null default '[]',
  created_at text not null default (datetime('now'))
);

create table prices (
  id integer primary key autoincrement,
  topic_id integer not null references topics(id) on delete cascade,
  symbol text not null,
  market text not null,
  price real not null,
  change_pct real,
  captured_at text not null
);

create table fomo_history (
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

create table collection_runs (
  id integer primary key autoincrement,
  started_at text not null,
  finished_at text,
  mode text not null,
  status text not null,
  message text not null default ''
);
