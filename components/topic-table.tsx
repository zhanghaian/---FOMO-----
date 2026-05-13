"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { Topic } from "@/lib/types";
import { formatPct } from "@/lib/utils";
import { MarketBadge } from "./market-badge";
import { ScorePill } from "./score-pill";

export function TopicTable({ topics }: { topics: Topic[] }) {
  return (
    <div className="card overflow-hidden rounded-lg">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3">关键词</th>
              <th className="px-4 py-3">市场</th>
              <th className="px-4 py-3">综合热度</th>
              <th className="px-4 py-3">增长率</th>
              <th className="px-4 py-3">评论互动率</th>
              <th className="px-4 py-3">评论增长</th>
              <th className="px-4 py-3">相关标的</th>
              <th className="px-4 py-3">当日涨跌</th>
              <th className="px-4 py-3">FOMO</th>
              <th className="px-4 py-3">来源帖子</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {topics.map((topic) => (
              <tr key={topic.id} className="transition hover:bg-white/[0.035]">
                <td className="px-4 py-4">
                  <Link href={`/topics/${topic.id}`} className="font-medium text-white hover:text-gold">
                    {topic.keyword}
                  </Link>
                  <p className="mt-1 max-w-64 truncate text-xs text-slate-400">{topic.summary}</p>
                </td>
                <td className="px-4 py-4"><MarketBadge market={topic.market} /></td>
                <td className="px-4 py-4"><ScorePill value={topic.heatScore} /></td>
                <td className="px-4 py-4 text-up">+{topic.growthRate.toFixed(1)}%</td>
                <td className="px-4 py-4">{topic.commentInteractionRate.toFixed(1)}%</td>
                <td className="px-4 py-4 text-gold">+{topic.commentGrowthRate.toFixed(1)}%</td>
                <td className="px-4 py-4 text-slate-300">{topic.relatedSymbols.join(" / ")}</td>
                <td className={`px-4 py-4 ${topic.priceChangePct !== null && topic.priceChangePct < 0 ? "text-down" : "text-up"}`}>
                  {formatPct(topic.priceChangePct)}
                </td>
                <td className="px-4 py-4"><ScorePill value={topic.fomoScore} type="fomo" /></td>
                <td className="px-4 py-4">
                  <a href={topic.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-slate-300 hover:text-gold">
                    帖子 <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
