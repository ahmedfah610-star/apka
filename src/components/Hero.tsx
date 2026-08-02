import Link from "next/link";
import { reprKategorii, type Kategoria } from "@/data/produkty";

const KOLAZ: { kat: Kategoria; top: string; left: string; rot: number; dur: string; delay: string }[] = [
  { kat: "dziewczynki", top: "2%", left: "3%", rot: -3, dur: "6.5s", delay: "0s" },
  { kat: "chlopcy", top: "24%", left: "37%", rot: 3, dur: "7.5s", delay: "0.5s" },
  { kat: "niemowleta", top: "8%", left: "62%", rot: 4, dur: "7s", delay: "1s" },
];

export function Hero() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, oklch(98% 0.008 75) 0%, oklch(96% 0.022 45) 100%)" }}
    >
      <div className="relative mx-auto grid max-w-content grid-cols-1 items-center gap-10 px-6 py-20 md:min-h-[600px] md:grid-cols-2 md:px-12">
        {/* Treść */}
        <div className="fade-up">
          <p className="mb-5 text-[13px] tracking-[0.18em] text-ink-2">KOLEKCJA LATO 2026</p>
          <h1 className="mb-6 text-[40px] font-bold leading-[1.04] tracking-tight md:text-[54px]">
            Ubrania, w których dzieci mogą być sobą
          </h1>
          <p className="mb-8 max-w-md text-[15px] leading-relaxed text-ink-2">
            Miękkie, wygodne i gotowe na każdą przygodę — od pierwszych chwil po pierwszy dzień w przedszkolu.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/produkty"
              className="inline-block bg-ink px-8 py-3.5 text-[13px] font-semibold tracking-wide text-tlo no-underline transition-colors hover:bg-akcent"
            >
              ZOBACZ KOLEKCJĘ
            </Link>
            <Link
              href="/produkty?kategoria=niemowleta"
              className="inline-block border border-ink px-8 py-3.5 text-[13px] font-semibold tracking-wide text-ink no-underline transition-colors hover:bg-ink hover:text-tlo"
            >
              DLA NIEMOWLĄT
            </Link>
          </div>
        </div>

        {/* Elegancki kolaż produktów (delikatny ruch) */}
        <div className="relative hidden h-[460px] md:block">
          {KOLAZ.map((k) => {
            const p = reprKategorii(k.kat);
            if (!p?.zdjecie) return null;
            return (
              <Link
                key={k.kat}
                href={`/produkty/${p.id}`}
                className="absolute block bg-white shadow-[0_22px_55px_-26px_rgba(0,0,0,0.32)] ring-1 ring-black/5"
                style={{
                  top: k.top,
                  left: k.left,
                  width: 212,
                  height: 268,
                  transform: `rotate(${k.rot}deg)`,
                  animation: `float ${k.dur} ease-in-out ${k.delay} infinite`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.zdjecie} alt={p.nazwa} className="h-full w-full object-contain p-3.5" />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
