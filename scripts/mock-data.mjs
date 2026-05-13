const marketTalk = {
  low: [
    "这个方向先观察，没必要追太急",
    "看了一圈，讨论热度有上来但还不算拥挤",
    "等数据确认，别因为热搜就乱买"
  ],
  medium: [
    "很多人在问要不要上车，感觉情绪起来了",
    "评论区开始讨论踏空，但分歧还挺大",
    "热度涨得快，仓位还是要控制"
  ],
  high: [
    "现在还能买吗，感觉又要起飞了",
    "踏空太难受，准备等回调上车",
    "评论区全是牛市味道，FOMO 明显升温"
  ],
  extreme: [
    "已经梭哈了，别让我踏空下一波",
    "还能买吗，感觉要翻倍起飞",
    "满屏都在喊牛市和上车，太极端了"
  ]
};

export function mockHotFeed(now = new Date()) {
  const items = [
    hot("宇树机器人刷屏，具身智能又冲上热榜", "宇树机器人", "机器人", "cn", ["300124.SZ", "002230.SZ"], 18400, 2900, 1460, 58, 46, "high", 1),
    hot("黄金价格再创新高，小红书开始晒金条收益", "黄金避险", "黄金", "hk", ["GLD", "GC=F"], 12600, 2100, 690, 34, 22, "medium", 2),
    hot("英伟达财报前夜，AI 算力笔记互动升温", "英伟达财报", "AI算力", "us", ["NVDA", "AMD", "TSM"], 16200, 2500, 980, 47, 36, "high", 3),
    hot("比特币回到关键位置，ETF 资金流入被热议", "比特币 ETF", "BTC", "crypto", ["BTCUSDT", "BTC"], 15100, 1880, 820, 41, 29, "medium", 4),
    hot("港股互联网突然拉升，腾讯阿里美团被重新讨论", "港股互联网", "港股科技", "hk", ["0700.HK", "9988.HK", "3690.HK"], 11700, 1320, 430, 26, 18, "low", 5),
    hot("存储芯片涨价传闻扩散，HBM 和半导体热度上行", "HBM 存储", "半导体", "cn", ["688981.SS", "002371.SZ"], 13900, 1740, 620, 38, 27, "medium", 6),
    hot("券商板块午后异动，牛市旗手又被提起", "券商异动", "券商", "cn", ["600030.SS", "601688.SS"], 9800, 1180, 520, 31, 34, "high", 7),
    hot("SOL 链 Meme 交易回暖，但评论区分歧很大", "SOL Meme", "SOL Meme", "crypto", ["SOLUSDT", "SOL"], 8600, 980, 360, 22, 18, "medium", 8),
    hot("消费电子订单传闻发酵，苹果链讨论回升", "苹果链", "消费电子", "cn", ["002475.SZ", "002241.SZ"], 7300, 760, 220, 15, 12, "low", 9),
    hot("以太坊 ETF 预期降温，讨论还在但追涨情绪下降", "以太坊 ETF", "ETH", "crypto", ["ETHUSDT", "ETH"], 6900, 710, 240, 12, 9, "low", 10),
    nonFinancial("春夏穿搭模板突然火了", 15400, 1200, 430, 11),
    nonFinancial("五一错峰旅行攻略收藏暴涨", 13200, 1800, 330, 12),
    nonFinancial("低卡早餐合集被疯狂收藏", 10800, 1600, 210, 13),
    nonFinancial("考研复习时间表冲上热门", 9600, 900, 280, 14)
  ];

  return items.map((item, index) => ({
    ...item,
    publishedAt: new Date(now.getTime() - (index * 2 + 1) * 36e5).toISOString(),
    sourceUrl: `https://www.xiaohongshu.com/explore/65fomo${String(index + 1).padStart(18, "0")}`
  }));
}

export function mockNotesForKeyword(item, now = new Date()) {
  return mockHotFeed(now)
    .filter((note) => note.ruleKeyword === item.keyword || note.topicKeyword === item.keyword)
    .slice(0, 5);
}

export function mockPrice(symbol, market, step = 0) {
  const seed = symbol.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const base = market === "crypto" ? seed * 8 : seed / 5;
  const wave = Math.sin((Date.now() / 86400000 + step + seed) / 2) * 4;
  const price = Number(Math.max(1, base + wave).toFixed(market === "crypto" ? 2 : 3));
  const changePct = Number((Math.sin(seed + step) * 4.8).toFixed(2));
  return { price, changePct };
}

function hot(title, topicKeyword, ruleKeyword, market, relatedSymbols, likes, favorites, commentCount, heatGrowthRate, commentGrowthRate, intensity, offset) {
  const comments = marketTalk[intensity];
  return {
    title,
    topicKeyword,
    ruleKeyword,
    market,
    relatedSymbols,
    body: `${title}。热榜互动正在放大，相关讨论集中在 ${relatedSymbols.join("、")}，系统从热榜候选中识别为金融话题。`,
    author: `热榜观察_${offset}`,
    likes,
    favorites,
    commentCount,
    heatGrowthRate,
    commentGrowthRate,
    comments,
    raw: { source: "mock-hot-feed", intensity }
  };
}

function nonFinancial(title, likes, favorites, commentCount, offset) {
  return {
    title,
    topicKeyword: "",
    ruleKeyword: "",
    market: "",
    relatedSymbols: [],
    body: `${title}，这是热榜里的非金融内容，应该被金融分类器过滤掉。`,
    author: `生活热榜_${offset}`,
    likes,
    favorites,
    commentCount,
    heatGrowthRate: 18,
    commentGrowthRate: 10,
    comments: ["收藏了", "这个有用", "准备试试"],
    raw: { source: "mock-hot-feed", nonFinancial: true }
  };
}
