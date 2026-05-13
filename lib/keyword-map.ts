import type { KeywordConfig, Market } from "./types";

export const marketLabels: Record<Market, string> = {
  us: "美股",
  cn: "A股",
  hk: "港股",
  crypto: "加密货币"
};

export const defaultKeywordMap: KeywordConfig[] = [
  {
    keyword: "AI算力",
    market: "us",
    relatedSymbols: ["NVDA", "AMD", "MU", "TSM"],
    aliases: ["AI", "算力", "英伟达", "HBM", "台积电", "芯片"]
  },
  {
    keyword: "美股科技",
    market: "us",
    relatedSymbols: ["NVDA", "AAPL", "MSFT", "GOOGL", "META"],
    aliases: ["纳指", "七姐妹", "美股", "科技股", "财报"]
  },
  {
    keyword: "半导体",
    market: "cn",
    relatedSymbols: ["688981.SS", "002371.SZ", "688012.SS"],
    aliases: ["芯片", "光刻机", "存储", "半导体", "国产替代"]
  },
  {
    keyword: "机器人",
    market: "cn",
    relatedSymbols: ["300124.SZ", "002230.SZ", "002031.SZ"],
    aliases: ["人形机器人", "具身智能", "自动化", "机器人"]
  },
  {
    keyword: "券商",
    market: "cn",
    relatedSymbols: ["600030.SS", "601688.SS", "300059.SZ"],
    aliases: ["牛市旗手", "证券", "券商", "成交量", "融资"]
  },
  {
    keyword: "港股科技",
    market: "hk",
    relatedSymbols: ["0700.HK", "9988.HK", "3690.HK", "1810.HK"],
    aliases: ["恒科", "港股", "腾讯", "阿里", "美团", "小米"]
  },
  {
    keyword: "BTC",
    market: "crypto",
    relatedSymbols: ["BTCUSDT", "BTC"],
    aliases: ["比特币", "BTC", "Bitcoin", "现货ETF", "减半"]
  },
  {
    keyword: "ETH",
    market: "crypto",
    relatedSymbols: ["ETHUSDT", "ETH"],
    aliases: ["以太坊", "ETH", "Layer2", "质押", "ETF"]
  },
  {
    keyword: "SOL Meme",
    market: "crypto",
    relatedSymbols: ["SOLUSDT", "SOL"],
    aliases: ["SOL", "Meme", "土狗", "链上", "Pump"]
  },
  {
    keyword: "消费电子",
    market: "cn",
    relatedSymbols: ["002475.SZ", "002241.SZ", "601138.SS"],
    aliases: ["苹果链", "AI手机", "MR", "消费电子", "端侧AI"]
  }
];

export const fomoWords = [
  "上车",
  "踏空",
  "梭哈",
  "还能买吗",
  "翻倍",
  "AI",
  "牛市",
  "起飞",
  "抄底",
  "爆拉",
  "暴涨",
  "一夜暴富",
  "满仓"
];

export const explosiveWords = ["爆火", "涨停", "新高", "翻倍", "狂飙", "起飞", "暴涨"];
