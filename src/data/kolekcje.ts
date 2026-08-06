import type { Kategoria, Produkt } from "@/data/produkty";

// Strony docelowe (landing pages) pod frazy sprzedażowe. Każda ma własny URL,
// tytuł, nagłówek H1, opis SEO, treść i FAQ (rich results) oraz listę produktów
// dopasowaną po nazwie/kategorii. Cel: wysokie pozycje na konkretne zapytania.

export interface Kolekcja {
  slug: string;
  h1: string;
  tytul: string; // meta title (bez sufiksu marki — dokłada go szablon)
  opis: string; // meta description
  wstep: string; // akapit widoczny na stronie (unikalna treść SEO)
  kategoria: Kategoria | null;
  klucze: string[]; // dopasowanie po nazwie produktu (znormalizowane, małe litery)
  faq: { q: string; a: string }[];
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "");
}

/** Produkty pasujące do kolekcji (kategoria + słowo w nazwie). */
export function produktyKolekcji(produkty: Produkt[], kol: Kolekcja): Produkt[] {
  return produkty.filter((p) => {
    if (kol.kategoria && p.kategoria !== kol.kategoria) return false;
    const n = norm(p.nazwa);
    return kol.klucze.some((k) => n.includes(k));
  });
}

export function znajdzKolekcje(slug: string): Kolekcja | undefined {
  return KOLEKCJE.find((k) => k.slug === slug);
}

const FAQ_ROZMIAR = {
  q: "Jak dobrać rozmiar?",
  a: "Rozmiar odpowiada wzrostowi dziecka w centymetrach (np. 92 = ok. 92 cm wzrostu). Zmierz dziecko i wybierz najbliższy rozmiar; jeśli jest pomiędzy — weź większy. Na karcie każdego produktu znajdziesz tabelę rozmiarów.",
};
const FAQ_DOSTAWA = {
  q: "Jak szybko dotrze zamówienie?",
  a: "Wysyłamy w 1–2 dni robocze przez InPost, ORLEN Paczka, DPD lub DHL. Darmowa dostawa od 150 zł, a na zwrot masz 14 dni.",
};

