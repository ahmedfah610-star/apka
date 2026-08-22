// ---------------------------------------------------------------------------
// Pełny katalog produktów Fasolka — zaimportowany z Allegro (bobas-shopping).
// 238 unikalnych produktów (warianty rozmiarowe scalone). Zdjęcia: allegroimg.com.
// Kategorie/wiek przypisane automatycznie po nazwach — można korygować ręcznie.
// ---------------------------------------------------------------------------

export type Kategoria = "dziewczynki" | "chlopcy" | "niemowleta";
export type Wiek = "0-2" | "2-6" | "6-12";

export interface Produkt {
  id: string;
  nazwa: string;
  cena: number;
  kategoria: Kategoria;
  wiek: Wiek;
  wiekLabel: string;
  badge?: string | null;
  rozmiary?: string[];
  /** Główne zdjęcie (zgodność wstecz). */
  zdjecie?: string | null;
  /** Galeria zdjęć (URL lub data:base64). Pierwsze = główne. */
  zdjecia?: string[];
  opis?: string;
  /** Pełny opis w HTML (z Allegro: tekst + grafiki). Renderowany na stronie produktu. */
  opisHtml?: string | null;
  /** Kolor (z parametru Allegro). */
  kolor?: string | null;
  /** Łączny stan magazynowy (suma po rozmiarach). undefined = bez limitu, 0 = brak. */
  stan?: number;
  /** Stan magazynowy per rozmiar: { "104": 3, "110": 0, ... }. Gdy ustawione — źródło prawdy dla dostępności rozmiarów. */
  stanRozmiary?: Record<string, number> | null;
  /** Oferta wyłączona (niewidoczna w sklepie). */
  ukryty?: boolean;
  hue: number;
}

export const KATEGORIE_LABEL: Record<Kategoria | "wszystkie", string> = {
  wszystkie: "Wszystkie produkty",
  dziewczynki: "Dziewczynki",
  chlopcy: "Chłopcy",
  niemowleta: "Niemowlęta",
};

export const WSZYSTKIE_ROZMIARY = ["62", "74", "86", "92", "104", "116", "128", "140", "152", "164"];

export const PRODUKTY: Produkt[] = [];

// --- Generator opisów produktów -------------------------------------------
// Allegro nie wyeksportowało oryginalnych opisów, dlatego składamy rozbudowany,
// zróżnicowany opis na podstawie nazwy (typ, materiał), kategorii, wieku i
// rozmiarów. Warianty dobierane deterministycznie z id (stabilne między buildami).

