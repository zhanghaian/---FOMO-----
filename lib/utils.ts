import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

export function formatPct(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "休市/无数据";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function formatNum(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  if (value >= 10000) return `${(value / 10000).toFixed(1)}万`;
  return Math.round(value).toLocaleString("zh-CN");
}

export function fomoLabel(score: number) {
  if (score < 30) return "低 FOMO";
  if (score < 60) return "中等";
  if (score < 80) return "高 FOMO";
  return "极端 FOMO";
}

export function fomoColor(score: number) {
  if (score < 30) return "text-sky-300";
  if (score < 60) return "text-gold";
  if (score < 80) return "text-orange-300";
  return "text-red-300";
}