export const KOLEKCJE: Kolekcja[] = [
  // ── Chłopcy ──────────────────────────────────────────────────────────────
  {
    slug: "spodnie-dla-chlopca",
    h1: "Spodnie dla chłopca",
    tytul: "Spodnie dla chłopca 0–12 lat",
    opis: "Spodnie dla chłopca — dresowe, sportowe i na co dzień. Wygodna gumka w pasie, miękkie tkaniny, rozmiary 62–170. Wysyłka InPost, 14 dni na zwrot.",
    wstep:
      "Szukasz spodni dla chłopca, które wytrzymają bieganie, plac zabaw i częste pranie? W tej kolekcji znajdziesz spodnie dresowe i sportowe z miękką gumką w pasie, która nie uciska brzuszka. Wygodne fasony sprawdzają się do przedszkola, szkoły i na wyjście — a rozmiary od 62 do 170 pozwalają dobrać je dla malucha i starszaka.",
    kategoria: "chlopcy",
    klucze: ["spodnie", "dres", "legginsy"],
    faq: [FAQ_ROZMIAR, FAQ_DOSTAWA],
  },
  {
    slug: "bluzy-dla-chlopca",
    h1: "Bluzy dla chłopca",
    tytul: "Bluzy dla chłopca 0–12 lat",
    opis: "Bluzy dla chłopca — miękkie, ciepłe i wygodne, zakładane przez głowę lub rozpinane. Rozmiary 62–170. Wysyłka InPost, 14 dni na zwrot.",
    wstep:
      "Bluzy dla chłopca to podstawa garderoby na chłodniejsze dni. Wybieramy modele z miękkiej, przyjaznej skórze dzianiny — wygodne do zabawy i łatwe do łączenia ze spodniami czy dresami. Znajdziesz tu zarówno bluzy zakładane przez głowę, jak i rozpinane, w rozmiarach od niemowlęcych po szkolne.",
    kategoria: "chlopcy",
    klucze: ["bluza", "bluzka", "kaftanik"],
    faq: [FAQ_ROZMIAR, FAQ_DOSTAWA],
  },
  {
    slug: "komplety-dla-chlopca",
    h1: "Komplety dla chłopca",
    tytul: "Komplety dla chłopca 0–12 lat",
    opis: "Komplety dla chłopca — dresy i zestawy bluza + spodnie gotowe do noszenia. Miękkie tkaniny, rozmiary 62–170. Wysyłka InPost, 14 dni na zwrot.",
    wstep:
      "Komplet dla chłopca to najwygodniejszy wybór — dostajesz gotowy zestaw i nie musisz nic dobierać. W tej kolekcji znajdziesz komplety dresowe i zestawy bluza + spodnie z miękkich, oddychających tkanin. Idealne na co dzień, do przedszkola i na spacer, w rozmiarach od 62 do 170.",
    kategoria: "chlopcy",
    klucze: ["komplet"],
    faq: [FAQ_ROZMIAR, FAQ_DOSTAWA],
  },
  {
    slug: "koszulki-dla-chlopca",
    h1: "Koszulki i body dla chłopca",
    tytul: "Koszulki i body dla chłopca 0–12 lat",
    opis: "Koszulki i body dla chłopca — lekkie, bawełniane, na co dzień i pod bluzę. Rozmiary 62–170. Wysyłka InPost, 14 dni na zwrot.",
    wstep:
      "Koszulki i body dla chłopca to baza garderoby na cały sezon. Lekka, bawełniana dzianina jest przyjemna w dotyku i przewiewna — świetnie sprawdza się solo w cieplejsze dni i jako warstwa pod bluzę. Proste, wygodne fasony w rozmiarach od 62 do 170.",
    kategoria: "chlopcy",
    klucze: ["koszul", "t-shirt", "tshirt", "body"],
    faq: [FAQ_ROZMIAR, FAQ_DOSTAWA],
  },

  // ── Dziewczynki ──────────────────────────────────────────────────────────
  {
    slug: "spodnie-dla-dziewczynki",
    h1: "Spodnie i legginsy dla dziewczynki",
    tytul: "Spodnie i legginsy dla dziewczynki 0–12 lat",
    opis: "Spodnie i legginsy dla dziewczynki — prążkowane, dresowe i na co dzień. Miękka gumka, rozmiary 62–170. Wysyłka InPost, 14 dni na zwrot.",
    wstep:
      "Spodnie i legginsy dla dziewczynki, które dają pełną swobodę ruchu podczas zabawy. Prążkowana dzianina i miękka gumka w pasie układają się na sylwetce i nie krępują ruchów. Świetnie łączą się z bluzami i tunikami — do przedszkola, szkoły i na spacer, w rozmiarach od 62 do 170.",
    kategoria: "dziewczynki",
    klucze: ["spodnie", "legginsy", "dres"],
    faq: [FAQ_ROZMIAR, FAQ_DOSTAWA],
  },
  {
    slug: "sukienki-dla-dziewczynki",
    h1: "Sukienki dla dziewczynki",
    tytul: "Sukienki dla dziewczynki 0–12 lat",
    opis: "Sukienki dla dziewczynki — zwiewne, wygodne, na co dzień i na specjalne okazje. Rozmiary 62–170. Wysyłka InPost, 14 dni na zwrot.",
    wstep:
      "Sukienki dla dziewczynki, w których wygoda idzie w parze z ładnym wyglądem. Zwiewne, przyjazne skórze materiały sprawdzają się i na co dzień, i na specjalne okazje. Dziewczęce fasony w rozmiarach od 62 do 170 — dla maluszka i starszej dziewczynki.",
    kategoria: "dziewczynki",
    klucze: ["sukienk", "tunika", "spodnic"],
    faq: [FAQ_ROZMIAR, FAQ_DOSTAWA],
  },
  {
    slug: "bluzy-dla-dziewczynki",
    h1: "Bluzy dla dziewczynki",
    tytul: "Bluzy dla dziewczynki 0–12 lat",
    opis: "Bluzy dla dziewczynki — miękkie i ciepłe, idealne na chłodniejsze dni. Rozmiary 62–170. Wysyłka InPost, 14 dni na zwrot.",
    wstep:
      "Bluzy dla dziewczynki na chłodniejsze dni — miękkie, ciepłe i wygodne. Przyjazna skórze dzianina świetnie łączy się z legginsami, spodniami i sukienkami. Uniwersalne fasony do zabawy i na wyjście, w rozmiarach od 62 do 170.",
    kategoria: "dziewczynki",
    klucze: ["bluza", "bluzka", "kaftanik"],
    faq: [FAQ_ROZMIAR, FAQ_DOSTAWA],
  },
  {
    slug: "komplety-dla-dziewczynki",
    h1: "Komplety dla dziewczynki",
    tytul: "Komplety dla dziewczynki 0–12 lat",
    opis: "Komplety dla dziewczynki — gotowe zestawy z miękkich tkanin. Rozmiary 62–170. Wysyłka InPost, 14 dni na zwrot.",
    wstep:
      "Komplet dla dziewczynki to gotowy, spójny zestaw — wygoda i ładny wygląd bez dobierania. Miękkie, oddychające tkaniny sprawdzają się na co dzień i na wyjście. Rozmiary od 62 do 170, dla maluszka i starszej dziewczynki.",
    kategoria: "dziewczynki",
    klucze: ["komplet"],
    faq: [FAQ_ROZMIAR, FAQ_DOSTAWA],
  },

  // ── Niemowlęta ───────────────────────────────────────────────────────────
  {
    slug: "body-niemowlece",
    h1: "Body niemowlęce",
    tytul: "Body niemowlęce — bawełniane 56–92",
    opis: "Body niemowlęce z miękkiej bawełny — zapinane na zatrzaski, łatwe przewijanie. Rozmiary 56–92. Wysyłka InPost, 14 dni na zwrot.",
    wstep:
      "Body niemowlęce to podstawa wyprawki. Wybieramy modele z miękkiej, oddychającej bawełny, delikatnej dla wrażliwej skóry noworodka. Zapięcia na zatrzaski ułatwiają przewijanie i przebieranie, także w nocy. Rozmiary od 56 do 92 — na pierwsze tygodnie i kolejne miesiące.",
    kategoria: "niemowleta",
    klucze: ["body"],
    faq: [FAQ_ROZMIAR, FAQ_DOSTAWA],
  },
  {
    slug: "pajacyki-i-spiochy-niemowlece",
    h1: "Pajacyki i śpiochy niemowlęce",
    tytul: "Pajacyki i śpiochy niemowlęce 56–92",
    opis: "Pajacyki i śpiochy niemowlęce — zapinane na zatrzaski, miękka bawełna, wygodne do spania i na co dzień. Wysyłka InPost, 14 dni na zwrot.",
    wstep:
      "Pajacyki i śpiochy niemowlęce zapewniają maluchowi komfort przez cały dzień i noc. Zapięcia na zatrzaski wzdłuż nogawek to błyskawiczne przewijanie, a miękka bawełna nie podrażnia delikatnej skóry. Jednoczęściowy fason nie podwija się — idealny do spania, na spacer i do domu.",
    kategoria: "niemowleta",
    klucze: ["pajac", "spioch", "polspioch"],
    faq: [FAQ_ROZMIAR, FAQ_DOSTAWA],
  },
  {
    slug: "komplety-niemowlece",
    h1: "Komplety niemowlęce",
    tytul: "Komplety niemowlęce — dresy i zestawy 56–92",
    opis: "Komplety niemowlęce — gotowe zestawy bluza + spodnie z miękkiej bawełny. Łatwe zakładanie. Wysyłka InPost, 14 dni na zwrot.",
    wstep:
      "Komplet niemowlęcy to gotowy zestaw na co dzień — bez dobierania i kombinowania. Miękka bawełna jest przyjazna dla wrażliwej skóry, a wygodny krój ułatwia zakładanie i zdejmowanie. Idealny na spacer, do domu i jako element wyprawki, w rozmiarach 56–92.",
    kategoria: "niemowleta",
    klucze: ["komplet"],
    faq: [FAQ_ROZMIAR, FAQ_DOSTAWA],
  },
  {
    slug: "czapki-niemowlece",
    h1: "Czapki niemowlęce",
    tytul: "Czapki niemowlęce — bawełniane",
    opis: "Czapki niemowlęce z miękkich, przyjaznych skórze materiałów — chronią główkę malucha. Wysyłka InPost, 14 dni na zwrot.",
    wstep:
      "Czapki niemowlęce to drobny, ale niezbędny dodatek, który chroni główkę malucha przed chłodem i wiatrem. Miękkie, przyjazne skórze materiały są delikatne dla wrażliwej skóry noworodka. Dopełniają każdy zestaw i wyprawkę.",
    kategoria: "niemowleta",
    klucze: ["czapk", "opaska"],
    faq: [FAQ_ROZMIAR, FAQ_DOSTAWA],
  },

  // ── Frazy ogólne (wszystkie kategorie) ───────────────────────────────────
  {
    slug: "dresy-dzieciece",
    h1: "Dresy dziecięce",
    tytul: "Dresy dziecięce 0–12 lat",
    opis: "Dresy dziecięce — komplety i spodnie dresowe dla dziewczynek, chłopców i niemowląt. Miękkie i wytrzymałe. Wysyłka InPost, 14 dni na zwrot.",
    wstep:
      "Dresy dziecięce to najwygodniejszy wybór na co dzień — dla dziewczynek, chłopców i niemowląt. Miękkie, oddychające tkaniny i wytrzymałe wykończenie znoszą intensywną zabawę i częste pranie. Komplety i pojedyncze spodnie dresowe w rozmiarach od 56 do 170.",
    kategoria: null,
    klucze: ["dres"],
    faq: [FAQ_ROZMIAR, FAQ_DOSTAWA],
  },
  {
    slug: "komplety-dzieciece",
    h1: "Komplety dziecięce",
    tytul: "Komplety dziecięce 0–12 lat",
    opis: "Komplety dziecięce — gotowe zestawy dla dziewczynek, chłopców i niemowląt. Miękkie tkaniny, rozmiary 56–170. Wysyłka InPost, 14 dni na zwrot.",
    wstep:
      "Komplety dziecięce to gotowe zestawy, które oszczędzają czas — nie trzeba nic dobierać. Znajdziesz tu komplety dla dziewczynek, chłopców i niemowląt z miękkich, przyjaznych skórze tkanin. Idealne na co dzień, do żłobka, przedszkola i na wyjście.",
    kategoria: null,
    klucze: ["komplet"],
    faq: [FAQ_ROZMIAR, FAQ_DOSTAWA],
  },
  {
    slug: "body-dzieciece",
    h1: "Body dziecięce",
    tytul: "Body dziecięce i niemowlęce",
    opis: "Body dziecięce — bawełniane, zapinane na zatrzaski, dla niemowląt i starszaków. Rozmiary 56–170. Wysyłka InPost, 14 dni na zwrot.",
    wstep:
      "Body dziecięce z miękkiej, oddychającej bawełny — przyjazne dla delikatnej skóry. Zapięcia na zatrzaski ułatwiają zakładanie i przewijanie. To baza garderoby zarówno dla niemowląt, jak i starszych dzieci, w rozmiarach od 56 do 170.",
    kategoria: null,
    klucze: ["body"],
    faq: [FAQ_ROZMIAR, FAQ_DOSTAWA],
  },
  {
    slug: "czapki-dzieciece",
    h1: "Czapki dziecięce",
    tytul: "Czapki dziecięce 0–12 lat",
    opis: "Czapki dziecięce dla niemowląt i starszaków — miękkie i przyjazne skórze, chronią przed chłodem. Wysyłka InPost, 14 dni na zwrot.",
    wstep:
      "Czapki dziecięce chronią główkę przed chłodem i wiatrem — dla niemowląt i starszych dzieci. Miękkie, przyjazne skórze materiały są delikatne i wygodne. Dopełniają każdą stylizację i sprawdzają się przez cały sezon.",
    kategoria: null,
    klucze: ["czapk", "opaska"],
    faq: [FAQ_ROZMIAR, FAQ_DOSTAWA],
  },
];