function hasz(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// Rozpoznanie typu ubranka po nazwie → dedykowane zdanie wprowadzające.
const TYPY: { klucze: string[]; zdania: string[] }[] = [
  { klucze: ["komplet", "dres"], zdania: [
    "Wygodny komplet, który tworzy gotowy zestaw na co dzień — nie trzeba niczego dobierać.",
    "Praktyczny komplet od razu do noszenia — spójny zestaw na wiele okazji.",
  ] },
  { klucze: ["bluza", "bluzka", "longsleeve", "kaftanik"], zdania: [
    "Miękka bluza, która grzeje w chłodniejsze dni i świetnie łączy się z resztą garderoby.",
    "Uniwersalna bluza na co dzień — wygodna zarówno do zabawy, jak i na wyjście.",
  ] },
  { klucze: ["t-shirt", "koszul", "body"], zdania: [
    "Lekka koszulka z przyjemnej w dotyku dzianiny — baza garderoby na cały sezon.",
    "Klasyczny fason, który sprawdza się solo i jako warstwa pod bluzę.",
  ] },
  { klucze: ["spodnie", "legginsy", "spodenki", "półśpiochy", "polspiochy"], zdania: [
    "Wygodne spodnie z miękką gumką w pasie, która nie uciska brzuszka.",
    "Swobodny fason, który daje pełną swobodę ruchu podczas zabawy.",
  ] },
  { klucze: ["sukienka", "spódnic", "tunika"], zdania: [
    "Zwiewna sukienka na specjalne okazje i na co dzień — wygodna i efektowna.",
    "Dziewczęcy fason, w którym wygoda idzie w parze z ładnym wyglądem.",
  ] },
  { klucze: ["pajac", "śpioch", "spioch", "kombinezon", "rampers"], zdania: [
    "Pajacyk zapinany na zatrzaski — błyskawiczne przewijanie i przebieranie, także w nocy.",
    "Jednoczęściowy fason, który nie podwija się i zapewnia maluchowi komfort przez cały dzień.",
  ] },
  { klucze: ["czapka", "czapeczka", "opaska", "skarpet", "rękawic", "rekawic"], zdania: [
    "Drobny, ale niezbędny dodatek, który dopełnia zestaw i chroni przed chłodem.",
    "Miękki dodatek z przyjaznych skórze materiałów — delikatny dla wrażliwej skóry.",
  ] },
  { klucze: ["kurtka", "kamizelka", "sweter", "sweterek", "bezrękawnik", "bezrekawnik"], zdania: [
    "Ciepła warstwa wierzchnia na chłodniejsze dni — lekka, a dobrze grzeje.",
    "Wygodne okrycie, które łatwo dołożyć, gdy robi się chłodniej.",
  ] },
];

const MATERIAL: { klucze: string[]; zdanie: string }[] = [
  { klucze: ["bawełn", "baweln"], zdanie: "Miękka, oddychająca bawełna jest przyjazna dla delikatnej skóry dziecka." },
  { klucze: ["prążk", "prazk", "dzianin"], zdanie: "Elastyczna, prążkowana dzianina dobrze układa się na sylwetce i nie krępuje ruchów." },
  { klucze: ["dres", "meszk", "ocieplan", "polar"], zdanie: "Miękki, lekko ocieplany materiał zapewnia ciepło i wygodę bez uczucia sztywności." },
];

const UZYCIE: Record<Kategoria, string[]> = {
  dziewczynki: [
    "Świetnie sprawdzi się na co dzień — do przedszkola, szkoły i na aktywną zabawę.",
    "Idealna na spacery, wyjścia i domowe popołudnia — łatwa do łączenia z innymi ubrankami.",
  ],
  chlopcy: [
    "Gotowe na każdą przygodę — od placu zabaw po szkolną ławkę.",
    "Wytrzymałe wykończenie znosi intensywną zabawę i częste pranie.",
  ],
  niemowleta: [
    "Łatwe zakładanie i zdejmowanie oraz pełen komfort maluszka przez cały dzień.",
    "Delikatne dla wrażliwej skóry noworodka — miękkie szwy i wygodny krój.",
  ],
};

function przedzialRozmiarow(p: Produkt): string {
  const n = (p.rozmiary ?? []).map(Number).filter((x) => !Number.isNaN(x)).sort((a, b) => a - b);
  if (n.length === 0) return "";
  const zakres = n.length === 1 ? `${n[0]}` : `${n[0]}–${n[n.length - 1]}`;
  return `Dostępne rozmiary: ${zakres} (${p.wiekLabel}). Rozmiar odpowiada wzrostowi dziecka w cm — jeśli maluch jest pomiędzy rozmiarami, wybierz większy.`;
}

const PIELEGNACJA = "Pranie w 30–40°C, prosta pielęgnacja i trwałe kolory po wielu praniach.";

function znajdz<T extends { klucze: string[] }>(lista: T[], nazwa: string): T | undefined {
  const n = nazwa.toLowerCase();
  return lista.find((x) => x.klucze.some((k) => n.includes(k)));
}

export function opisProduktu(p: Produkt): string {
  if (p.opis) return p.opis;
  const h = hasz(p.id);
  const czesci: string[] = [];

  const typ = znajdz(TYPY, p.nazwa);
  if (typ) czesci.push(typ.zdania[h % typ.zdania.length]);
  else czesci.push(`${p.nazwa} — wygodne ubranko z przyjaznych skórze materiałów.`);

  const mat = znajdz(MATERIAL, p.nazwa);
  if (mat) czesci.push(mat.zdanie);

  const uzycie = UZYCIE[p.kategoria];
  czesci.push(uzycie[h % uzycie.length]);

  const rozm = przedzialRozmiarow(p);
  if (rozm) czesci.push(rozm);

  czesci.push(PIELEGNACJA);

  return czesci.join(" ");
}

export function znajdzProdukt(id: string): Produkt | undefined {
  return PRODUKTY.find((p) => p.id === id);
}

/** Reprezentatywny produkt danej kategorii (pierwszy ze zdjęciem) — do kafli/hero. */
export function reprKategorii(kategoria: Kategoria): Produkt | undefined {
  return PRODUKTY.find((p) => p.kategoria === kategoria && p.zdjecie) ?? PRODUKTY.find((p) => p.kategoria === kategoria);
}
