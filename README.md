# 金融热点热度监控网站

一个本地运行的“小红书金融 FOMO 情绪”监控网站。它像金融看盘工具，但核心不是行情终端，而是发现小红书上短时间爆火的金融话题、散户 FOMO 情绪、科技热点、AI/芯片/美股/加密货币讨论和评论区互动增长。
<img width="1259" height="946" alt="截屏2026-05-13 下午2 09 59" src="https://github.com/user-attachments/assets/4912a2d1-987a-4f3c-9f08-8a82d403f73d" />
<img width="1260" height="940" alt="截屏2026-05-13 下午2 08 16" src="https://github.com/user-attachments/assets/aca0c7fc-1a5c-4937-aca4-90919f8b726c" />

## 功能

- 今日爆火金融话题榜：先抓取热榜/发现页候选，再识别金融话题
- 近 7 天热度榜、增长率最快榜、评论增长榜
- FOMO 雷达指数，范围 0-100
- 市场分类：美股、A股、港股、加密货币
- 话题详情页：热度趋势、评论增长、价格对比、小红书内容摘要
- 小红书热度 vs 股价/币价 对比图
- 后台设置页：更新频率、数据周期、Cookie、User-Agent、代理预留、数据保存时间
- SQLite 本地数据库、自动任务调度、缓存和 mock 降级
- CSV/JSON 手动导入

## 技术栈

- 前端：Next.js、React、Tailwind CSS、Recharts、lucide-react
- 后端：Next.js API Routes
- 数据库：SQLite + better-sqlite3
- 采集器：Node.js fetch
- 调度：本地 Node 定时器，默认每 12 小时

## 本地运行

要求 Node.js 24 或更高版本。本项目使用 Node 24 自带 SQLite，避免额外安装原生 SQLite 依赖。

```bash
npm install
cp .env.example .env
npm run dev
```

项目内置 `.npmrc`，会把 npm 缓存放在当前目录的 `.npm-cache`，避免使用全局 `~/.npm` 缓存导致权限错误。

打开：

```text
http://localhost:3000
```

`npm install` 会自动执行 `scripts/init-db.mjs`，创建 SQLite 数据库并生成种子数据。如果需要手动重建：

```bash
npm run init-db
npm run seed
```

立即采集一次：

```bash
npm run collect
```

只启动前端和 API，不启动调度器：

```bash
npm run dev:web
```

## 环境变量

见 `.env.example`。

- `DATABASE_PATH`: SQLite 文件路径，默认 `./data/fomo.db`
- `XHS_COOKIE`: 小红书 Cookie，可为空
- `XHS_USER_AGENT`: 请求 User-Agent
- `XHS_RATE_LIMIT_MS`: 小红书请求间隔
- `XHS_MAX_RETRIES`: 失败重试次数
- `XHS_PROXY_URL`: 代理接口预留字段
- `UPDATE_INTERVAL_HOURS`: 自动更新频率，默认 12
- `DATA_RETENTION_DAYS`: 数据保留天数
- `ALPHAVANTAGE_API_KEY`、`FINNHUB_API_KEY`: 股票接口扩展预留

## 小红书 Cookie 获取教程

1. 使用 Chrome 登录小红书网页版。
2. 打开开发者工具：右键页面选择“检查”，或按 `Cmd + Option + I`。
3. 切换到 `Network` 页面。
4. 刷新小红书页面，或在搜索框搜索一个金融关键词，例如 `AI算力`。
5. 在 Network 请求列表里点开 `search_result`、`api`、`web/v1` 等小红书域名请求。
6. 在右侧 `Headers` 里找到 `Request Headers`。
7. 找到 `Cookie` 字段，复制完整字符串。
8. 保存到 `.env`：

```bash
XHS_COOKIE="a1=...; webId=...; web_session=...; websectiga=..."
```

重要字段通常包括：

- `a1`
- `webId`
- `web_session`
- `websectiga`
- `xsecappid`

避免失效的方法：

- 不要频繁并发请求，保持 `XHS_RATE_LIMIT_MS` 在 2000ms 以上。
- 不要在多台机器同时复用同一个 Cookie 高频采集。
- Cookie 失效时重新登录小红书，并重复上面的复制流程。
- 如果小红书返回 401、403、验证页或空结果，优先更新 Cookie。

## 数据采集降级链路

采集优先级：

1. 带 Cookie/User-Agent 抓取小红书热榜/发现页候选帖子。
2. 代理接口返回具体热帖列表，字段至少包含 `title`、`body`、`sourceUrl`。
3. 从候选帖里按金融关键词规则自动分类并聚合热度。
4. 失败后自动生成 mock 热榜数据，并写入同一套数据库结构。

小红书没有稳定公开金融热词 API，因此真实采集代码放在 `scripts/xhs-client.mjs`。系统不再把固定关键词当作榜单来源，而是把关键词配置作为“金融话题分类规则”。来源优先保存具体帖子链接 `/explore/<noteId>`，解析不到具体帖子时才降级为空或页面级候选。

## 热度评分

综合热度为 0-100，计算维度：

- 关键词出现次数
- 评论数量
- 评论增长速度
- 点赞数量
- 收藏数量
- 发布时间衰减
- 互动频率
- 热度增长率

核心代码在 `scripts/scoring.mjs` 和 `lib/scoring.ts`。

## FOMO 指数

FOMO 范围 0-100，维度：

- 评论增长速度
- 热度增长率
- 暴涨相关词频
- “上车”“踏空”“梭哈”“还能买吗”“翻倍”“AI”“牛市”“起飞”“抄底”等词频

分级：

- 0-30：低 FOMO
- 30-60：中等
- 60-80：高 FOMO
- 80-100：极端 FOMO

## 关键词映射

默认映射位于：

- `lib/keyword-map.ts`
- `scripts/constants.mjs`
- `data/keyword-map.json`

示例：

- AI算力：NVDA、AMD、MU、台积电、HBM
- 加密：BTC、ETH、SOL、Meme、ETF
- A股：半导体、机器人、券商、AI、消费电子

## 数据库

数据库 schema 在 `docs/schema.sql`。核心表：

- `topics`: 当前话题榜
- `topic_history`: 热度历史表
- `keywords`: 关键词表
- `notes`: 小红书内容
- `comment_analysis`: 评论分析表
- `prices`: 股票/币价表
- `settings`: 配置表
- `fomo_history`: FOMO 指数表
- `collection_runs`: 采集任务记录

## API

详见 `docs/API.md`。

常用接口：

- `GET /api/topics`
- `GET /api/topics/:id`
- `GET /api/config`
- `POST /api/config`
- `GET /api/keywords`
- `POST /api/keywords`
- `POST /api/refresh`
- `POST /api/import`

## 风险提示

本网站仅统计公开网络内容与市场数据，不构成任何投资建议。
