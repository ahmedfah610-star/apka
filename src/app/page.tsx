import Link from "next/link";
import { Nawigacja } from "@/components/Nawigacja";
import { KartaProduktu } from "@/components/KartaProduktu";
import { Newsletter } from "@/components/Newsletter";
import { Stopka } from "@/components/Stopka";
import { KATEGORIE_LABEL, type Kategoria, type Produkt } from "@/data/produkty";
import { KOLEKCJE } from "@/data/kolekcje";
import { katalogWidoczny } from "@/lib/produktyDb";
import { zwinWarianty, type Zwiniety } from "@/lib/warianty";
import { formatCena } from "@/lib/filtrowanie";
import { porownajRozmiary } from "@/lib/rozmiary";
import { DARMOWA_DOSTAWA_OD, METODY_DOSTAWY } from "@/lib/dostawa";

// Wybrane typy do sekcji „Szukasz czegoś konkretnego?" (strony docelowe SEO).
const TYPY_SEO = [
  "body-niemowlece",
  "pajacyki-i-spiochy-niemowlece",
  "komplety-dzieciece",
  "dresy-dzieciece",
  "spodnie-dla-chlopca",
  "spodnie-dla-dziewczynki",
  "bluzy-dla-chlopca",
  "bluzy-dla-dziewczynki",
  "sukienki-dla-dziewczynki",
  "czapki-dzieciece",
]
  .map((s) => KOLEKCJE.find((k) => k.slug === s))
  .filter((k): k is (typeof KOLEKCJE)[number] => !!k);

// ISR: strona buduje się i odświeża co 5 minut zamiast przy każdym żądaniu.
export const revalidate = 300;

const KAT_DZIECI: Kategoria[] = ["niemowleta", "dziewczynki", "chlopcy"];

// „1 produkt", „2 produkty", „5 produktów", „22 produkty", „12 produktów".
function produkty(n: number): string {
  if (n === 1) return "1 produkt";
  const r10 = n % 10, r100 = n % 100;
  return `${n} ${r10 >= 2 && r10 <= 4 && !(r100 >= 12 && r100 <= 14) ? "produkty" : "produktów"}`;
}

// Zakres rozmiarów ubrań (bez rozmiarów skarpetek/czapek typu „11-12", „40").
function zakresRozmiarow(lista: Produkt[]): string | null {
  const wszystkie = Array.from(new Set(lista.flatMap((p) => p.rozmiary ?? [])))
    .filter((r) => !/^\d/.test(r) || parseInt(r, 10) >= 44)
    .sort(porownajRozmiary);
  if (!wszystkie.length) return null;
  const pierwszy = wszystkie[0].split(/[-/]/)[0];
  const ostatni = wszystkie[wszystkie.length - 1].split(/[-/]/).pop();
  return pierwszy === ostatni ? pierwszy : `${pierwszy}–${ostatni}`;
}

// Zdjęcie reprezentujące kategorię: najnowszy dostępny produkt z kilkoma zdjęciami.
function okladka(lista: Produkt[]): Produkt | undefined {
  return [...lista].reverse().find((p) => (p.zdjecia?.length ?? 0) >= 2) ?? lista[lista.length - 1];
}

const dostepny = (p: Produkt) => p.stan !== 0 && !!p.zdjecie;

// Bez powtórek (to samo zdjęcie/nazwa) i na przemian z kategorii — przekrój sklepu,
// a nie osiem niemowlęcych kompletów pod rząd.
function roznorodne(lista: Zwiniety[], ile: number): Zwiniety[] {
  const widziane = new Set<string>();
  const unikalne = lista.filter(({ produkt: p }) => {
    const klucze = [p.zdjecie ?? "", p.nazwa.toLowerCase()];
    if (klucze.some((k) => widziane.has(k))) return false;
    klucze.forEach((k) => widziane.add(k));
    return true;
  });
  const kolejki = new Map<string, Zwiniety[]>();
  for (const z of unikalne) kolejki.set(z.produkt.kategoria, [...(kolejki.get(z.produkt.kategoria) ?? []), z]);
  const wynik: Zwiniety[] = [];
  while (wynik.length < ile && [...kolejki.values()].some((q) => q.length)) {
    for (const q of kolejki.values()) if (q.length && wynik.length < ile) wynik.push(q.shift()!);
  }
  return wynik;
}

