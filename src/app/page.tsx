import { urlProduktu } from "@/lib/adresProduktu";
import { zdjecie } from "@/lib/zdjecia";
import Link from "next/link";
import { Nawigacja } from "@/components/Nawigacja";
import { KartaProduktu } from "@/components/KartaProduktu";
import { Newsletter } from "@/components/Newsletter";
import { Stopka } from "@/components/Stopka";
import { type Produkt } from "@/data/produkty";
import { KOLEKCJE, produktyKolekcji } from "@/data/kolekcje";
import { katalogWidoczny } from "@/lib/produktyDb";
import { zwinWarianty, type Zwiniety } from "@/lib/warianty";
import { formatCena, ZAKRESY_CENY } from "@/lib/filtrowanie";
import { kwotaTekst, najtanszaDostawa } from "@/lib/dostawa";
import { pobierzDostawe } from "@/lib/dostawaDb";
import { rozmiaryTekst, sprzedazOstatnio, wybierzHit } from "@/lib/hitTygodnia";
import { WYBRANY_HIT } from "@/data/hitTygodnia";
import { BanerPromocji } from "@/components/BanerPromocji";
import { sztukNaStanie, zdjeciaDoReklamy } from "@/lib/feedEtykiety";
import { cieplePierwsze, czyCieply, sezonZimowy, SLUG_ZIMA } from "@/lib/sezon";

// ISR: strona buduje się i odświeża co 5 minut zamiast przy każdym żądaniu.
export const revalidate = 900;

