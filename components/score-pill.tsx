import { cn, fomoColor, fomoLabel } from "@/lib/utils";

export function ScorePill({ value, type = "heat" }: { value: number; type?: "heat" | "fomo" }) {
  const color = type === "fomo" ? fomoColor(value) : value >= 70 ? "text-up" : value >= 45 ? "text-gold" : "text-slate-300";
  return (
    <span className={cn("inline-flex min-w-16 items-center justify-center rounded border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-semibold", color)}>
      {value.toFixed(0)}
      {type === "fomo" ? ` · ${fomoLabel(value)}` : ""}
    </span>
  );
}
