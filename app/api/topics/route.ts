import { NextResponse } from "next/server";
import { getTopics } from "@/lib/db";
import type { Market } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const market = (searchParams.get("market") ?? "all") as Market | "all";
  const sort = (searchParams.get("sort") ?? "heat") as "heat" | "growth" | "commentGrowth" | "fomo";
  const period = searchParams.get("period") ?? "1d";
  const limit = Number(searchParams.get("limit") ?? 50);

  return NextResponse.json({
    data: getTopics({ market, sort, period, limit }),
    meta: { market, sort, period, limit, updatedAt: new Date().toISOString() }
  });
}
