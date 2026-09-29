import Link from "next/link";
import { Nawigacja } from "@/components/Nawigacja";
import { KartaWiersza } from "@/components/KartaWiersza";
import { Newsletter } from "@/components/Newsletter";
import { Stopka } from "@/components/Stopka";
import { type Produkt } from "@/data/produkty";
import { KOLEKCJE, produktyKolekcji } from "@/data/kolekcje";
import { katalogWidoczny } from "@/lib/produktyDb";
import { zwinWarianty, type Zwiniety } from "@/lib/warianty";
import { formatCena, ZAKRESY_CENY } from "@/lib/filtrowanie";
import { DARMOWA_DOSTAWA_OD, METODY_DOSTAWY } from "@/lib/dostawa";

// ISR: strona buduje się i odświeża co 5 minut zamiast przy każdym żądaniu.
export const revalidate = 300;

// „Kupuj według rodzaju" — strony kolekcji (te same filtry co na stronie kolekcji,
// więc cena „od" zgadza się z tym, co klient zobaczy po kliknięciu).
const RODZAJE: { slug: string; label: string }[] = [
  { slug: "body-niemowlece", label: "Body" },
  { slug: "pajacyki-i-spiochy-niemowlece", label: "Pajacyki" },
  { slug: "komplety-dzieciece", label: "Komplety" },
  { slug: "dresy-dzieciece", label: "Dresy" },
  { slug: "spodnie-dla-dziewczynki", label: "Legginsy" },
  { slug: "spodnie-dla-chlopca", label: "Spodnie" },
  { slug: "sukienki-dla-dziewczynki", label: "Sukienki" },
  { slug: "bluzy-dla-dziewczynki", label: "Bluzy" },
  { slug: "czapki-dzieciece", label: "Czapki" },
];

const DO_20 = ZAKRESY_CENY[0]; // „do 20 zł" — ten sam zakres co filtr listy

// „1 produkt", „2 produkty", „5 produktów", „22 produkty", „12 produktów".
function produkty(n: number): string {
  if (n === 1) return "1 produkt";
  const r10 = n % 10, r100 = n % 100;
  return `${n} ${r10 >= 2 && r10 <= 4 && !(r100 >= 12 && r100 <= 14) ? "produkty" : "produktów"}`;
}

const dostepny = (p: Produkt) => p.stan !== 0 && !!p.zdjecie;

// Bez powtórek (to samo zdjęcie/nazwa/produkt) i na przemian z kategorii.
function roznorodne(lista: Zwiniety[], ile: number, zajete: Set<string>): Zwiniety[] {
  const unikalne = lista.filter(({ produkt: p }) => {
    const klucze = [p.id, p.zdjecie ?? "", p.nazwa.toLowerCase()];
    if (klucze.some((k) => zajete.has(k))) return false;
    klucze.forEach((k) => zajete.add(k));
    return true;
  });
  const kolejki = new Map<string, Zwiniety[]>();
  for (const z of unikalne) kolejki.set(z.produkt.kategoria, [...(kolejki.get(z.produkt.kategoria) ?? []), z]);
  const wynik: Zwiniety[] = [];
  while (wynik.length < ile && [...kolejki.values()].some((q) => q.length)) {
    for (const q of kolejki.values()) if (q.length && wynik.length < ile) wynik.push(q.shift()!);
  }
  // Niewykorzystane wracają do puli.
  for (const z of unikalne) if (!wynik.includes(z)) [z.produkt.id, z.produkt.zdjecie ?? "", z.produkt.nazwa.toLowerCase()].forEach((k) => zajete.delete(k));
  return wynik;
}

// Najnowszy produkt z dopracowaną galerią, którego zdjęcie nie było jeszcze użyte.
function okladka(lista: Produkt[], zajete: Set<string>): Produkt | undefined {
  const p = [...lista].reverse().find((x) => (x.zdjecia?.length ?? 0) >= 2 && !zajete.has(x.zdjecie ?? "")) ?? lista[lista.length - 1];
  if (p) zajete.add(p.zdjecie ?? "");
  return p;
}

const minCena = (l: Produkt[]) => (l.length ? Math.min(...l.map((p) => p.cena)) : 0);

