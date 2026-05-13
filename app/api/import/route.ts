import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const tmpPath = path.join(os.tmpdir(), `xhs-import-${Date.now()}-${file.name}`);
  await fs.writeFile(tmpPath, buffer);

  return new Promise<Response>((resolve) => {
    const child = spawn(process.execPath, ["scripts/import-data.mjs", tmpPath], {
      cwd: process.cwd(),
      env: process.env
    });
    let output = "";
    let error = "";
    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      error += chunk.toString();
    });
    child.on("close", async (code) => {
      await fs.rm(tmpPath, { force: true });
      resolve(NextResponse.json({ ok: code === 0, output, error }, { status: code === 0 ? 200 : 500 }));
    });
  });
}
