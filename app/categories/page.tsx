import { getTopics } from "@/lib/db";
import { marketLabels } from "@/lib/keyword-map";
import type { Market } from "@/lib/types";
import { TopicTable } from "@/components/topic-table";

const markets: Market[] = ["us", "cn", "hk", "crypto"];

export default function CategoriesPage({ searchParams }: { searchParams: { market?: Market } }) {
  const active = searchParams.market ?? "us";
  const topics = getTopics({ market: active, sort: "heat", limit: 30 });

  return (
    <div className="space-y-6">
      <div className="card rounded-lg p-6">
        <p className="text-sm uppercase tracking-[0.22em] text-gold">Markets</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">市场分类</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
          根据关键词映射自动归类到美股、A股、港股和加密货币；可在设置页扩展关键词和相关标的。
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {markets.map((market) => (
            <a
              key={market}
              href={`/categories?market=${market}`}
              className={`rounded border px-3 py-2 text-sm ${active === market ? "border-gold bg-gold/10 text-gold" : "border-white/10 bg-white/[0.03] text-slate-300"}`}
            >
              {marketLabels[market]}
            </a>
          ))}
        </div>
      </div>
      <TopicTable topics={topics} />
    </div>
  );
}
