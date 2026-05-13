import { fomoColor, fomoLabel } from "@/lib/utils";

export function FomoGauge({ value }: { value: number }) {
  const degree = -120 + (Math.min(100, Math.max(0, value)) / 100) * 240;
  return (
    <div className="card rounded-lg p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">FOMO 雷达指数</p>
          <p className={`mt-2 text-4xl font-semibold ${fomoColor(value)}`}>{value.toFixed(0)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-400">状态</p>
          <p className="mt-2 text-lg font-medium text-white">{fomoLabel(value)}</p>
        </div>
      </div>
      <div className="relative mx-auto mt-8 h-36 w-72 max-w-full overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 h-72 rounded-full border-[18px] border-slate-800" />
        <div className="absolute inset-x-0 bottom-0 h-72 rounded-full border-[18px] border-transparent border-t-sky-400 border-r-gold border-b-red-400 border-l-up opacity-80" />
        <div
          className="absolute bottom-0 left-1/2 h-28 w-1 origin-bottom rounded-full bg-white shadow-glow"
          style={{ transform: `translateX(-50%) rotate(${degree}deg)` }}
        />
        <div className="absolute bottom-0 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-white" />
      </div>
      <div className="mt-5 h-2 overflow-hidden rounded bg-slate-800">
        <div className="h-full rounded bg-gradient-to-r from-sky-400 via-gold to-red-400" style={{ width: `${value}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-xs text-slate-500">
        <span>低</span>
        <span>中等</span>
        <span>高</span>
        <span>极端</span>
      </div>
    </div>
  );
}
