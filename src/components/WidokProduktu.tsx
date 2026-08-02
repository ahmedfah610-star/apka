import Link from "next/link";
import { Nawigacja } from "@/components/Nawigacja";
import { KartaProduktu } from "@/components/KartaProduktu";
import { DodajDoKoszyka } from "@/components/DodajDoKoszyka";
import { Stopka } from "@/components/Stopka";
import { KATEGORIE_LABEL, opisProduktu, type Produkt } from "@/data/produkty";
import { formatCena } from "@/lib/filtrowanie";

const CECHY: Record<string, string[]> = {
  dziewczynki: ["Miękka, przyjazna skórze tkanina", "Wygodny krój na co dzień", "Łatwe pranie w 30°C"],
  chlopcy: ["Wytrzymały materiał na zabawę", "Wygodny, swobodny krój", "Łatwe pranie w 30°C"],
  niemowleta: ["Delikatna bawełna dla niemowląt", "Łatwe zakładanie i zmiana pieluszki", "Bez uciskających szwów"],
};

export function WidokProduktu({ produkt: p, wszystkie }: { produkt: Produkt; wszystkie: Produkt[] }) {
  const placeholder = {
    background: `repeating-linear-gradient(115deg, oklch(90% 0.02 ${p.hue}) 0 18px, oklch(95% 0.01 ${p.hue}) 18px 36px)`,
  };
  const podobne = wszystkie.filter((x) => x.kategoria === p.kategoria && x.id !== p.id).slice(0, 4);

  return (
    <div className="overflow-x-hidden">
      <Nawigacja aktywna="produkty" />

      <div className="mx-auto max-w-content px-6 pb-6 pt-6 md:px-12">
        <p className="text-[13px] text-ink-2">
          <Link href="/produkty" className="no-underline hover:text-akcent">
            Produkty
          </Link>{" "}
          /{" "}
          <Link href={`/produkty?kategoria=${p.kategoria}`} className="no-underline hover:text-akcent">
            {KATEGORIE_LABEL[p.kategoria]}
          </Link>{" "}
          / <span className="text-ink">{p.nazwa}</span>
        </p>
      </div>

      <div className="mx-auto grid max-w-content grid-cols-1 gap-12 px-6 pb-20 md:grid-cols-2 md:px-12">
        <div
          className="flex aspect-square items-center justify-center overflow-hidden bg-white"
          style={p.zdjecie ? undefined : placeholder}
        >
          {p.zdjecie ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.zdjecie} alt={p.nazwa} className="h-full w-full object-contain p-6" />
          ) : (
            <span className="font-mono text-[12px] text-ink-2">zdjęcie produktu</span>
          )}
        </div>

        <div className="flex flex-col">
          <p className="mb-2 text-[13px] uppercase tracking-wide text-ink-2">
            {KATEGORIE_LABEL[p.kategoria]} · {p.wiekLabel}
          </p>
          <h1 className="mb-3 text-[30px] font-bold leading-tight tracking-tight md:text-[36px]">{p.nazwa}</h1>
          <p className="mb-6 text-[24px] text-ink">{formatCena(p.cena)} zł</p>

          <DodajDoKoszyka produkt={p} />

          <p className="mb-6 max-w-prose text-[15px] leading-relaxed text-ink-2">{opisProduktu(p)}</p>

          <ul className="flex flex-col gap-2 border-t border-linia pt-6">
            {(CECHY[p.kategoria] ?? []).map((c) => (
              <li key={c} className="flex items-start gap-2 text-[14px] text-ink-2">
                <span className="mt-2 h-1 w-1 shrink-0 bg-akcent" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {podobne.length > 0 ? (
        <section className="px-6 pb-20 md:px-12">
          <div className="mx-auto max-w-content">
            <h2 className="mb-8 text-[22px] font-bold tracking-tight">Zobacz też</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
              {podobne.map((x) => (
                <KartaProduktu key={x.id} produkt={x} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <Stopka />
    </div>
  );
}
