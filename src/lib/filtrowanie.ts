import type { Kategoria, Produkt, Wiek } from "@/data/produkty";

// --- Wyszukiwarka tekstowa (jak na Allegro) ---------------------------------

const SYNONIMY: Record<Kategoria, string> = {
  dziewczynki: "dziewczynka dziewczyna dziewczece dziewczeca corka",
  chlopcy: "chlopiec chlopak chlopieca chlopiece syn",
  niemowleta: "niemowle niemowlak niemowleca bobas maluch noworodek",
  dorosli: "meski meskie meska dorosly dorosli mezczyzna mezczyzni tata",
};
const STOP = new Set(["i", "oraz", "dla", "na", "w", "z", "ze", "a", "do", "po", "lub", "the"]);

// Słowa z zapytania, które w katalogu występują pod inną nazwą.
const ZAMIENNIKI: Record<string, string[]> = {
  tshirt: ["t", "shirt"],
  koszulka: ["koszulka", "bluzka", "shirt"],
  spiochy: ["spiochy", "polspiochy"],
  pajac: ["pajac", "pajacyk"],
  getry: ["getry", "legginsy"],
  bezrekawnik: ["bezrekawnik", "kamizelka"],
  sweter: ["sweter", "sweterek", "sweterkowa"],
};

function normalizuj(s: string): string {
  return s
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "");
}
function tokeny(s: string): string[] {
  return normalizuj(s)
    .replace(/\bt[\s-]?shirt/g, "tshirt t shirt")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

// Prosty rdzeń: bez końcówki fleksyjnej (szary/szare → szar, sukienka/sukienki → sukienk).
function rdzen(t: string): string {
  return t.length > 4 ? t.replace(/(ego|emu|ymi|ach|ami|owie|ów|ow|om|ej|ie|a|e|i|o|u|y)$/, "") : t;
}

// Odległość edycyjna ≤ 1 (literówka: „leginsy" → „legginsy", „bodi" → „body").
function jednaLiterowka(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1 || a === b) return a === b;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1);
  return a.length > b.length ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
}

function tokenPasuje(pt: string, qt: string): boolean {
  if (/^\d+$/.test(qt)) return pt === qt; // rozmiar/wiek: dokładnie („68" ≠ „680")
  if (qt.length < 4) return pt === qt || pt.startsWith(qt);
  if (pt.startsWith(qt)) return true;
  if (qt.length >= 5 && pt.includes(qt)) return true; // „spiochy" w „polspiochy"
  if (rdzen(pt) === rdzen(qt)) return true; // odmiana
  let i = 0;
  const n = Math.min(pt.length, qt.length);
  while (i < n && pt[i] === qt[i]) i++;
  if (i >= 5 && i >= n - 3) return true; // wspólny długi rdzeń: „chlopca" ~ „chlopiec"
  // Literówka tylko w dłuższych słowach — „bluza" i „bluzka" to różne rzeczy.
  return qt.length >= 4 && pt.length >= 4 && pt[0] === qt[0] && (qt.length >= 6 || rdzen(pt).length === rdzen(qt).length) && jednaLiterowka(pt, qt);
}

function slowaZapytania(fraza: string): string[][] {
  return tokeny(fraza)
    .filter((t) => !STOP.has(t) && t !== "tshirt")
    .map((t) => ZAMIENNIKI[t] ?? [t]);
}

// Pola „mocne" (to, czym produkt JEST) i opis (tylko awaryjnie, gdy nic innego nie pasuje).
function tokenyMocne(p: Produkt): string[] {
  return tokeny(
    [p.nazwa, p.kategoria, SYNONIMY[p.kategoria], p.wiekLabel, p.kolor ?? "", p.badge ?? "", (p.rozmiary ?? []).join(" ")].join(" "),
  );
}

function pasuje(zrodlo: string[], zapytanie: string[][]): boolean {
  return zapytanie.every((warianty) => warianty.some((qt) => zrodlo.some((pt) => tokenPasuje(pt, qt))));
}

// Słowa oznaczające zestaw/komplet — gdy szukamy pojedynczej rzeczy (np. „czapka"),
// komplet, który tylko ją zawiera, ma trafiać NIŻEJ niż sama czapka.
const SLOWA_ZESTAW = new Set([
  "komplet", "komplety", "kompletu", "zestaw", "zestawy", "set", "dres", "dresy",
  "dresowy", "dresowa", "pakiet", "paka", "wyprawka",
]);

/**
 * Wynik trafności produktu dla frazy (im wyżej, tym bardziej „to jest ta rzecz").
 * Reguły: trafienie na początku nazwy > dalej w nazwie > kolor/rozmiar/kategoria; dokładne
 * słowo > odmiana; komplet/zestaw dostaje karę, gdy nie szukamy właśnie kompletu.
 */
export function trafnoscFrazy(p: Produkt, fraza: string): number {
  const q = slowaZapytania(fraza);
  if (q.length === 0) return 0;
  const nazwaTok = tokeny(p.nazwa);
  let wynik = 0;
  for (const warianty of q) {
    let najlepszy = 1; // trafienie poza nazwą (kolor, rozmiar, kategoria, opis) — słabsze
    for (const qt of warianty) {
      const idx = nazwaTok.findIndex((pt) => tokenPasuje(pt, qt));
      if (idx === -1) continue;
      let w = 100 - Math.min(idx, 20) * 4; // im wcześniej w nazwie, tym lepiej
      if (idx === 0) w += 40; // nazwa zaczyna się od tego słowa
      if (nazwaTok.includes(qt)) w += 20; // dokładne słowo, nie odmiana
      najlepszy = Math.max(najlepszy, w);
    }
    wynik += najlepszy;
  }
  const plaskie = q.flat();
  const zapytanieZestaw = plaskie.some((qt) => SLOWA_ZESTAW.has(qt));
  const produktZestaw = nazwaTok.some((pt) => SLOWA_ZESTAW.has(pt));
  if (produktZestaw && !zapytanieZestaw) wynik -= 60; // komplet, a szukamy pojedynczej rzeczy
  if (p.stan === 0) wynik -= 200; // niedostępne na koniec
  return wynik;
}

