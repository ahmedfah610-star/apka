import Link from "next/link";
import { Nawigacja } from "@/components/Nawigacja";
import { KartaProduktu } from "@/components/KartaProduktu";
import { PanelZakupu } from "@/components/PanelZakupu";
import { OstatnioOgladane } from "@/components/OstatnioOgladane";
import { Opinie } from "@/components/Opinie";
import { Stopka } from "@/components/Stopka";
import { KATEGORIE_LABEL, opisProduktu, type Produkt } from "@/data/produkty";
import { kluczWariantu, zwinWarianty } from "@/lib/warianty";

export function WidokProduktu({ produkt: p, wszystkie }: { produkt: Produkt; wszystkie: Produkt[] }) {
  const kluczTego = kluczWariantu(p);
  // Rodzina wariantów koloru (ten sam model) — bieżący produkt zawsze w środku.
  const rodzina = [p, ...wszystkie.filter((x) => x.id !== p.id && kluczWariantu(x) === kluczTego)];
  const podobne = zwinWarianty(wszystkie.filter((x) => x.kategoria === p.kategoria && kluczWariantu(x) !== kluczTego))
    .map((z) => z.produkt)
    .slice(0, 4);

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

      <div className="mx-auto max-w-content px-6 pb-20 md:px-12">
        <PanelZakupu warianty={rodzina} startId={p.id} />
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
