# API 文档

本项目 API 由 Next.js Route Handlers 提供，默认运行在 `http://localhost:3000`。

## GET /api/topics

查询话题榜单。

Query:

- `market`: `all | us | cn | hk | crypto`，默认 `all`
- `sort`: `heat | growth | commentGrowth | fomo`，默认 `heat`
- `period`: `1d | 7d | 30d`，当前用于前端筛选和后续扩展
- `limit`: 返回数量，默认 `50`

示例：

```bash
curl "http://localhost:3000/api/topics?sort=fomo&market=crypto"
```

## GET /api/topics/:id

查询话题详情，包含：

- 小红书笔记摘要
- 热度历史
- 评论增长历史
- 价格历史
- FOMO 历史和雷达拆解

```bash
curl "http://localhost:3000/api/topics/1"
```

## GET /api/config

读取本地后台配置。

```bash
curl "http://localhost:3000/api/config"
```

## POST /api/config

保存本地后台配置，会写入 SQLite `settings` 表。

```bash
curl -X POST "http://localhost:3000/api/config" \
  -H "Content-Type: application/json" \
  -d '{
    "updateIntervalHours": 12,
    "dataPeriodDays": 7,
    "dataRetentionDays": 90,
    "xhsCookie": "",
    "xhsUserAgent": "Mozilla/5.0",
    "xhsRateLimitMs": 2500,
    "xhsMaxRetries": 2,
    "xhsProxyUrl": ""
  }'
```

## POST /api/refresh

立即触发一次采集。采集优先真实小红书公开搜索页，失败后自动使用 mock 数据。

```bash
curl -X POST "http://localhost:3000/api/refresh"
```

## GET /api/keywords

读取关键词映射配置。

```bash
curl "http://localhost:3000/api/keywords"
```

## POST /api/keywords

保存自定义关键词配置。

```bash
curl -X POST "http://localhost:3000/api/keywords" \
  -H "Content-Type: application/json" \
  -d '[{"keyword":"AI算力","market":"us","relatedSymbols":["NVDA"],"aliases":["AI","算力"]}]'
```

## POST /api/import

上传 CSV 或 JSON 手动导入。

CSV 字段建议：

- `keyword`
- `title`
- `body`
- `likes`
- `favorites`
- `comment_count`
- `comments`
- `source_url`
- `published_at`

```bash
curl -X POST "http://localhost:3000/api/import" \
  -F "file=@./data/mock-notes.json"
```