// „Kupuj według rodzaju" — strony kolekcji (te same filtry co na stronie kolekcji).
const RODZAJE: { slug: string; label: string }[] = [
  { slug: "body-niemowlece", label: "Body" },
  { slug: "pajacyki-i-spiochy-niemowlece", label: "Pajacyki" },
  { slug: "komplety-dzieciece", label: "Komplety" },
  { slug: "dresy-dzieciece", label: "Dresy" },
  { slug: "spodnie-dla-dziewczynki", label: "Legginsy" },
  { slug: "spodnie-dla-chlopca", label: "Spodnie" },
  { slug: "sukienki-dla-dziewczynki", label: "Sukienki" },
  { slug: "bluzki-dla-dziewczynki", label: "Bluzki" },
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

// Okładka kafelka „Kupuj według rodzaju": ładny przedstawiciel kategorii, nie najtańszy produkt.
// 1) zdjęcie wybrane do reklam (data/zdjeciaReklamowe), 2) świeży produkt z ceną co najmniej
// środkową w kategorii, porządną galerią i zapasem, 3) awaryjnie najnowszy z galerią.
// Najpierw produkty, których nazwa ZACZYNA SIĘ od rodzaju („Spodnie…", „Body…") — kafelek „Spodnie"
// nie pokazuje kompletu, który tylko ma spodnie w nazwie.
const bezOgonkow = (s: string) => s.toLowerCase().replace(/ł/g, "l").normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
function okladkaKategorii(caLista: Produkt[], zajete: Set<string>, klucze: string[] = []): string | undefined {
  const dostepne = caLista.filter((p) => p.zdjecie && !zajete.has(p.zdjecie) && !zajete.has(p.id));
  const tegoRodzaju = dostepne.filter((p) => klucze.some((k) => bezOgonkow(p.nazwa).startsWith(k)));
  const wolne = tegoRodzaju.length ? tegoRodzaju : dostepne;
  if (!wolne.length) return undefined;
  const ceny = wolne.map((p) => p.cena).sort((a, b) => a - b);
  const srodek = ceny[Math.floor(ceny.length / 2)];
  const reklamowe = wolne.filter((p) => zdjeciaDoReklamy(p).top);
  const porzadne = wolne.filter((p) => p.cena >= srodek && (p.zdjecia?.length ?? 0) >= 3 && sztukNaStanie(p) >= 2);
  const zGaleria = wolne.filter((p) => (p.zdjecia?.length ?? 0) >= 2);
  const pula = reklamowe.length ? reklamowe : porzadne.length ? porzadne : zGaleria.length ? zGaleria : wolne;
  const p = pula[pula.length - 1]; // lista od najstarszego — bierzemy najnowszy
  const foto = zdjeciaDoReklamy(p).zdjecia[0] || p.zdjecie!;
  [p.id, p.zdjecie ?? "", foto].forEach((k) => zajete.add(k));
  return foto;
}

const minCena = (l: Produkt[]) => (l.length ? Math.min(...l.map((p) => p.cena)) : 0);

function Rzad({ tytul, link, linkTekst, pozycje }: { tytul: string; link: string; linkTekst: string; pozycje: Zwiniety[] }) {
  return (
    <section className="mt-3 rounded-2xl bg-white p-4 md:mt-8 md:p-6">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="text-[18px] font-extrabold tracking-tight md:text-[22px]">{tytul}</h2>
        <Link href={link} className="-my-2 shrink-0 py-2 text-[13.5px] font-bold text-akcent no-underline hover:underline md:text-[14px]">
          {linkTekst} →
        </Link>
      </div>
      <div className="-mx-4 grid snap-x auto-cols-[44%] grid-flow-col gap-2.5 overflow-x-auto px-4 pb-1 sm:auto-cols-[31%] md:mx-0 md:auto-cols-[calc((100%-4*14px)/5)] md:gap-[14px] md:px-0 [&::-webkit-scrollbar]:hidden">
        {pozycje.map(({ produkt, kolory, cenaMin, cenyRozne }) => (
          <div key={produkt.id} className="snap-start">
            <KartaProduktu produkt={produkt} liczbaKolorow={kolory} cenaOd={cenyRozne ? cenaMin : undefined} />
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
  const ustawieniaDostawy = await pobierzDostawe();
  const DARMOWA_DOSTAWA_OD = ustawieniaDostawy.darmowaOd;
  const dostawaOd = najtanszaDostawa(ustawieniaDostawy);
  const zajete = new Set<string>();

  // Banery: „Hit tygodnia" (najchętniej kupowany albo co tydzień inna nowość — lib/hitTygodnia)
  const zima = sezonZimowy();
  const hit = wybierzHit(naStanie, await sprzedazOstatnio(), new Date(), zima ? czyCieply : undefined, WYBRANY_HIT);
  const zdjecieHitu = hit ? zdjeciaDoReklamy(hit.produkt).zdjecia[0] || hit.produkt.zdjecie : undefined;
  if (zdjecieHitu) zajete.add(zdjecieHitu);
  if (hit) [hit.produkt.id, hit.produkt.zdjecie ?? "", hit.produkt.nazwa.toLowerCase()].forEach((k) => zajete.add(k));
  const tanie = naStanie.filter((p) => p.cena >= DO_20.min && p.cena < DO_20.max);
  const tanieFoto = okladka(tanie.filter((p) => p.kategoria !== "dorosli"), zajete);
  const meskie = naStanie.filter((p) => p.kategoria === "dorosli");
  const meskieFoto = okladka(meskie, zajete);

  // Zimą: osobny rząd ciepłych rzeczy dziecięcych zaraz pod banerami (najnowsze najpierw).
  const cieple = zima ? naStanie.filter((p) => p.kategoria !== "dorosli" && czyCieply(p)) : [];
  const rzadZima = zima ? roznorodne(zwinWarianty([...cieple].reverse()), 10, zajete) : [];

  // Kółka rodzajów (zimą „Na zimę" pierwsze)
  const rodzaje = (zima ? [{ slug: SLUG_ZIMA, label: "Na zimę" }, ...RODZAJE] : RODZAJE).map((r) => {
    const kol = KOLEKCJE.find((k) => k.slug === r.slug);
    const lista = kol ? produktyKolekcji(naStanie, kol) : [];
    return { ...r, liczba: lista.length, foto: okladkaKategorii(lista, zajete, kol?.klucze.slice(0, 1)) }; // główne słowo kolekcji („spodnie", nie „dres")
  })
    .filter((r) => r.liczba > 0)
    .slice(0, 8);

  // Rzędy produktów
  const nowosci = roznorodne(zwinWarianty(najnowsze), 10, zajete);
  const rzadTanie = roznorodne(zwinWarianty(zima ? cieplePierwsze([...tanie].reverse()) : [...tanie].reverse()), 10, zajete);

  return (
    <div className="overflow-x-clip bg-strona">
      {/* Pasek informacyjny */}
      {/* Ustępuje pomarańczowemu paskowi promocji, gdy promocja trwa (PasekPromocji → html[data-promocja]). */}
      <div className="pasek-info flex justify-center gap-5 bg-akcent px-4 py-2 text-[12.5px] font-semibold text-white md:gap-9">
        <span>Dostawa od {kwotaTekst(dostawaOd)}</span>
        <span>Darmowa od {kwotaTekst(DARMOWA_DOSTAWA_OD)}</span>
        <span className="hidden min-[400px]:inline">14 dni na zwrot</span>
        <span className="hidden sm:inline">BLIK · karta · Przelewy24</span>
      </div>

      <Nawigacja aktywna="home" />

      <main className="mx-auto max-w-content px-3 pb-10 pt-3 md:px-10 md:pb-16 md:pt-6">
        <h1 className="sr-only">bobas-shopping — ubranka dla dzieci i niemowląt oraz odzież męska</h1>
        <BanerPromocji />
        {/* Banery z cenami */}
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-[2fr_1fr] md:gap-4">
          {hit ? (
            <Link
              href={urlProduktu(hit.produkt)}
              className="relative col-span-2 grid min-h-[230px] grid-cols-[1fr_auto] items-center gap-4 overflow-hidden rounded-2xl bg-akcent p-5 text-white no-underline md:col-span-1 md:row-span-2 md:min-h-[380px] md:grid-cols-[1.1fr_1fr] md:gap-8 md:px-10 md:py-9"
            >
              <div className="flex min-w-0 flex-col">
                <span className="mb-2 self-start rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[.08em] md:mb-3 md:text-[12px]">
                  {hit.zrodlo === "sprzedaz" ? "Najchętniej kupowany" : hit.zrodlo === "polecany" ? "Polecamy" : "Wybór tygodnia"}
                </span>
                <h2 className="text-[26px] font-extrabold leading-[1.02] tracking-tight md:text-[46px]">
                  Hit tygodnia{hit.produkt.kategoria === "niemowleta" ? " dla maluszka" : ""}
                </h2>
                <p className="mt-2 line-clamp-2 text-[13.5px] font-semibold text-white/90 md:mt-3.5 md:line-clamp-none md:max-w-[34ch] md:text-[16.5px]">
                  {hit.produkt.nazwa}
                  {hit.rozmiary.length ? <span className="hidden md:inline">. Rozmiary na stanie: {rozmiaryTekst(hit.rozmiary)}.</span> : null}
                </p>
                <span className="mt-4 self-start rounded-lg bg-white px-4 py-2.5 text-[13.5px] font-bold text-ink md:mt-6 md:px-5 md:py-3 md:text-[14px]">
                  Zobacz produkt
                </span>
              </div>
              <div className="relative w-[128px] rotate-[2.5deg] rounded-2xl bg-white p-1.5 shadow-[0_14px_32px_rgba(0,0,0,.2)] md:w-[300px] md:justify-self-center md:p-3">
                <span className="absolute -left-3 -top-3 z-10 -rotate-6 rounded-full bg-cena px-2.5 py-1 text-[13px] font-extrabold text-white md:-left-5 md:-top-4 md:px-3.5 md:py-2 md:text-[18px]">
                  {formatCena(hit.produkt.cena)} zł
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={zdjecie(zdjecieHitu, "s720")} alt={hit.produkt.nazwa} className="aspect-square w-full rounded-xl bg-white object-contain" />
              </div>
            </Link>
          ) : null}

          <Link href={`/produkty?cena=${DO_20.slug}`} className="relative flex min-h-[172px] flex-col overflow-hidden rounded-2xl bg-[oklch(96.5%_0.02_60)] no-underline p-4 md:p-8">
            <h2 className="max-w-[11ch] text-[17px] font-extrabold leading-tight tracking-tight text-ink md:text-[23px]">Wszystko do 20&nbsp;zł</h2>
            {/* Liczone jak na liście (kolory jednego modelu = 1 produkt), żeby liczba się zgadzała. */}
            <p className="mt-1 text-[13px] font-bold text-ink-2 md:mt-1.5 md:text-[14px]">
              {produkty(zwinWarianty(katalog.filter((p) => p.cena >= DO_20.min && p.cena < DO_20.max)).length)}
            </p>
            {tanieFoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={zdjecie(tanieFoto.zdjecie, "s360")} alt="" className="absolute bottom-2 right-2 h-[88px] w-[96px] object-contain mix-blend-multiply md:bottom-3 md:right-4 md:h-[140px] md:w-[130px]" />
            ) : null}
          </Link>

          <Link href="/produkty?kategoria=dorosli" className="relative flex min-h-[172px] flex-col overflow-hidden rounded-2xl bg-[oklch(95.5%_0.008_250)] no-underline p-4 md:p-8">
            <h2 className="max-w-[11ch] text-[17px] font-extrabold leading-tight tracking-tight text-ink md:text-[23px]">Męskie bluzy i dresy</h2>
            <p className="mt-1 text-[13px] font-bold text-ink-2 md:mt-1.5 md:text-[14px]">
              od <span className="text-[17px] font-extrabold text-cena md:text-[20px]">{formatCena(minCena(meskie))} zł</span>
            </p>
            {meskieFoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={zdjecie(meskieFoto.zdjecie, "s360")} alt="" className="absolute bottom-2 right-2 h-[88px] w-[96px] object-contain mix-blend-multiply md:bottom-3 md:right-4 md:h-[140px] md:w-[130px]" />
            ) : null}
          </Link>
        </div>

        {rzadZima.length >= 4 ? (
          <Rzad tytul="❄ Ciepło na zimę" link={`/kolekcje/${SLUG_ZIMA}`} linkTekst="Wszystkie ciepłe" pozycje={rzadZima} />
        ) : null}

        {/* Kupuj według rodzaju */}
        <section className="mt-3 rounded-2xl bg-white p-4 md:mt-8 md:p-6">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h2 className="text-[18px] font-extrabold tracking-tight md:text-[22px]">Kupuj według rodzaju</h2>
            <Link href="/produkty" className="-my-2 shrink-0 py-2 text-[13.5px] font-bold text-akcent no-underline hover:underline md:text-[14px]">
              Wszystkie<span className="hidden md:inline"> produkty</span> →
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-x-2 gap-y-4 md:flex md:justify-between md:gap-3">
            {rodzaje.map((r) => (
              <Link key={r.slug} href={`/kolekcje/${r.slug}`} className="group flex min-w-0 flex-col items-center text-center no-underline md:w-[120px] md:shrink-0">
                <span className="mb-1.5 flex aspect-square w-full max-w-[76px] items-center justify-center rounded-full bg-szary p-2 md:mb-2 md:max-w-none transition-colors group-hover:bg-akcent-2 md:h-[112px] md:w-[112px] md:p-3.5">
                  {r.foto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={zdjecie(r.foto, "s360")} alt="" className="h-full w-full object-contain mix-blend-multiply" />
                  ) : null}
                </span>
                <span className="text-[13px] font-bold text-ink md:text-[14px]">{r.label}</span>
              </Link>
            ))}
          </div>
        </section>

        <Rzad tytul="Nowości" link="/produkty?sort=nowosci" linkTekst="Zobacz wszystkie" pozycje={nowosci} />
        <Rzad tytul="Do 20 zł" link={`/produkty?cena=${DO_20.slug}&sort=cena-rosnaco`} linkTekst="Od najtańszych" pozycje={rzadTanie} />

        {/* Konkretnie o zakupach */}
        <div className="mt-3 grid grid-cols-2 gap-2.5 md:mt-8 md:grid-cols-4 md:gap-4">
          {[
            { ikona: "🚚", t: `Dostawa od ${kwotaTekst(dostawaOd)}`, o: `Darmowa od ${kwotaTekst(DARMOWA_DOSTAWA_OD)} · InPost, ORLEN, DPD, Pocztex, DHL`, krotko: `Darmowa od ${kwotaTekst(DARMOWA_DOSTAWA_OD)}` },
            { ikona: "14", t: "14 dni na zwrot", o: "Bez podawania przyczyny" },
            { ikona: "cm", t: "Wymiary każdego rozmiaru", o: "Wzrost, długość i szerokość w opisie" },
            { ikona: "P24", t: "BLIK, karta, Przelewy24", o: "Szybka płatność online" },
          ].map((f: { ikona: string; t: string; o: string; krotko?: string }) => (
            <div key={f.t} className="flex flex-col gap-2 rounded-2xl bg-white p-3.5 md:flex-row md:gap-3.5 md:p-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-akcent-2 text-[12.5px] font-extrabold text-akcent md:h-10 md:w-10 md:text-[13px]">{f.ikona}</span>
              <span>
                <span className="block text-[13.5px] font-bold leading-snug text-ink md:text-[14.5px]">{f.t}</span>
                <span className="block text-[12px] leading-snug text-ink-2 md:text-[13px]">
                  <span className="md:hidden">{f.krotko ?? f.o}</span>
                  <span className="hidden md:inline">{f.o}</span>
                </span>
              </span>
            </div>
          ))}
        </div>

        {/* Reputacja: ten sam sprzedawca na Allegro — oceny kupujących do sprawdzenia. */}
        <p className="mt-3 text-center text-[13.5px] leading-relaxed text-ink-2 md:mt-4">
          Sprzedajemy też na Allegro jako <strong className="text-ink">bobas-shopping</strong> —{" "}
          <a
            href="https://allegro.pl/uzytkownik/bobas-shopping/oceny"
            target="_blank"
            rel="noopener"
            className="font-semibold text-ink underline underline-offset-2 hover:text-akcent"
          >
            zobacz oceny kupujących
          </a>
          <span className="mx-1.5">·</span>
          <a
            href="https://www.facebook.com/BobasShopping/"
            target="_blank"
            rel="noopener"
            className="font-semibold text-ink underline underline-offset-2 hover:text-akcent"
          >
            ponad 1500 obserwujących na Facebooku
          </a>
        </p>

        {/* Pomoc z rozmiarem */}
        <section className="mt-3 flex flex-col gap-4 rounded-2xl bg-white p-4 md:mt-8 md:flex-row md:items-center md:justify-between md:p-6">
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
