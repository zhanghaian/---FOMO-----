import { NextResponse } from "next/server";
import { getTopicDetail } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const topic = getTopicDetail(Number(params.id));
  if (!topic) return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  return NextResponse.json({ data: topic });
}
