import { spawn } from "node:child_process";

const children = [
  spawn("npx", ["next", "dev"], { cwd: process.cwd(), stdio: "inherit", env: withNodeWarningDisabled() }),
  spawn(process.execPath, ["--disable-warning=ExperimentalWarning", "scripts/scheduler.mjs"], { cwd: process.cwd(), stdio: "inherit", env: withNodeWarningDisabled() })
];

for (const child of children) {
  child.on("close", (code) => {
    if (code && code !== 0) {
      for (const other of children) {
        if (other !== child && !other.killed) other.kill("SIGTERM");
      }
      process.exit(code);
    }
  });
}

process.on("SIGINT", () => {
  for (const child of children) child.kill("SIGINT");
  process.exit(0);
});

function withNodeWarningDisabled() {
  return {
    ...process.env,
    NODE_OPTIONS: `${process.env.NODE_OPTIONS || ""} --disable-warning=ExperimentalWarning`.trim()
  };
}
