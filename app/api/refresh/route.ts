import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import path from "node:path";

export const dynamic = "force-dynamic";

export async function POST() {
  const scriptPath = path.join(process.cwd(), "scripts", "collect.mjs");

  return new Promise<Response>((resolve) => {
    const child = spawn(process.execPath, [scriptPath], {
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
    child.on("close", (code) => {
      resolve(
        NextResponse.json({
          ok: code === 0,
          output: output.trim(),
          error: error.trim(),
          code
        }, { status: code === 0 ? 200 : 500 })
      );
    });
  });
}