export default async function StronaGlowna() {
  const katalog = await katalogWidoczny(); // kolejność: od najstarszego
  const naStanie = katalog.filter(dostepny);
  const cenaOd = naStanie.length ? Math.min(...naStanie.map((p) => p.cena)) : 0;
  const dostawaOd = Math.min(...METODY_DOSTAWY.map((m) => m.cena));

  // Nowości: najnowsze modele (kolory zwinięte w jeden kafel).
  const nowosci = roznorodne(zwinWarianty([...naStanie].reverse()), 8);
  // Te same modele (id, zdjęcie, nazwa) nie powtarzają się w kolejnych sekcjach.
  const wNowosciach = new Set(nowosci.flatMap((z) => [z.produkt.id, z.produkt.zdjecie ?? "", z.produkt.nazwa.toLowerCase()]));
  const tanie = roznorodne(
    zwinWarianty([...naStanie].reverse().filter((p) => p.cena <= 20 && !wNowosciach.has(p.id) && !wNowosciach.has(p.nazwa.toLowerCase()))),
    4,
  );

  // Hero: sześć najnowszych modeli z dopracowaną galerią.
  const hero = roznorodne(
    zwinWarianty(
      [...naStanie].reverse().filter((p) => p.kategoria !== "dorosli" && (p.zdjecia?.length ?? 0) >= 3 && !wNowosciach.has(p.id) && !wNowosciach.has(p.zdjecie ?? "")),
    ),
    6,
  );
  // Okładki kategorii nie powtarzają zdjęć z hero i nowości.
  const zajete = new Set([...hero, ...nowosci].map((z) => z.produkt.zdjecie));

  const kategorie = [...KAT_DZIECI, "dorosli" as Kategoria].map((k) => {
    const lista = katalog.filter((p) => p.kategoria === k);
    const kandydaci = lista.filter((p) => dostepny(p) && !zajete.has(p.zdjecie));
    return { k, liczba: lista.length, rozmiary: zakresRozmiarow(lista), okladka: okladka(kandydaci.length ? kandydaci : lista.filter(dostepny)) };
  });
  const liczbaDzieci = kategorie.filter((c) => c.k !== "dorosli").reduce((s, c) => s + c.liczba, 0);

  return (
    <div className="overflow-x-hidden">
      {/* Pasek informacyjny */}
      <div className="bg-ink px-4 py-[9px] text-center text-[12.5px] text-tlo">
        Darmowa dostawa od {DARMOWA_DOSTAWA_OD} zł <span className="px-2 text-tlo/40">·</span> 14 dni na zwrot{" "}
        <span className="hidden sm:inline">
          <span className="px-2 text-tlo/40">·</span> BLIK, karta, Przelewy24
        </span>
      </div>

      <Nawigacja aktywna="home" />

      {/* Hero — prawdziwe produkty zamiast zdjęcia stockowego */}
      <section className="border-b border-linia">
        <div className="mx-auto grid max-w-content grid-cols-1 gap-10 px-5 py-10 md:px-12 md:py-16 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-16">
          <div>
            <p className="mb-4 text-[13px] font-medium text-ink-2">
              {produkty(katalog.length)} · rozmiary {zakresRozmiarow(katalog.filter((p) => p.kategoria !== "dorosli")) ?? "50–164"} · ceny od{" "}
              {formatCena(cenaOd)} zł
            </p>
            <h1 className="mb-5 max-w-[15ch] text-[38px] font-bold leading-[1.04] tracking-[-0.02em] text-ink sm:text-[48px] lg:text-[60px]">
              Ubranka dla dzieci na co dzień
            </h1>
            <p className="mb-8 max-w-[46ch] text-[16px] leading-relaxed text-ink-2">
              Body, pajacyki, dresy, legginsy i komplety — od noworodka po szkolniaka. Przy każdym rozmiarze podajemy
              wymiary w centymetrach, żeby łatwo było trafić.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/produkty?grupa=dzieci"
                className="rounded-lg bg-ink px-6 py-3.5 text-[14px] font-semibold text-tlo no-underline transition-colors hover:bg-akcent"
              >
                Przeglądaj ubranka
              </Link>
              <Link
                href="#nowosci"
                className="rounded-lg border border-linia-2 bg-white px-6 py-3.5 text-[14px] font-semibold text-ink no-underline transition-colors hover:border-ink"
              >
                Nowości
              </Link>
            </div>
          </div>

          {/* Siatka najnowszych produktów */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            {hero.map(({ produkt: p, cenaMin, cenyRozne }, i) => (
              <Link
                key={p.id}
                href={`/produkty/${p.id}`}
                className={`group relative block overflow-hidden rounded-xl border border-linia bg-white no-underline ${
                  i >= 3 ? "hidden sm:block" : ""
                }`}
              >
                <div className="aspect-[4/5]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.zdjecie!}
                    alt={p.nazwa}
                    className="h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                </div>
                <span className="absolute bottom-2 left-2 rounded-md bg-white/95 px-2 py-1 text-[12px] font-semibold text-ink shadow-sm">
                  {cenyRozne ? "od " : ""}
                  {formatCena(cenaMin)} zł
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Kategorie */}
      <section className="px-5 pb-4 pt-14 md:px-12 md:pt-20">
        <div className="mx-auto max-w-content">
          <div className="mb-6 flex items-baseline justify-between gap-4">
            <h2 className="text-[24px] font-bold tracking-tight md:text-[28px]">Kategorie</h2>
            <Link href="/produkty" className="text-[14px] text-ink-2 no-underline hover:text-ink">
              Wszystkie produkty →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {kategorie.map(({ k, liczba, rozmiary, okladka: o }) => (
              <Link
                key={k}
                href={`/produkty?kategoria=${k}`}
                className="group block overflow-hidden rounded-xl border border-linia bg-white no-underline transition-colors hover:border-ink/30"
              >
                <div className="aspect-square border-b border-linia bg-white">
                  {o?.zdjecie ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={o.zdjecie} alt="" className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-[1.04]" />
                  ) : null}
                </div>
                <div className="px-4 py-3.5">
                  <p className="text-[15.5px] font-semibold text-ink">{k === "dorosli" ? "Męskie" : KATEGORIE_LABEL[k]}</p>
                  <p className="text-[13px] text-ink-2">
                    {produkty(liczba)}
                    {rozmiary ? ` · rozm. ${rozmiary}` : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
          <p className="mt-3 text-[13px] text-ink-2">
            Dla dzieci: {produkty(liczbaDzieci)} ·{" "}
            <Link href="/produkty?grupa=dzieci" className="text-ink underline underline-offset-2">
              pokaż wszystkie
            </Link>
          </p>
        </div>
      </section>

      {/* Nowości */}
      <section id="nowosci" className="scroll-mt-24 px-5 py-14 md:px-12 md:py-20">
        <div className="mx-auto max-w-content">
          <div className="mb-7 flex items-baseline justify-between gap-4">
            <h2 className="text-[24px] font-bold tracking-tight md:text-[28px]">Nowości</h2>
            <Link href="/produkty" className="text-[14px] text-ink-2 no-underline hover:text-ink">
              Zobacz wszystkie →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-x-6">
            {nowosci.map(({ produkt, kolory, cenaMin, cenyRozne }) => (
              <KartaProduktu key={produkt.id} produkt={produkt} liczbaKolorow={kolory} cenaOd={cenyRozne ? cenaMin : undefined} />
            ))}
          </div>
        </div>
      </section>

      {/* Konkretnie o zakupach */}
      <section className="border-y border-linia bg-white px-5 py-12 md:px-12">
        <div className="mx-auto grid max-w-content grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              t: `Darmowa dostawa od ${DARMOWA_DOSTAWA_OD} zł`,
              o: `Paczkomaty InPost, ORLEN, DPD, Pocztex i kurierzy — poniżej progu od ${formatCena(dostawaOd)} zł.`,
              d: "M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
            },
            {
              t: "14 dni na zwrot",
              o: "Bez podawania przyczyny. Zasady i formularz znajdziesz w zakładce Dostawa i zwroty.",
              d: "M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4",
            },
            {
              t: "Wymiary w centymetrach",
              o: "Przy każdym rozmiarze: wzrost, długość i szerokość. Zmierz dziecko i porównaj.",
              d: "M3 17 17 3l4 4L7 21zM7 13l2 2m1-5 2 2m1-5 2 2",
            },
            {
              t: "BLIK, karta, Przelewy24",
              o: "Płatność online przez Przelewy24. Zamówienie wysyłamy po zaksięgowaniu wpłaty.",
              d: "M3 6h18v12H3zM3 10h18M7 15h3",
            },
          ].map((f) => (
            <div key={f.t} className="flex gap-3.5">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-akcent" aria-hidden>
                <path d={f.d} />
              </svg>
              <div>
                <p className="mb-1 text-[15px] font-semibold text-ink">{f.t}</p>
                <p className="text-[13.5px] leading-relaxed text-ink-2">{f.o}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Do 20 zł */}
      {tanie.length ? (
        <section className="px-5 py-14 md:px-12 md:py-20">
          <div className="mx-auto max-w-content">
            <div className="mb-7 flex items-baseline justify-between gap-4">
              <h2 className="text-[24px] font-bold tracking-tight md:text-[28px]">Do 20 zł</h2>
              <Link href="/produkty?sort=cena-rosnaco" className="text-[14px] text-ink-2 no-underline hover:text-ink">
                Od najtańszych →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-x-6">
              {tanie.map(({ produkt, kolory, cenaMin, cenyRozne }) => (
                <KartaProduktu key={produkt.id} produkt={produkt} liczbaKolorow={kolory} cenaOd={cenyRozne ? cenaMin : undefined} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Szukasz czegoś konkretnego + pomoc z rozmiarem */}
      <section className="px-5 pb-16 md:px-12 md:pb-24">
        <div className="mx-auto grid max-w-content grid-cols-1 gap-10 border-t border-linia pt-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          <div>
            <h2 className="mb-5 text-[20px] font-bold tracking-tight">Szukasz czegoś konkretnego?</h2>
            <ul className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
              {TYPY_SEO.map((k) => (
                <li key={k.slug} className="border-b border-linia">
                  <Link href={`/kolekcje/${k.slug}`} className="flex items-center justify-between py-3 text-[14.5px] text-ink no-underline hover:text-akcent">
                    {k.h1}
                    <span className="text-ink-2">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl bg-szary p-6 md:p-8">
            <h2 className="mb-2 text-[20px] font-bold tracking-tight">Nie wiesz, jaki rozmiar wybrać?</h2>
            <p className="mb-5 text-[14.5px] leading-relaxed text-ink-2">
              Sprawdź <Link href="/rozmiary" className="text-ink underline underline-offset-2">tabelę rozmiarów</Link> albo napisz
              do nas — podpowiemy na podstawie wzrostu dziecka. Odpisujemy zwykle tego samego dnia roboczego.
            </p>
            <div className="flex flex-col gap-1.5 text-[15px] font-semibold">
              <a href="mailto:amin.kids1@hotmail.com" className="text-ink no-underline hover:text-akcent">
                amin.kids1@hotmail.com
              </a>
              <a href="tel:+48793878222" className="text-ink no-underline hover:text-akcent">
                +48 793 878 222
              </a>
            </div>
          </div>
        </div>
      </section>

      <Newsletter />
      <Stopka />
    </div>
  );
}
