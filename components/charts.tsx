"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { FomoBreakdown, SeriesPoint } from "@/lib/types";

const tick = { fill: "#94a3b8", fontSize: 12 };

export function TrendChart({ data, color = "#eabf6b", label = "热度" }: { data: SeriesPoint[]; color?: string; label?: string }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`fill-${label}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#243040" strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={tick} tickFormatter={(value) => String(value).slice(5, 10)} />
          <YAxis tick={tick} />
          <Tooltip contentStyle={{ background: "#10141b", border: "1px solid #2b3340", borderRadius: 8 }} />
          <Area type="monotone" dataKey="value" name={label} stroke={color} fill={`url(#fill-${label})`} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CompareChart({ heat, price }: { heat: SeriesPoint[]; price: SeriesPoint[] }) {
  const rows = heat.map((item, index) => ({
    date: item.date,
    heat: item.value,
    price: price[index]?.value ?? null
  }));
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <LineChart data={rows}>
          <CartesianGrid stroke="#243040" strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={tick} tickFormatter={(value) => String(value).slice(5, 10)} />
          <YAxis yAxisId="left" tick={tick} />
          <YAxis yAxisId="right" orientation="right" tick={tick} />
          <Tooltip contentStyle={{ background: "#10141b", border: "1px solid #2b3340", borderRadius: 8 }} />
          <Line yAxisId="left" type="monotone" dataKey="heat" name="小红书热度" stroke="#eabf6b" strokeWidth={2} dot={false} />
          <Line yAxisId="right" type="monotone" dataKey="price" name="股价/币价" stroke="#22c55e" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FomoRadar({ data }: { data: FomoBreakdown }) {
  const rows = [
    { name: "评论速度", value: data.commentVelocity },
    { name: "热度增长", value: data.heatGrowth },
    { name: "FOMO 词", value: data.fomoWords },
    { name: "暴涨词", value: data.explosiveWords },
    { name: "拥挤度", value: data.crowding }
  ];
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <RadarChart data={rows}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis dataKey="name" tick={tick} />
          <Radar dataKey="value" stroke="#eabf6b" fill="#eabf6b" fillOpacity={0.28} />
          <Tooltip contentStyle={{ background: "#10141b", border: "1px solid #2b3340", borderRadius: 8 }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RankingBars({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ left: 18 }}>
          <CartesianGrid stroke="#243040" strokeDasharray="3 3" />
          <XAxis type="number" tick={tick} />
          <YAxis type="category" dataKey="name" tick={tick} width={76} />
          <Tooltip contentStyle={{ background: "#10141b", border: "1px solid #2b3340", borderRadius: 8 }} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((_, index) => (
              <Cell key={index} fill={index < 3 ? "#eabf6b" : "#3b82f6"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
