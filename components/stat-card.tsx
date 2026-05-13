import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  title,
  value,
  hint,
  icon: Icon,
  tone = "neutral"
}: {
  title: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone?: "neutral" | "up" | "down" | "gold";
}) {
  return (
    <div className="card rounded-lg p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{title}</p>
          <p
            className={cn(
              "mt-2 text-3xl font-semibold",
              tone === "up" && "text-up",
              tone === "down" && "text-down",
              tone === "gold" && "text-gold"
            )}
          >
            {value}
          </p>
        </div>
        <div className="rounded-md border border-white/10 bg-white/[0.04] p-2">
          <Icon className="h-5 w-5 text-gold" />
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-400">{hint}</p>
    </div>
  );
}
