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
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        // Softer, cooler, layered elevation than Tailwind's defaults — reads
        // calmer and more "product" than the stock drop shadow.
        card: "0 1px 2px 0 rgb(16 24 40 / 0.04), 0 1px 3px 0 rgb(16 24 40 / 0.06)",
        "card-hover":
          "0 8px 24px -6px rgb(16 24 40 / 0.10), 0 2px 6px -2px rgb(16 24 40 / 0.06)",
        // A saturated brand-coloured glow for decisive primary actions.
        brand:
          "0 12px 32px -10px rgb(79 70 229 / 0.45), 0 4px 12px -4px rgb(79 70 229 / 0.30)",
      },
    },
  },
  plugins: [],
};

export default config;
