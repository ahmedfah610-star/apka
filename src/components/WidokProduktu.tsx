import Link from "next/link";
import { Nawigacja } from "@/components/Nawigacja";
import { InformacjeSprzedajacego } from "@/components/InformacjeSprzedajacego";
import { KartaProduktu } from "@/components/KartaProduktu";
import { PanelZakupu } from "@/components/PanelZakupu";
import { OstatnioOgladane } from "@/components/OstatnioOgladane";
import { Opinie } from "@/components/Opinie";
import { OpisRozmiarowy } from "@/components/OpisRozmiarowy";
import { Stopka } from "@/components/Stopka";
import { OpinieAllegroSekcja } from "@/components/OpinieAllegro";
import { opinieDoProduktu, type OpinieAllegro } from "@/lib/opinieAllegro";
import { KATEGORIE_LABEL, opisProduktu, type Produkt } from "@/data/produkty";
import { kluczWariantu, zwinWarianty } from "@/lib/warianty";
import { nizszeNaglowki } from "@/lib/opis";
import { OPIS_KLASA } from "@/lib/opisStyl";


export function WidokProduktu({ produkt, wszystkie, opinieAllegro = null }: { produkt: Produkt; wszystkie: Produkt[]; opinieAllegro?: OpinieAllegro | null }) {
  // Klucz rodziny z katalogu (liczony dla całości) — ten sam, co na liście. Produkt z bazy
  // czytany osobno nie zna swojej rodziny, więc przenosimy ją z wpisu w katalogu.
  const p: Produkt = { ...produkt, rodzina: wszystkie.find((x) => x.id === produkt.id)?.rodzina ?? produkt.rodzina };
  const kluczTego = kluczWariantu(p);
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
        <PanelZakupu warianty={rodzina} startId={p.id} opinieAllegro={opinieAllegro?.podsumowanie ?? null} />
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
          <InformacjeSprzedajacego />
        </div>
      </section>

      <Opinie produktId={p.id} />

      {/* Opinie o sklepie z Allegro — najpierw te o tym produkcie (i jego kolorach), potem najnowsze. */}
      {opinieAllegro ? (
        <section id="opinie-allegro" className="scroll-mt-24 px-4 pb-10 md:px-12 md:pb-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-3 text-[20px] font-extrabold tracking-tight md:mb-5 md:text-[22px]">Opinie o naszym sklepie z Allegro</h2>
            <OpinieAllegroSekcja
              podsumowanie={opinieAllegro.podsumowanie}
              opinie={opinieDoProduktu(opinieAllegro.opinie, rodzina.map((x) => x.id))}
              idProduktow={rodzina.map((x) => x.id)}
            />
          </div>
        </section>
      ) : null}

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
