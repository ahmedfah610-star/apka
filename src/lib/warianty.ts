import type { Produkt } from "@/data/produkty";

// Warianty kolorystyczne. Ten sam model bywa w sklepie jako wiele osobnych
// produktów różniących się tylko kolorem (na Allegro każdy kolor = osobna oferta).
//
// Łączymy ŚCIŚLE (opis + nazwa bez koloru + cena, bez powtórzonych kolorów) — lepiej
// pokazać dwa kafelki niż zlepić różne modele w jeden „z kolorami". Nie zmieniamy
// danych — grupujemy w locie.

function normOpis(s: string | null | undefined): string {
  return (s || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/[^a-ząćęłńóśźż0-9 ]/g, "");
}

// Typ ubranka z nazwy — zabezpieczenie, żeby ten sam początek opisu nie zlepił
// różnych rzeczy (np. spodnie z bluzą). Kolejność ma znaczenie (dłuższe/pewniejsze wcześniej).
const TYPY = [
  "półśpioch", "polspioch", "śpioch", "spioch", "skarpet", "bucik", "pajac", "wyprawk", "komplet",
  "legins", "leggin", "getr", "rybaczk", "kolark", "spodnie", "bluzka", "bluza", "tshirt", "t shirt",
  "koszul", "sukien", "tunik", "czapk", "opaska", "kurtk", "kamizel", "sweter", "kaftanik", "body",
  "ramper", "kombinezon", "rękawic", "półbucik",
];
function typUbranka(nazwa: string): string {
  const n = (nazwa || "").toLowerCase();
  for (const t of TYPY) if (n.includes(t)) return t;
  return "";
}

// Słowa kolorów usuwane z nazwy — „Legginsy prążkowane czarne" i „… zielone" to ten sam model.
const KOLORY_W_NAZWIE =
  /(?<!\p{L})(?:czarn|biał|szar|granat|niebiesk|błękit|czerwon|różow|zielon|żółt|beżow|brązow|fiolet|miętow|pudrow|bordow|kremow|grafitow|oliwkow|melanż|wielokolorow|pomarańcz|turkus|liliow|łososiow|koralow|musztardow|butelkow|jasno|ciemno)\p{L}*|(?<!\p{L})(?:róż|beż|bordo|ecru|khaki|mięta|kolorowy|kolorowa|kolorowe)(?!\p{L})/giu;

