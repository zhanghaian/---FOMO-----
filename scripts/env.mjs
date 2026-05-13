export function loadEnv() {
  try {
    process.loadEnvFile(".env");
  } catch {
    // .env is optional; defaults are defined in code and .env.example.
  }
}
