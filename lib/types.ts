export type Market = "us" | "cn" | "hk" | "crypto";

export type Topic = {
  id: number;
  keyword: string;
  market: Market;
  heatScore: number;
  growthRate: number;
  commentInteractionRate: number;
  commentGrowthRate: number;
  summary: string;
  sourceUrl: string;
  relatedSymbols: string[];
  priceChangePct: number | null;
  latestPrice: number | null;
  fomoScore: number;
  updatedAt: string;
};

export type TopicDetail = Topic & {
  notes: XhsNote[];
  heatHistory: SeriesPoint[];
  priceHistory: SeriesPoint[];
  commentHistory: SeriesPoint[];
  fomoHistory: SeriesPoint[];
  fomoBreakdown: FomoBreakdown;
};

export type XhsNote = {
  id: number;
  title: string;
  body: string;
  author: string;
  publishedAt: string;
  likes: number;
  favorites: number;
  commentCount: number;
  comments: string[];
  sourceUrl: string;
};

export type SeriesPoint = {
  date: string;
  value: number;
};

export type FomoBreakdown = {
  commentVelocity: number;
  heatGrowth: number;
  fomoWords: number;
  explosiveWords: number;
  crowding: number;
};

export type AppConfig = {
  updateIntervalHours: number;
  dataPeriodDays: number;
  dataRetentionDays: number;
  xhsCookie: string;
  xhsUserAgent: string;
  xhsRateLimitMs: number;
  xhsMaxRetries: number;
  xhsProxyUrl: string;
};

export type KeywordConfig = {
  keyword: string;
  market: Market;
  relatedSymbols: string[];
  aliases: string[];
};
