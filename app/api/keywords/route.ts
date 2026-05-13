import { NextResponse } from "next/server";
import { z } from "zod";
import { getKeywords, saveKeywords } from "@/lib/db";

export const dynamic = "force-dynamic";

const KeywordSchema = z.array(
  z.object({
    keyword: z.string().min(1),
    market: z.enum(["us", "cn", "hk", "crypto"]),
    relatedSymbols: z.array(z.string()),
    aliases: z.array(z.string())
  })
);

export async function GET() {
  return NextResponse.json({ data: getKeywords() });
}

export async function POST(request: Request) {
  const body = await request.json();
  const items = KeywordSchema.parse(body);
  saveKeywords(items);
  return NextResponse.json({ data: items });
}
