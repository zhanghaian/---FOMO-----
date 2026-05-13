import { Flame, RefreshCcw, TrendingUp, Zap } from "lucide-react";
import { getTopics } from "@/lib/db";
import { FomoGauge } from "@/components/fomo-gauge";
import { RankingBars, TrendChart } from "@/components/charts";
import { StatCard } from "@/components/stat-card";
import { TopicTable } from "@/components/topic-table";

export default function HomePage() {
  const hot = getTopics({ sort: "heat", limit: 10 });
  const fastest = getTopics({ sort: "growth", limit: 5 });
  const top = hot[0];
  const avgFomo = hot.length ? hot.reduce((sum, item) => sum + item.fomoScore, 0) / hot.length : 0;
  const avgGrowth = hot.length ? hot.reduce((sum, item) => sum + item.growthRate, 0) / hot.length : 0;

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="card rounded-lg p-6 sm:p-8">
          <p className="text-sm uppercase tracking-[0.24em] text-gold">Xiaohongshu Finance FOMO Monitor</p>
          <h1 className="mt-5 max-w-3xl text-balance text-4xl font-semibold leading-tight text-white sm:text-5xl">
            用小红书讨论热度监控金融 FOMO 情绪
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
            自动跟踪 AI、芯片、美股、A股、港股和加密货币话题，结合评论增长、点赞收藏、热词和价格变化生成 0-100 热度与 FOMO 指数。
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <StatCard title="今日爆火" value={top?.keyword ?? "-"} hint="综合热度最高话题" icon={Flame} tone="gold" />
            <StatCard title="平均增长率" value={`+${avgGrowth.toFixed(1)}%`} hint="榜单话题短周期增长" icon={TrendingUp} tone="up" />
            <StatCard title="更新机制" value="12h" hint="默认自动调度，可在设置页修改" icon={RefreshCcw} />
          </div>
        </div>
        <FomoGauge value={avgFomo} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="card rounded-lg p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">增长率最快榜</h2>
              <p className="mt-1 text-sm text-slate-400">短时间突然爆火的金融话题</p>
            </div>
            <Zap className="h-5 w-5 text-gold" />
          </div>
          <RankingBars data={fastest.map((item) => ({ name: item.keyword, value: Number(item.growthRate.toFixed(1)) }))} />
        </div>
        <div className="card rounded-lg p-5">
          <h2 className="text-lg font-semibold text-white">今日热点热度走势</h2>
          <p className="mt-1 text-sm text-slate-400">mock 或真实采集后都会沉淀到历史表</p>
          <TrendChart
            label="热度"
            data={hot.slice(0, 7).map((item) => ({ date: item.keyword, value: item.heatScore }))}
          />
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">今日爆火金融话题榜</h2>
            <p className="mt-1 text-sm text-slate-400">从热榜候选中识别金融话题，包含具体来源帖子、互动增长和价格变化</p>
          </div>
        </div>
        <TopicTable topics={hot} />
      </section>
    </div>
  );
}
