import Link from "next/link";
import { reprKategorii, type Kategoria } from "@/data/produkty";

const KOLAZ: Kategoria[] = ["dziewczynki", "chlopcy"];

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

        {/* Dwa równe kafle produktów, wyrównane */}
        <div className="hidden grid-cols-2 gap-5 md:grid">
          {KOLAZ.map((kat) => {
            const p = reprKategorii(kat);
            if (!p?.zdjecie) return null;
            return (
              <Link
                key={kat}
                href={`/produkty/${p.id}`}
                className="group block aspect-[4/5] overflow-hidden bg-white shadow-[0_22px_55px_-30px_rgba(0,0,0,0.3)] ring-1 ring-black/5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.zdjecie}
                  alt={p.nazwa}
                  className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
