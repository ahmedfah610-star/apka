import type { Produkt } from "@/data/produkty";

// Warianty kolorystyczne. Ten sam model bywa w sklepie jako wiele osobnych
// produktów różniących się tylko kolorem (na Allegro każdy kolor = osobna oferta).
//
// KLUCZ ŁĄCZENIA = OPIS. Sprzedawca kopiuje ten sam opis dla wszystkich kolorów
// jednego modelu, więc identyczny opis pewnie wskazuje ten sam wzór/fason
// (zweryfikowane na żywo: 0 grup mieszało różne typy ubranek — w odróżnieniu od
// grupowania po ogólnej nazwie, które zlepiało różne rzeczy). Nie zmieniamy
// danych — grupujemy w locie.

function normOpis(s: string | null | undefined): string {
  return (s || "").replace(/\s+/g, " ").trim().toLowerCase();
}

/**
 * Klucz rodziny wariantów. Identyczny (znormalizowany) opis = ten sam model.
 * Zbyt krótki/pusty opis → klucz unikalny (produkt nie łączy się z niczym).
 */
export function kluczWariantu(p: Produkt): string {
  const o = normOpis(p.opis);
  return o.length >= 20 ? `op:${o}` : `id:${p.id}`;
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
