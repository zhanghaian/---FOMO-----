import { NextResponse } from "next/server";
import { z } from "zod";
import { getConfig, saveConfig } from "@/lib/db";

export const dynamic = "force-dynamic";

const ConfigSchema = z.object({
  updateIntervalHours: z.coerce.number().min(1).max(168),
  dataPeriodDays: z.coerce.number().min(1).max(365),
  dataRetentionDays: z.coerce.number().min(7).max(3650),
  xhsCookie: z.string().optional().default(""),
  xhsUserAgent: z.string().optional().default(""),
  xhsRateLimitMs: z.coerce.number().min(500).max(60000),
  xhsMaxRetries: z.coerce.number().min(0).max(8),
  xhsProxyUrl: z.string().optional().default("")
});

export async function GET() {
  return NextResponse.json({ data: getConfig() });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = ConfigSchema.parse(body);
  saveConfig(parsed);
  return NextResponse.json({ data: parsed });
}
