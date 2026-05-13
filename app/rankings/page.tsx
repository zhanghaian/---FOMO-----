import { getTopics } from "@/lib/db";
import { TopicTable } from "@/components/topic-table";

export default function RankingsPage({
  searchParams
}: {
  searchParams: { sort?: "heat" | "growth" | "commentGrowth" | "fomo"; period?: string };
}) {
  const sort = searchParams.sort ?? "heat";
  const period = searchParams.period ?? "7d";
  const topics = getTopics({ sort, period, limit: 50 });

  return (
    <div className="space-y-6">
      <div className="card rounded-lg p-6">
        <p className="text-sm uppercase tracking-[0.22em] text-gold">Rankings</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">热度榜页面</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
          支持综合热度、增长率、评论增长和 FOMO 排序。URL 参数可自定义：`?sort=growth&period=7d`。
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {[
            ["heat", "综合热度"],
            ["growth", "增长率榜"],
            ["commentGrowth", "评论增长榜"],
            ["fomo", "FOMO 榜"]
          ].map(([key, label]) => (
            <a
              key={key}
              href={`/rankings?sort=${key}&period=${period}`}
              className={`rounded border px-3 py-2 text-sm ${sort === key ? "border-gold bg-gold/10 text-gold" : "border-white/10 bg-white/[0.03] text-slate-300"}`}
            >
              {label}
            </a>
          ))}
        </div>
      </div>
      <TopicTable topics={topics} />
    </div>
  );
}
