import type { Kategoria, Produkt, Wiek } from "@/data/produkty";

// --- Wyszukiwarka tekstowa (jak na Allegro) ---------------------------------

const SYNONIMY: Record<Kategoria, string> = {
  dziewczynki: "dziewczynka dziewczyna dziewczece dziewczeca corka",
  chlopcy: "chlopiec chlopak chlopieca chlopiece syn",
  niemowleta: "niemowle niemowlak niemowleca bobas maluch noworodek",
};
const STOP = new Set(["i", "oraz", "dla", "na", "w", "z", "a", "do", "po", "lub", "the"]);

function normalizuj(s: string): string {
  return s
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "");
}
function tokeny(s: string): string[] {
  return normalizuj(s)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}
function tokenPasuje(pt: string, qt: string): boolean {
  if (qt.length < 4) return pt === qt || pt.startsWith(qt);
  if (pt.startsWith(qt) || qt.startsWith(pt)) return true;
  let i = 0;
  const n = Math.min(pt.length, qt.length);
  while (i < n && pt[i] === qt[i]) i++;
  return i >= 4; // wspólny rdzeń (odmiana), np. "niemowlecia" ~ "niemowleta"
}

// Słowa oznaczające zestaw/komplet — gdy szukamy pojedynczej rzeczy (np. „czapka"),
// komplet, który tylko ją zawiera, ma trafiać NIŻEJ niż sama czapka.
const SLOWA_ZESTAW = new Set([
  "komplet", "komplety", "kompletu", "zestaw", "zestawy", "set", "dres", "dresy",
  "dresowy", "dresowa", "pakiet", "paka", "wyprawka",
]);

/**
 * Wynik trafności produktu dla frazy (im wyżej, tym bardziej „to jest ta rzecz").
 * Reguły: trafienie na początku nazwy > dalej w nazwie > tylko w opisie; dokładne
 * słowo > odmiana; komplet/zestaw dostaje karę, gdy nie szukamy właśnie kompletu.
 */
export function trafnoscFrazy(p: Produkt, fraza: string): number {
  const q = tokeny(fraza).filter((t) => !STOP.has(t));
  if (q.length === 0) return 0;
  const nazwaTok = tokeny(p.nazwa);
  let wynik = 0;
  for (const qt of q) {
    const idx = nazwaTok.findIndex((pt) => tokenPasuje(pt, qt));
    if (idx === -1) {
      wynik += 1; // trafienie tylko w opisie/kategorii — słabe
      continue;
    }
    wynik += 100 - Math.min(idx, 20) * 4; // im wcześniej w nazwie, tym lepiej
    if (idx === 0) wynik += 40; // nazwa zaczyna się od tego słowa
    if (nazwaTok.some((pt) => pt === qt)) wynik += 20; // dokładne słowo, nie odmiana
  }
  const zapytanieZestaw = q.some((qt) => SLOWA_ZESTAW.has(qt));
  const produktZestaw = nazwaTok.some((pt) => SLOWA_ZESTAW.has(pt));
  if (produktZestaw && !zapytanieZestaw) wynik -= 60; // komplet, a szukamy pojedynczej rzeczy
  return wynik;
}

/** Czy produkt pasuje do frazy — wszystkie słowa muszą trafić (AND). */
export function pasujeFraza(p: Produkt, fraza: string): boolean {
  const zapytanie = tokeny(fraza).filter((t) => !STOP.has(t));
  if (zapytanie.length === 0) return true;
  const zrodlo = tokeny(
    [
      p.nazwa,
      p.kategoria,
      SYNONIMY[p.kategoria],
      p.wiekLabel,
      p.badge ?? "",
      p.opis ?? "",
      (p.rozmiary ?? []).join(" "),
    ].join(" "),
  );
  return zapytanie.every((qt) => zrodlo.some((pt) => tokenPasuje(pt, qt)));
}


export type FiltrKategoria = Kategoria | "wszystkie";
export type FiltrWiek = Wiek | "wszystkie";
export type Sortowanie = "domyslnie" | "cena-rosnaco" | "cena-malejaco";
export type FiltrWyroznienie = "wszystkie" | "NOWOŚĆ" | "BESTSELLER" | "promocja";

export interface ZakresCeny {
  label: string;
  min: number;
  max: number;
}

export const ZAKRESY_CENY: ZakresCeny[] = [
  { label: "do 20 zł", min: 0, max: 20 },
  { label: "20–40 zł", min: 20, max: 40 },
  { label: "40–60 zł", min: 40, max: 60 },
  { label: "powyżej 60 zł", min: 60, max: Infinity },
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
  const lista = produkty.filter((p) => {
    if (fraza && fraza.trim() && !pasujeFraza(p, fraza)) return false;
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
