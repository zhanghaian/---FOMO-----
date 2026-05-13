import { notFound } from "next/navigation";
import { MessageCircle, Star, ThumbsUp } from "lucide-react";
import { getTopicDetail } from "@/lib/db";
import { marketLabels } from "@/lib/keyword-map";
import { CompareChart, FomoRadar, TrendChart } from "@/components/charts";
import { FomoGauge } from "@/components/fomo-gauge";
import { formatNum, formatPct } from "@/lib/utils";

export default function TopicDetailPage({ params }: { params: { id: string } }) {
  const topic = getTopicDetail(Number(params.id));
  if (!topic) notFound();

  return (
    <div className="space-y-6">
      <section className="card rounded-lg p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div>
            <p className="text-sm text-gold">{marketLabels[topic.market]} · {topic.relatedSymbols.join(" / ")}</p>
            <h1 className="mt-3 text-4xl font-semibold text-white">{topic.keyword}</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">{topic.summary}</p>
          </div>
          <div className="grid min-w-72 grid-cols-2 gap-3 text-sm">
            <Metric label="综合热度" value={topic.heatScore.toFixed(0)} />
            <Metric label="增长率" value={`+${topic.growthRate.toFixed(1)}%`} tone="text-up" />
            <Metric label="评论增长" value={`+${topic.commentGrowthRate.toFixed(1)}%`} tone="text-gold" />
            <Metric label="当日涨跌" value={formatPct(topic.priceChangePct)} tone={topic.priceChangePct !== null && topic.priceChangePct < 0 ? "text-down" : "text-up"} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <FomoGauge value={topic.fomoScore} />
        <div className="card rounded-lg p-5">
          <h2 className="text-lg font-semibold text-white">FOMO 雷达</h2>
          <FomoRadar data={topic.fomoBreakdown} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel title="热度走势图"><TrendChart data={topic.heatHistory} label="热度" /></Panel>
        <Panel title="评论增长图"><TrendChart data={topic.commentHistory} color="#3b82f6" label="评论" /></Panel>
        <Panel title="小红书热度 vs 股价/币价 对比图"><CompareChart heat={topic.heatHistory} price={topic.priceHistory} /></Panel>
        <Panel title="FOMO 趋势变化"><TrendChart data={topic.fomoHistory} color="#ef4444" label="FOMO" /></Panel>
      </section>

      <section className="card rounded-lg p-5">
        <h2 className="text-lg font-semibold text-white">小红书内容摘要</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {topic.notes.map((note) => (
            <article key={note.id} className="rounded-md border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-medium text-white">{note.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">{note.author} · {note.publishedAt.slice(0, 16)}</p>
                </div>
                <a href={note.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-gold">来源帖子</a>
              </div>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">{note.body}</p>
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5" /> {formatNum(note.likes)}</span>
                <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5" /> {formatNum(note.favorites)}</span>
                <span className="inline-flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> {formatNum(note.commentCount)}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value, tone = "text-white" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`mt-2 text-lg font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card rounded-lg p-5">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {children}
    </div>
  );
}
