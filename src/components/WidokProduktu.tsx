import Link from "next/link";
import { Nawigacja } from "@/components/Nawigacja";
import { KartaProduktu } from "@/components/KartaProduktu";
import { DodajDoKoszyka } from "@/components/DodajDoKoszyka";
import { Galeria } from "@/components/Galeria";
import { OstatnioOgladane } from "@/components/OstatnioOgladane";
import { Opinie } from "@/components/Opinie";
import { Stopka } from "@/components/Stopka";
import { TerminDostawy } from "@/components/TerminDostawy";
import { KATEGORIE_LABEL, opisProduktu, type Produkt } from "@/data/produkty";
import { formatCena } from "@/lib/filtrowanie";
import { etykietaStanu } from "@/lib/dostepnosc";
import { wariantyKoloru, kluczWariantu, zwinWarianty } from "@/lib/warianty";

const CECHY: Record<string, string[]> = {
  dziewczynki: ["Miękka, przyjazna skórze tkanina", "Wygodny krój na co dzień", "Łatwe pranie w 30°C"],
  chlopcy: ["Wytrzymały materiał na zabawę", "Wygodny, swobodny krój", "Łatwe pranie w 30°C"],
  niemowleta: ["Delikatna bawełna dla niemowląt", "Łatwe zakładanie i zmiana pieluszki", "Bez uciskających szwów"],
};

export function WidokProduktu({ produkt: p, wszystkie }: { produkt: Produkt; wszystkie: Produkt[] }) {
  const placeholder = {
    background: `repeating-linear-gradient(115deg, oklch(90% 0.02 ${p.hue}) 0 18px, oklch(95% 0.01 ${p.hue}) 18px 36px)`,
  };
  const kolory = wariantyKoloru(wszystkie, p);
  const kluczTego = kluczWariantu(p);
  const podobne = zwinWarianty(wszystkie.filter((x) => x.kategoria === p.kategoria && kluczWariantu(x) !== kluczTego))
    .map((z) => z.produkt)
    .slice(0, 4);
  const zdjecia = p.zdjecia?.length ? p.zdjecia : p.zdjecie ? [p.zdjecie] : [];

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
        <Galeria zdjecia={zdjecia} alt={p.nazwa} placeholder={placeholder} />

        <div className="flex flex-col">
          <p className="mb-2 text-[13px] uppercase tracking-wide text-ink-2">
            {KATEGORIE_LABEL[p.kategoria]} · {p.wiekLabel}
            {p.kolor ? <span> · {p.kolor}</span> : null}
          </p>
          <h1 className="mb-3 text-[30px] font-bold leading-tight tracking-tight md:text-[36px]">{p.nazwa}</h1>
          <p className="mb-2 text-[26px] font-bold text-ink">{formatCena(p.cena)} zł</p>
          {(() => {
            const et = etykietaStanu(p.stan);
            if (!et) return <div className="mb-3" />;
            const kolor =
              et.ton === "brak" ? "text-ink-2" : et.ton === "malo" ? "text-akcent" : "text-[oklch(52%_0.13_150)]";
            return (
              <p className={`mb-3 flex items-center gap-1.5 text-[13.5px] font-semibold ${kolor}`}>
                {et.ton === "malo" ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M13 2 4.5 12.8c-.4.5 0 1.2.6 1.2H11l-1 8 8.5-10.8c.4-.5 0-1.2-.6-1.2H12l1-8Z" />
                  </svg>
                ) : et.ton === "ok" ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                ) : null}
                {et.tekst}
              </p>
            );
          })()}

          {p.stan !== 0 ? <TerminDostawy klasa="mb-6 flex items-center gap-2 text-[13.5px] text-ink-2" /> : <div className="mb-6" />}

          {kolory.length > 1 ? (
            <div className="mb-6">
              <p className="mb-2.5 text-[13.5px] font-semibold text-ink">
                Kolor: <span className="font-normal text-ink-2">{p.kolor ?? "—"}</span>
                <span className="ml-1 text-ink-2">({kolory.length} do wyboru)</span>
              </p>
              <div className="flex flex-wrap gap-2.5">
                {kolory.map((w) => (
                  <Link
                    key={w.id}
                    href={`/produkty/${w.id}`}
                    title={`${w.kolor ?? "kolor"}${w.dostepny ? "" : " — brak"}`}
                    aria-label={w.kolor ?? "kolor"}
                    scroll={false}
                    className={`relative block h-14 w-14 overflow-hidden rounded-xl border-2 bg-white transition-all ${
                      w.aktywny ? "border-ink ring-2 ring-ink ring-offset-2" : "border-linia hover:border-ink"
                    }`}
                  >
                    {w.zdjecie ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={w.zdjecie} alt={w.kolor ?? ""} className={`h-full w-full object-contain p-0.5 ${w.dostepny ? "" : "opacity-40"}`} loading="lazy" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-[10px] text-ink-2">{w.kolor?.slice(0, 6)}</span>
                    )}
                    {!w.dostepny ? <span className="absolute inset-x-0 bottom-0 bg-white/85 text-center text-[8px] font-semibold text-ink-2">brak</span> : null}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          <DodajDoKoszyka produkt={p} />

          <ul className="mt-6 flex flex-col gap-2 border-t border-linia pt-6">
            {(CECHY[p.kategoria] ?? []).map((c) => (
              <li key={c} className="flex items-start gap-2 text-[14px] text-ink-2">
                <span className="mt-2 h-1 w-1 shrink-0 bg-akcent" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Pełny opis — osobna, pełnowymiarowa sekcja (zdjęcia wyśrodkowane i wyrównane). */}
      <section className="border-t border-linia px-6 py-14 md:px-12">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-6 text-[22px] font-bold tracking-tight">Opis produktu</h2>
          {p.opisHtml ? (
            <div
              className="opis-allegro text-[15px] leading-relaxed text-ink-2 [&_h1]:mb-2 [&_h1]:mt-6 [&_h1]:text-[20px] [&_h1]:font-bold [&_h1]:text-ink [&_h2]:mb-2 [&_h2]:mt-6 [&_h2]:text-[18px] [&_h2]:font-bold [&_h2]:text-ink [&_h3]:mt-4 [&_h3]:font-semibold [&_h3]:text-ink [&_img]:mx-auto [&_img]:my-4 [&_img]:block [&_img]:h-auto [&_img]:w-full [&_img]:max-w-xl [&_img]:rounded-xl [&_img]:border [&_img]:border-linia [&_li]:ml-5 [&_li]:list-disc [&_li]:marker:text-akcent [&_p]:mb-4 [&_strong]:text-ink [&_ul]:mb-4 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5"
              dangerouslySetInnerHTML={{ __html: p.opisHtml }}
            />
          ) : (
            <p className="text-[15px] leading-relaxed text-ink-2">{opisProduktu(p)}</p>
          )}
        </div>
      </section>

      <Opinie produktId={p.id} />

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

      <OstatnioOgladane aktualnyId={p.id} />

      <Stopka />
    </div>
  );
}
