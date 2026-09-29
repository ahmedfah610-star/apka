import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        tlo: "var(--tlo)",
        ink: "var(--ink)",
        "ink-2": "var(--ink-2)",
        "ink-3": "var(--ink-3)",
        akcent: "var(--akcent)",
        "akcent-2": "var(--akcent-2)",
        cena: "var(--cena)",
        strona: "var(--strona)",
        linia: "var(--linia)",
        "linia-2": "var(--linia-2)",
        szary: "var(--szary)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Manrope", "system-ui", "sans-serif"],
      },
      maxWidth: {
        content: "1400px",
      },
      borderRadius: {
        none: "0",
      },
    },
  },
  plugins: [],
};
export default config;