function rdzenNazwy(nazwa: string): string {
  return (nazwa || "")
    .toLowerCase()
    .replace(KOLORY_W_NAZWIE, " ")
    .replace(/[^\p{L}\p{N} ]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * ŚCISŁY klucz rodziny wariantów koloru: początek opisu (90 zn.) + kategoria + typ
 * ubranka + cena + NAZWA BEZ SŁÓW KOLORU. Sam opis nie wystarczał — sprzedawca używa
 * jednego opisu dla różnych nadruków (np. body „Babcia tu była" i „Tata wie dużo"
 * wyglądały jak jeden produkt w 3 kolorach). Zbyt krótki opis → produkt osobno.
 */
function kluczScisly(p: Produkt): string {
  const o = normOpis(p.opis);
  if (o.length < 40) return `id:${p.id}`;
  return `${o.slice(0, 90)}|${p.kategoria}|${typUbranka(p.nazwa)}|${p.cena}|${rdzenNazwy(p.nazwa)}`;
}

/** Klucz rodziny: przypisany dla całego katalogu (przypiszRodziny), a bez niego — ścisły klucz. */
export function kluczWariantu(p: Produkt): string {
  return p.rodzina ?? kluczScisly(p);
}

/**
 * Rodziny kolorów dla CAŁEGO katalogu (na serwerze, raz): grupa zostaje rodziną tylko,
 * gdy każdy produkt ma kolor i żaden kolor się nie powtarza. Powtórzony kolor znaczy,
 * że to różne modele — wtedy każdy produkt jest osobno. Dzięki temu lista, wyszukiwarka
 * i strona produktu łączą zawsze tak samo, niezależnie od filtrów.
 */
export function przypiszRodziny(lista: Produkt[]): Produkt[] {
  const grupy = new Map<string, Produkt[]>();
  for (const p of lista) {
    const k = kluczScisly(p);
    grupy.set(k, [...(grupy.get(k) ?? []), p]);
  }
  const rodzina = new Map<string, string>();
  for (const [k, grupa] of grupy) {
    const kolory = grupa.map((p) => (p.kolor || "").trim().toLowerCase());
    const ok = grupa.length > 1 && kolory.every(Boolean) && new Set(kolory).size === kolory.length;
    for (const p of grupa) rodzina.set(p.id, ok ? k : `id:${p.id}`);
  }
  return lista.map((p) => ({ ...p, rodzina: rodzina.get(p.id) }));
}

function stanProduktu(p: Produkt): number {
  if (p.stanRozmiary && Object.keys(p.stanRozmiary).length) {
    return Object.values(p.stanRozmiary).reduce((s, v) => s + (Number(v) || 0), 0);
  }
  return typeof p.stan === "number" ? p.stan : 1;
}

// Lepszy reprezentant rodziny: najpierw dostępny, potem więcej sztuk, więcej zdjęć.
function lepszy(a: Produkt, b: Produkt): number {
  const sa = stanProduktu(a);
  const sb = stanProduktu(b);
  if ((sa > 0) !== (sb > 0)) return sa > 0 ? -1 : 1;
  if (sa !== sb) return sb - sa;
  return (b.zdjecia?.length ?? 0) - (a.zdjecia?.length ?? 0);
}

export interface WariantKoloru {
  id: string;
  kolor: string | null;
  zdjecie: string | null;
  dostepny: boolean;
  aktywny: boolean;
}

export interface Zwiniety {
  produkt: Produkt;
  kolory: number;
  cenaMin: number;
  cenyRozne: boolean;
}

/**
 * Zwija listę do reprezentantów rodzin (jeden produkt na model), zachowując
 * kolejność wejścia. Zwraca liczbę kolorów i zakres ceny (gdy warianty różnią się ceną).
 */
export function zwinWarianty(produkty: Produkt[]): Zwiniety[] {
  const grupy = new Map<string, Produkt[]>();
  for (const p of produkty) {
    const k = kluczWariantu(p);
    const arr = grupy.get(k);
    if (arr) arr.push(p);
    else grupy.set(k, [p]);
  }
  const uzyte = new Set<string>();
  const wynik: Zwiniety[] = [];
  for (const p of produkty) {
    const k = kluczWariantu(p);
    if (uzyte.has(k)) continue;
    uzyte.add(k);
    const grupa = grupy.get(k)!;
    const repr = [...grupa].sort(lepszy)[0];
    const kolory = new Set(grupa.map((x) => (x.kolor || "").toLowerCase())).size;
    const ceny = grupa.map((x) => x.cena);
    wynik.push({ produkt: repr, kolory, cenaMin: Math.min(...ceny), cenyRozne: new Set(ceny).size > 1 });
  }
  return wynik;
}

/**
 * Warianty koloru dla danego produktu (z pełnego katalogu). Dedupe po kolorze
 * (przy rozdrobnieniu bierze wariant z większym stanem), dostępne na początku.
 */
export function wariantyKoloru(wszystkie: Produkt[], biezacy: Produkt): WariantKoloru[] {
  const klucz = kluczWariantu(biezacy);
  const rodzina = wszystkie.filter((p) => kluczWariantu(p) === klucz);
  if (rodzina.length <= 1) return [];

  // Dedupe po nazwie koloru — zostaw najlepszy wariant danego koloru.
  const poKolorze = new Map<string, Produkt>();
  for (const p of rodzina) {
    const k = (p.kolor || "—").toLowerCase();
    const dotych = poKolorze.get(k);
    if (!dotych || lepszy(p, dotych) < 0) poKolorze.set(k, p);
  }
  // Bieżący produkt zawsze reprezentuje swój kolor.
  poKolorze.set((biezacy.kolor || "—").toLowerCase(), biezacy);

  const lista = [...poKolorze.values()];
  if (lista.length <= 1) return [];
  return lista
    .map((p) => ({
      id: p.id,
      kolor: p.kolor ?? null,
      zdjecie: p.zdjecie ?? p.zdjecia?.[0] ?? null,
      dostepny: stanProduktu(p) > 0,
      aktywny: p.id === biezacy.id,
    }))
    .sort((a, b) => (a.dostepny === b.dostepny ? 0 : a.dostepny ? -1 : 1));
}
