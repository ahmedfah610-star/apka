import Link from "next/link";
import { Nawigacja } from "@/components/Nawigacja";
import { KartaProduktu } from "@/components/KartaProduktu";
import { PanelZakupu } from "@/components/PanelZakupu";
import { OstatnioOgladane } from "@/components/OstatnioOgladane";
import { Opinie } from "@/components/Opinie";
import { OpisRozmiarowy } from "@/components/OpisRozmiarowy";
import { Stopka } from "@/components/Stopka";
import { KATEGORIE_LABEL, opisProduktu, type Produkt } from "@/data/produkty";
import { kluczWariantu, zwinWarianty } from "@/lib/warianty";
import { nizszeNaglowki } from "@/lib/opis";

const OPIS_KLASA =
  "opis-allegro text-[15px] leading-relaxed text-ink-2 [&_h2]:mb-2 [&_h2]:mt-6 [&_h2]:text-[20px] [&_h2]:font-bold [&_h2]:text-ink [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-[18px] [&_h3]:font-bold [&_h3]:text-ink [&_h4]:mt-4 [&_h4]:font-semibold [&_h4]:text-ink [&_img]:mx-auto [&_img]:my-4 [&_img]:block [&_img]:h-auto [&_img]:w-full [&_img]:max-w-xl [&_img]:rounded-xl [&_img]:border [&_img]:border-linia [&_li]:ml-5 [&_li]:list-disc [&_li]:marker:text-akcent [&_p]:mb-4 [&_strong]:text-ink [&_ul]:mb-4 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5";

export function WidokProduktu({ produkt: p, wszystkie }: { produkt: Produkt; wszystkie: Produkt[] }) {
  // Klucz rodziny z katalogu (liczony dla całości) — ten sam, co na liście.
  const kluczTego = kluczWariantu(wszystkie.find((x) => x.id === p.id) ?? p);
  // Rodzina wariantów koloru (ten sam model) — bieżący produkt zawsze w środku.
  const rodzina = [p, ...wszystkie.filter((x) => x.id !== p.id && kluczWariantu(x) === kluczTego)];
  const podobne = zwinWarianty(wszystkie.filter((x) => x.kategoria === p.kategoria && kluczWariantu(x) !== kluczTego))
    .map((z) => z.produkt)
    .slice(0, 4);

  return (
    <div className="overflow-x-clip pb-[76px] md:pb-0">
      <Nawigacja aktywna="produkty" />

      <div className="mx-auto max-w-content px-4 py-2.5 md:px-12 md:pb-6 md:pt-6">
        <p className="truncate text-[13px] text-ink-2">
          <Link href="/produkty" className="no-underline hover:text-akcent">
            Produkty
          </Link>{" "}
          /{" "}
          <Link href={`/produkty?kategoria=${p.kategoria}`} className="no-underline hover:text-akcent">
            {KATEGORIE_LABEL[p.kategoria]}
          </Link>{" "}
          <span className="hidden md:inline">/ <span className="text-ink">{p.nazwa}</span></span>
        </p>
      </div>

      <div className="mx-auto max-w-content pb-8 md:px-12 md:pb-20">
        <PanelZakupu warianty={rodzina} startId={p.id} />
      </div>

      {/* Pełny opis — osobna, pełnowymiarowa sekcja (zdjęcia wyśrodkowane i wyrównane). */}
      <section className="border-t border-linia px-4 py-8 md:px-12 md:py-14">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-4 text-[20px] font-extrabold tracking-tight md:mb-6 md:text-[22px]">Opis produktu</h2>
          {p.opisRozmiary && Object.keys(p.opisRozmiary).length ? (
            <OpisRozmiarowy
              opisy={Object.fromEntries(Object.entries(p.opisRozmiary).map(([r, h]) => [r, nizszeNaglowki(h) ?? ""]))}
              rozmiary={p.rozmiary ?? []}
              domyslny={nizszeNaglowki(p.opisHtml)}
              klasa={OPIS_KLASA}
            />
          ) : p.opisHtml ? (
            <div className={OPIS_KLASA} dangerouslySetInnerHTML={{ __html: nizszeNaglowki(p.opisHtml) ?? "" }} />
          ) : (
            <p className="text-[15px] leading-relaxed text-ink-2">{opisProduktu(p)}</p>
          )}
        </div>
      </section>

      <Opinie produktId={p.id} />

      {podobne.length > 0 ? (
        <section className="px-4 pb-12 pt-8 md:px-12 md:pb-20 md:pt-0">
          <div className="mx-auto max-w-content">
            <h2 className="mb-4 text-[20px] font-extrabold tracking-tight md:mb-8 md:text-[22px]">Zobacz też</h2>
            <div className="grid grid-cols-2 gap-x-2.5 gap-y-5 md:grid-cols-4 md:gap-x-6 md:gap-y-8">
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
