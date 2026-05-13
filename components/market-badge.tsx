import { marketLabels } from "@/lib/keyword-map";
import type { Market } from "@/lib/types";

export function MarketBadge({ market }: { market: Market }) {
  return (
    <span className="inline-flex items-center rounded border border-gold/30 bg-gold/10 px-2 py-1 text-xs text-gold">
      {marketLabels[market]}
    </span>
  );
}
