import { SettingsForm } from "@/components/settings-form";
import { getConfig, getKeywords } from "@/lib/db";

export default function SettingsPage() {
  const config = getConfig();
  const keywords = getKeywords();
  return (
    <div className="space-y-6">
      <div className="card rounded-lg p-6">
        <p className="text-sm uppercase tracking-[0.22em] text-gold">Settings</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">后台设置页</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
          本地配置会保存到 SQLite；采集器和 API 下次读取时自动生效。无需登录，适合本地个人工作台。
        </p>
      </div>
      <SettingsForm initialConfig={config} keywords={keywords} />
    </div>
  );
}
