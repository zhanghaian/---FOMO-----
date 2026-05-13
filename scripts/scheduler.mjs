import { spawn } from "node:child_process";
import { ensureSchema, openDb, readSettings } from "./db.mjs";
import { loadEnv } from "./env.mjs";

loadEnv();

function intervalMs() {
  const db = openDb();
  ensureSchema(db);
  const settings = readSettings(db);
  db.close();
  const hours = Number(settings.update_interval_hours || process.env.UPDATE_INTERVAL_HOURS || 12);
  return Math.max(1, hours) * 60 * 60 * 1000;
}

function runCollect() {
  const child = spawn(process.execPath, ["scripts/collect.mjs"], {
    cwd: process.cwd(),
    stdio: "inherit",
    env: process.env
  });
  child.on("close", (code) => {
    if (code !== 0) console.error(`collector exited with ${code}`);
  });
}

console.log("Scheduler started. First collection will run now.");
runCollect();

let timer = setInterval(runCollect, intervalMs());
setInterval(() => {
  clearInterval(timer);
  timer = setInterval(runCollect, intervalMs());
}, 10 * 60 * 1000);
