import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#07090d",
        panel: "#10141b",
        panel2: "#171c25",
        border: "#2b3340",
        muted: "#94a3b8",
        gold: "#eabf6b",
        up: "#22c55e",
        down: "#ef4444"
      },
      boxShadow: {
        glow: "0 0 40px rgba(234,191,107,0.12)"
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};

export default config;
