import type { Config } from "tailwindcss";

// Kolory z CSS (zmienne oklch). Tailwind nie umie dodać przezroczystości do `var(--x)`,
// więc klasy typu `bg-szary/30` po cichu nie powstawały. Z modyfikatorem → color-mix;
// bez modyfikatora — czysta zmienna (działa też w starszych przeglądarkach).
// (Tailwind 3 przyjmuje tu funkcję, choć typy tego nie opisują — stąd rzutowanie.)
const kolor = (zmienna: string) =>
  (({ opacityValue }: { opacityValue?: string | number }) =>
    opacityValue === undefined || String(opacityValue).startsWith("var(")
      ? `var(${zmienna})`
      : `color-mix(in oklch, var(${zmienna}) calc(${opacityValue} * 100%), transparent)`) as unknown as string;

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        tlo: kolor("--tlo"),
        ink: kolor("--ink"),
        "ink-2": kolor("--ink-2"),
        "ink-3": kolor("--ink-3"),
        akcent: kolor("--akcent"),
        "akcent-2": kolor("--akcent-2"),
        cena: kolor("--cena"),
        strona: kolor("--strona"),
        linia: kolor("--linia"),
        "linia-2": kolor("--linia-2"),
        szary: kolor("--szary"),
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