function Rzad({ tytul, link, linkTekst, pozycje }: { tytul: string; link: string; linkTekst: string; pozycje: Zwiniety[] }) {
  return (
    <section className="mt-6 rounded-2xl bg-white p-4 md:mt-8 md:p-6">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="text-[20px] font-extrabold tracking-tight md:text-[22px]">{tytul}</h2>
        <Link href={link} className="shrink-0 text-[14px] font-bold text-akcent no-underline hover:underline">
          {linkTekst} →
        </Link>
      </div>
      <div className="-mx-4 grid snap-x auto-cols-[46%] grid-flow-col gap-3 overflow-x-auto px-4 pb-1 sm:auto-cols-[31%] md:mx-0 md:auto-cols-[calc((100%-4*14px)/5)] md:gap-[14px] md:px-0 [&::-webkit-scrollbar]:hidden">
        {pozycje.map(({ produkt, kolory, cenaMin, cenyRozne }) => (
          <div key={produkt.id} className="snap-start">
            <KartaWiersza produkt={produkt} kolory={kolory} cenaOd={cenyRozne ? cenaMin : undefined} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function StronaGlowna() {
  const katalog = await katalogWidoczny(); // kolejność: od najstarszego
  const naStanie = katalog.filter(dostepny);
  const najnowsze = [...naStanie].reverse();
  const dostawaOd = Math.min(...METODY_DOSTAWY.map((m) => m.cena));
  const zajete = new Set<string>();

  // Banery
  const kolKomplety = KOLEKCJE.find((k) => k.slug === "komplety-niemowlece");
  const komplety = kolKomplety ? produktyKolekcji(naStanie, kolKomplety) : [];
  const kompletyFoto = roznorodne(zwinWarianty([...komplety].reverse()), 2, zajete);
  const tanie = naStanie.filter((p) => p.cena >= DO_20.min && p.cena < DO_20.max);
  const tanieFoto = okladka(tanie.filter((p) => p.kategoria !== "dorosli"), zajete);
  const meskie = naStanie.filter((p) => p.kategoria === "dorosli");
  const meskieFoto = okladka(meskie, zajete);

  // Kółka rodzajów
  const rodzaje = RODZAJE.map((r) => {
    const kol = KOLEKCJE.find((k) => k.slug === r.slug);
    const lista = kol ? produktyKolekcji(naStanie, kol) : [];
    return { ...r, liczba: lista.length, od: minCena(lista), foto: okladka(lista, zajete) };
  })
    .filter((r) => r.liczba > 0)
    .slice(0, 8);

  // Rzędy produktów
  const nowosci = roznorodne(zwinWarianty(najnowsze), 10, zajete);
  const rzadTanie = roznorodne(zwinWarianty([...tanie].reverse()), 10, zajete);

  return (
    <div className="overflow-x-hidden bg-strona">
      {/* Pasek informacyjny */}
      <div className="flex justify-center gap-5 bg-akcent px-4 py-2 text-[12.5px] font-semibold text-white md:gap-9">
        <span>Darmowa dostawa od {DARMOWA_DOSTAWA_OD} zł</span>
        <span>14 dni na zwrot</span>
        <span className="hidden sm:inline">BLIK · karta · Przelewy24</span>
      </div>

      <Nawigacja aktywna="home" />

      <main className="mx-auto max-w-content px-3 pb-16 pt-4 md:px-10 md:pt-6">
        <h1 className="sr-only">bobas-shopping — ubranka dla dzieci i niemowląt oraz odzież męska</h1>
        {/* Banery z cenami */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr] md:gap-4">
          <Link
            href={`/kolekcje/${kolKomplety?.slug ?? "komplety-dzieciece"}`}
            className="relative flex min-h-[300px] flex-col overflow-hidden rounded-2xl bg-[oklch(95%_0.015_160)] p-6 no-underline md:row-span-2 md:min-h-[380px] md:p-9"
          >
            <h2 className="max-w-[13ch] text-[30px] font-extrabold leading-[1.05] tracking-tight text-ink md:text-[42px]">Komplety dla niemowląt</h2>
            <p className="mt-3 text-[15px] font-bold text-ink-2">
              już od <span className="text-[28px] font-extrabold text-cena">{formatCena(minCena(komplety))} zł</span>
            </p>
            <div className="mt-4 flex flex-1 items-end justify-center gap-3 md:absolute md:bottom-6 md:right-8 md:mt-0">
              {kompletyFoto.map(({ produkt: p }) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={p.id} src={p.zdjecie!} alt="" className="h-[150px] w-[130px] object-contain mix-blend-multiply md:h-[250px] md:w-[210px]" />
              ))}
            </div>
            <span className="mt-4 self-start rounded-lg bg-ink px-5 py-3 text-[14px] font-bold text-white md:mt-auto">Zobacz komplety</span>
          </Link>

          <Link href={`/produkty?cena=${DO_20.slug}`} className="relative flex min-h-[170px] flex-col overflow-hidden rounded-2xl bg-[oklch(96.5%_0.02_60)] p-6 no-underline md:p-8">
            <h2 className="max-w-[11ch] text-[23px] font-extrabold leading-tight tracking-tight text-ink">Wszystko do 20&nbsp;zł</h2>
            {/* Liczone jak na liście (kolory jednego modelu = 1 produkt), żeby liczba się zgadzała. */}
            <p className="mt-1.5 text-[14px] font-bold text-ink-2">
              {produkty(zwinWarianty(katalog.filter((p) => p.cena >= DO_20.min && p.cena < DO_20.max)).length)}
            </p>
            {tanieFoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tanieFoto.zdjecie!} alt="" className="absolute bottom-3 right-4 h-[120px] w-[110px] object-contain mix-blend-multiply md:h-[140px] md:w-[130px]" />
            ) : null}
          </Link>

          <Link href="/produkty?kategoria=dorosli" className="relative flex min-h-[170px] flex-col overflow-hidden rounded-2xl bg-[oklch(95.5%_0.008_250)] p-6 no-underline md:p-8">
            <h2 className="max-w-[11ch] text-[23px] font-extrabold leading-tight tracking-tight text-ink">Męskie bluzy i dresy</h2>
            <p className="mt-1.5 text-[14px] font-bold text-ink-2">
              od <span className="text-[20px] font-extrabold text-cena">{formatCena(minCena(meskie))} zł</span>
            </p>
            {meskieFoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={meskieFoto.zdjecie!} alt="" className="absolute bottom-3 right-4 h-[120px] w-[110px] object-contain mix-blend-multiply md:h-[140px] md:w-[130px]" />
            ) : null}
          </Link>
        </div>

        {/* Kupuj według rodzaju */}
        <section className="mt-6 rounded-2xl bg-white p-4 md:mt-8 md:p-6">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h2 className="text-[20px] font-extrabold tracking-tight md:text-[22px]">Kupuj według rodzaju</h2>
            <Link href="/produkty" className="shrink-0 text-[14px] font-bold text-akcent no-underline hover:underline">
              Wszystkie produkty →
            </Link>
          </div>
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 md:mx-0 md:justify-between md:px-0 [&::-webkit-scrollbar]:hidden">
            {rodzaje.map((r) => (
              <Link key={r.slug} href={`/kolekcje/${r.slug}`} className="group flex w-[88px] shrink-0 flex-col items-center text-center no-underline md:w-[120px]">
                <span className="mb-2 flex h-[80px] w-[80px] items-center justify-center rounded-full bg-szary p-2.5 transition-colors group-hover:bg-akcent-2 md:h-[112px] md:w-[112px] md:p-3.5">
                  {r.foto?.zdjecie ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.foto.zdjecie} alt="" className="h-full w-full object-contain mix-blend-multiply" />
                  ) : null}
                </span>
                <span className="text-[14px] font-bold text-ink">{r.label}</span>
                <span className="text-[12.5px] text-ink-2">od {formatCena(r.od)} zł</span>
              </Link>
            ))}
          </div>
        </section>

        <Rzad tytul="Nowości" link="/produkty?sort=nowosci" linkTekst="Zobacz wszystkie" pozycje={nowosci} />
        <Rzad tytul="Do 20 zł" link={`/produkty?cena=${DO_20.slug}&sort=cena-rosnaco`} linkTekst="Od najtańszych" pozycje={rzadTanie} />

        {/* Konkretnie o zakupach */}
        <div className="mt-6 grid grid-cols-2 gap-3 md:mt-8 md:grid-cols-4 md:gap-4">
          {[
            { ikona: "0 zł", t: `Darmowa dostawa od ${DARMOWA_DOSTAWA_OD} zł`, o: `InPost, ORLEN, DPD, Pocztex, kurierzy — poniżej progu od ${formatCena(dostawaOd)} zł` },
            { ikona: "14", t: "14 dni na zwrot", o: "Bez podawania przyczyny" },
            { ikona: "cm", t: "Wymiary każdego rozmiaru", o: "Wzrost, długość i szerokość w opisie" },
            { ikona: "P24", t: "BLIK, karta, Przelewy24", o: "Szybka płatność online" },
          ].map((f) => (
            <div key={f.t} className="flex flex-col gap-2.5 rounded-2xl bg-white p-4 md:flex-row md:gap-3.5 md:p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-akcent-2 text-[13px] font-extrabold text-akcent">{f.ikona}</span>
              <span>
                <span className="block text-[14.5px] font-bold text-ink">{f.t}</span>
                <span className="block text-[13px] leading-snug text-ink-2">{f.o}</span>
              </span>
            </div>
          ))}
        </div>

        {/* Pomoc z rozmiarem */}
        <section className="mt-6 flex flex-col gap-4 rounded-2xl bg-white p-5 md:mt-8 md:flex-row md:items-center md:justify-between md:p-6">
          <div>
            <h2 className="text-[18px] font-extrabold tracking-tight">Nie wiesz, jaki rozmiar wybrać?</h2>
            <p className="text-[14px] text-ink-2">
              Sprawdź <Link href="/rozmiary" className="font-semibold text-akcent">tabelę rozmiarów</Link> albo napisz — podpowiemy na podstawie wzrostu dziecka.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <a href="tel:+48793878222" className="rounded-lg bg-ink px-4 py-2.5 text-[14px] font-bold text-white no-underline hover:bg-akcent">
              +48 793 878 222
            </a>
            <a href="mailto:amin.kids1@hotmail.com" className="rounded-lg border border-linia-2 px-4 py-2.5 text-[14px] font-bold text-ink no-underline hover:border-ink">
              amin.kids1@hotmail.com
            </a>
          </div>
        </section>
      </main>

      <Newsletter />
      <Stopka />
    </div>
  );
}
