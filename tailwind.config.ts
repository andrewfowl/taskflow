import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // A refined indigo — confident and modern without the neon of the
        // previous electric blue. Used everywhere via the `brand-*` tokens.
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
        ink: "#141414",
        muted: "#656565",
        hairline: "#e5e7eb",
        void: "#0a0a1f",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        hairline: "0 0 0 1px rgb(0 0 0 / 0.02)",
        card: "0 0 0 1px rgb(0 0 0 / 0.02)",
        "card-hover":
          "0 12px 12px -3px rgb(0 0 0 / 0.04), 0 6px 6px -3px rgb(0 0 0 / 0.03), 0 1px 1px -0.5px rgb(0 0 0 / 0.03)",
        float:
          "0 12px 12px -3px rgb(0 0 0 / 0.06), 0 6px 6px -3px rgb(0 0 0 / 0.04), 0 3px 3px -1.5px rgb(0 0 0 / 0.02), 0 1px 1px -0.5px rgb(0 0 0 / 0.03)",
        sheen:
          "inset 0 1px 2px -0.5px rgb(255 255 255 / 0.12), inset 0 0.5px 0.5px 0 rgb(255 255 255 / 0.16), inset 0 8px 24px -4px rgb(255 255 255 / 0.16)",
        // A saturated brand-coloured glow for decisive primary actions.
        brand:
          "0 12px 32px -10px rgb(79 70 229 / 0.45), 0 4px 12px -4px rgb(79 70 229 / 0.30)",
      },
    },
  },
  plugins: [],
};

export default config;