/** Czy produkt pasuje do frazy po nazwie, kolorze, rozmiarze, wieku lub dziale — wszystkie słowa (AND). */
export function pasujeFraza(p: Produkt, fraza: string): boolean {
  const zapytanie = slowaZapytania(fraza);
  if (zapytanie.length === 0) return true;
  return pasuje(tokenyMocne(p), zapytanie);
}

/** Jak wyżej, ale szuka też w opisie — używane tylko, gdy po nazwie nic nie ma. */
export function pasujeFrazaWOpisie(p: Produkt, fraza: string): boolean {
  const zapytanie = slowaZapytania(fraza);
  if (zapytanie.length === 0) return true;
  return pasuje([...tokenyMocne(p), ...tokeny(p.opis ?? "")], zapytanie);
}

/** Czy dowolny tekst (np. nazwa kolekcji) zawiera wszystkie słowa frazy. */
export function pasujeTekst(tekst: string, fraza: string): boolean {
  const zapytanie = slowaZapytania(fraza);
  return zapytanie.length > 0 && pasuje(tokeny(tekst), zapytanie);
}

/** Znormalizowane słowa frazy (do podświetlania trafień). */
export function slowaFrazy(fraza: string): string[] {
  return tokeny(fraza).filter((t) => !STOP.has(t) && t !== "tshirt");
}

export { normalizuj as normalizujTekst };

/**
 * Wyszukiwanie: najpierw trafienia po nazwie/kolorze/rozmiarze; jeśli nic — po opisie.
 * `zOpisu` = wyniki pochodzą tylko z opisów (warto o tym powiedzieć klientowi).
 */
export function wyszukaj(produkty: Produkt[], fraza: string): { lista: Produkt[]; zOpisu: boolean } {
  if (!slowaZapytania(fraza).length) return { lista: produkty, zOpisu: false };
  const mocne = produkty.filter((p) => pasujeFraza(p, fraza));
  if (mocne.length) return { lista: mocne, zOpisu: false };
  return { lista: produkty.filter((p) => pasujeFrazaWOpisie(p, fraza)), zOpisu: true };
}


export type FiltrKategoria = Kategoria | "wszystkie";
export type FiltrWiek = Wiek | "wszystkie";
export type Sortowanie = "domyslnie" | "nowosci" | "cena-rosnaco" | "cena-malejaco";
export type FiltrWyroznienie = "wszystkie" | "NOWOŚĆ" | "BESTSELLER" | "promocja";

export interface ZakresCeny {
  slug: string; // w adresie: /produkty?cena=do-20
  label: string;
  min: number;
  max: number;
}

export const ZAKRESY_CENY: ZakresCeny[] = [
  { slug: "do-20", label: "do 20 zł", min: 0, max: 20 },
  { slug: "20-40", label: "20–40 zł", min: 20, max: 40 },
  { slug: "40-60", label: "40–60 zł", min: 40, max: 60 },
  { slug: "od-60", label: "powyżej 60 zł", min: 60, max: Infinity },
];

export interface Filtry {
  kategoria: FiltrKategoria;
  wiek: FiltrWiek;
  sortBy: Sortowanie;
  rozmiary?: string[];
  cena?: ZakresCeny | null;
  wyroznienie?: FiltrWyroznienie;
  fraza?: string;
}

/**
 * Filtruje i sortuje listę produktów wg wybranych filtrów.
 * Funkcja czysta (bez efektów ubocznych) — zwraca nową tablicę.
 */
export function filtrujProdukty(
  produkty: Produkt[],
  { kategoria, wiek, sortBy, rozmiary, cena, wyroznienie, fraza }: Filtry,
): Produkt[] {
  const baza = fraza && fraza.trim() ? wyszukaj(produkty, fraza).lista : produkty;
  const lista = baza.filter((p) => {
    if (kategoria !== "wszystkie" && p.kategoria !== kategoria) return false;
    if (wiek !== "wszystkie" && p.wiek !== wiek) return false;
    if (rozmiary && rozmiary.length > 0 && !p.rozmiary?.some((s) => rozmiary.includes(s))) return false;
    if (cena && !(p.cena >= cena.min && p.cena < cena.max)) return false;
    if (wyroznienie && wyroznienie !== "wszystkie") {
      if (wyroznienie === "promocja") {
        if (!p.badge || !p.badge.includes("%")) return false;
      } else if (p.badge !== wyroznienie) {
        return false;
      }
    }
    return true;
  });

  if (sortBy === "nowosci") return [...lista].reverse(); // katalog jest od najstarszego
  if (sortBy === "cena-rosnaco") return [...lista].sort((a, b) => a.cena - b.cena);
  if (sortBy === "cena-malejaco") return [...lista].sort((a, b) => b.cena - a.cena);
  // Domyślnie przy wyszukiwaniu: sortuj wg trafności (sama rzecz przed kompletem z tą rzeczą).
  if (fraza && fraza.trim()) {
    return [...lista].sort((a, b) => trafnoscFrazy(b, fraza) - trafnoscFrazy(a, fraza));
  }
  return lista;
}

/** Formatuje cenę do postaci "89,90". */
export function formatCena(cena: number): string {
  return cena.toFixed(2).replace(".", ",");
}
