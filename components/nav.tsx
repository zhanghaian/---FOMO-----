import Link from "next/link";
import { Activity, BarChart3, Coins, Settings } from "lucide-react";

const links = [
  { href: "/", label: "首页", icon: Activity },
  { href: "/rankings", label: "热度榜", icon: BarChart3 },
  { href: "/categories", label: "分类", icon: Coins },
  { href: "/settings", label: "设置", icon: Settings }
];

export function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-ink/82 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-gold/40 bg-gold/10">
            <Activity className="h-5 w-5 text-gold" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold tracking-wide text-white">XHS Finance FOMO</div>
            <div className="truncate text-xs text-muted">小红书金融情绪监控</div>
          </div>
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto rounded-md border border-white/10 bg-white/[0.03] p-1">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <item.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
