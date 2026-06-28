import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        tlo: "#FBF8F3",
        primary: "#1F3A34",
        akcent: "#E8A23D",
        szalwia: "#8BA888",
        koral: "#E8704F",
        linia: "#E7E0D4",
      },
      borderRadius: {
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};
export default config;
