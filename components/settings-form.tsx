"use client";

import { useState } from "react";
import { RefreshCcw, Save, Upload } from "lucide-react";
import type { AppConfig, KeywordConfig } from "@/lib/types";
import { marketLabels } from "@/lib/keyword-map";

export function SettingsForm({ initialConfig, keywords }: { initialConfig: AppConfig; keywords: KeywordConfig[] }) {
  const [config, setConfig] = useState(initialConfig);
  const [keywordJson, setKeywordJson] = useState(JSON.stringify(keywords, null, 2));
  const [status, setStatus] = useState("");
  const [file, setFile] = useState<File | null>(null);

  async function save() {
    setStatus("保存中...");
    const res = await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config)
    });
    setStatus(res.ok ? "配置已保存" : "保存失败");
  }

  async function refresh() {
    setStatus("正在触发采集...");
    const res = await fetch("/api/refresh", { method: "POST" });
    setStatus(res.ok ? "采集完成" : "采集失败，已保留 mock 降级机制");
  }

  async function importData() {
    if (!file) return;
    setStatus("正在导入...");
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/import", { method: "POST", body: form });
    setStatus(res.ok ? "导入完成" : "导入失败");
  }

  async function saveKeywords() {
    setStatus("正在保存关键词...");
    try {
      const parsed = JSON.parse(keywordJson);
      const res = await fetch("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed)
      });
      setStatus(res.ok ? "关键词配置已保存" : "关键词配置保存失败");
    } catch {
      setStatus("关键词 JSON 格式错误");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <section className="card rounded-lg p-5">
        <h2 className="text-lg font-semibold text-white">数据更新时间管理</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="更新频率（小时）" value={config.updateIntervalHours} onChange={(v) => setConfig({ ...config, updateIntervalHours: Number(v) })} />
          <Field label="自定义数据周期（天）" value={config.dataPeriodDays} onChange={(v) => setConfig({ ...config, dataPeriodDays: Number(v) })} />
          <Field label="数据保存时间（天）" value={config.dataRetentionDays} onChange={(v) => setConfig({ ...config, dataRetentionDays: Number(v) })} />
          <Field label="请求频率限制（ms）" value={config.xhsRateLimitMs} onChange={(v) => setConfig({ ...config, xhsRateLimitMs: Number(v) })} />
          <Field label="失败重试次数" value={config.xhsMaxRetries} onChange={(v) => setConfig({ ...config, xhsMaxRetries: Number(v) })} />
          <Field label="代理接口预留" value={config.xhsProxyUrl} onChange={(v) => setConfig({ ...config, xhsProxyUrl: String(v) })} />
        </div>
        <label className="mt-4 block">
          <span className="text-sm text-slate-300">User-Agent</span>
          <textarea className="mt-2 h-20 w-full rounded-md border border-white/10 bg-black/20 p-3 text-sm text-white outline-none focus:border-gold" value={config.xhsUserAgent} onChange={(e) => setConfig({ ...config, xhsUserAgent: e.target.value })} />
        </label>
        <label className="mt-4 block">
          <span className="text-sm text-slate-300">小红书 Cookie</span>
          <textarea className="mt-2 h-32 w-full rounded-md border border-white/10 bg-black/20 p-3 text-sm text-white outline-none focus:border-gold" value={config.xhsCookie} onChange={(e) => setConfig({ ...config, xhsCookie: e.target.value })} placeholder="a1=...; web_session=...; webId=..." />
        </label>
        <div className="mt-5 flex flex-wrap gap-3">
          <button onClick={save} className="inline-flex items-center gap-2 rounded-md bg-gold px-4 py-2 text-sm font-medium text-black"><Save className="h-4 w-4" />保存配置</button>
          <button onClick={refresh} className="inline-flex items-center gap-2 rounded-md border border-white/10 px-4 py-2 text-sm text-white hover:bg-white/10"><RefreshCcw className="h-4 w-4" />立即更新</button>
        </div>
        {status && <p className="mt-4 text-sm text-gold">{status}</p>}
      </section>

      <aside className="space-y-6">
        <section className="card rounded-lg p-5">
          <h2 className="text-lg font-semibold text-white">CSV/JSON 手动导入</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">支持字段：keyword,title,body,likes,favorites,comment_count,comments,source_url,published_at。</p>
          <div className="mt-4 flex flex-col gap-3">
            <input type="file" accept=".csv,.json" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm text-slate-300" />
            <button onClick={importData} className="inline-flex w-fit items-center gap-2 rounded-md border border-white/10 px-4 py-2 text-sm text-white hover:bg-white/10">
              <Upload className="h-4 w-4" />导入数据
            </button>
          </div>
        </section>
        <section className="card rounded-lg p-5">
          <h2 className="text-lg font-semibold text-white">关键词管理</h2>
          <textarea
            className="mt-4 h-64 w-full rounded-md border border-white/10 bg-black/20 p-3 font-mono text-xs text-white outline-none focus:border-gold"
            value={keywordJson}
            onChange={(event) => setKeywordJson(event.target.value)}
          />
          <button onClick={saveKeywords} className="mt-3 inline-flex items-center gap-2 rounded-md border border-white/10 px-4 py-2 text-sm text-white hover:bg-white/10">
            <Save className="h-4 w-4" />保存关键词
          </button>
          <div className="mt-4 max-h-[280px] space-y-3 overflow-auto pr-1">
            {keywords.map((item) => (
              <div key={item.keyword} className="rounded-md border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-white">{item.keyword}</span>
                  <span className="text-xs text-gold">{marketLabels[item.market]}</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-400">{item.aliases.join(" / ")}</p>
                <p className="mt-2 text-xs text-slate-500">{item.relatedSymbols.join(", ")}</p>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string | number; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm text-slate-300">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-gold" />
    </label>
  );
}
