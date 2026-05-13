import { mockPrice } from "./mock-data.mjs";

export async function fetchPrice(symbols, market) {
  const primary = symbols?.[0];
  if (!primary) return { symbol: "", price: null, changePct: null, source: "none" };

  if (market === "crypto") {
    const binanceSymbol = primary.endsWith("USDT") ? primary : `${primary.replace(/USDT$/, "")}USDT`;
    try {
      const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${encodeURIComponent(binanceSymbol)}`, { signal: AbortSignal.timeout(3500) });
      if (!res.ok) throw new Error(`Binance ${res.status}`);
      const data = await res.json();
      return {
        symbol: binanceSymbol,
        price: Number(data.lastPrice),
        changePct: Number(data.priceChangePercent),
        source: "binance"
      };
    } catch {
      const fallback = await coingeckoFallback(primary).catch(() => null);
      if (fallback) return fallback;
    }
  }

  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(primary)}?range=5d&interval=1d`, { signal: AbortSignal.timeout(3500) });
    if (!res.ok) throw new Error(`Yahoo ${res.status}`);
    const data = await res.json();
    const result = data.chart?.result?.[0];
    const quote = result?.meta;
    if (!quote?.regularMarketPrice) throw new Error("Missing quote");
    return {
      symbol: primary,
      price: Number(quote.regularMarketPrice),
      changePct: isMarketOpen(market) && quote.chartPreviousClose ? Number((((quote.regularMarketPrice - quote.chartPreviousClose) / quote.chartPreviousClose) * 100).toFixed(2)) : null,
      source: "yahoo"
    };
  } catch {
    const p = mockPrice(primary, market);
    return { symbol: primary, price: p.price, changePct: market === "crypto" || isMarketOpen(market) ? p.changePct : null, source: "mock" };
  }
}

async function coingeckoFallback(symbol) {
  const idMap = { BTC: "bitcoin", BTCUSDT: "bitcoin", ETH: "ethereum", ETHUSDT: "ethereum", SOL: "solana", SOLUSDT: "solana" };
  const id = idMap[symbol] || idMap[symbol.replace("USDT", "")];
  if (!id) return null;
  const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd&include_24hr_change=true`, { signal: AbortSignal.timeout(3500) });
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
  const data = await res.json();
  return {
    symbol,
    price: Number(data[id].usd),
    changePct: Number(data[id].usd_24h_change?.toFixed(2)),
    source: "coingecko"
  };
}

export function isMarketOpen(market, date = new Date()) {
  if (market === "crypto") return true;
  const day = date.getUTCDay();
  if (day === 0 || day === 6) return false;
  const minutes = date.getUTCHours() * 60 + date.getUTCMinutes();
  if (market === "us") return minutes >= 13 * 60 + 30 && minutes <= 20 * 60;
  if (market === "hk") return minutes >= 1 * 60 + 30 && minutes <= 8 * 60;
  if (market === "cn") return minutes >= 1 * 60 + 30 && minutes <= 7 * 60;
  return false;
}
