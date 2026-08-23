import type { Produkt } from "@/data/produkty";

// Warianty kolorystyczne. Ten sam model bywa w sklepie jako wiele osobnych
// produktów różniących się tylko kolorem (bo na Allegro każdy kolor to osobna
// oferta). Tutaj spinamy je „rodziną" (nazwa bez rozmiaru + cena + kategoria),
// żeby na liście pokazać JEDEN kafel, a na stronie produktu — próbnik koloru.
// Nie zmieniamy danych — grupujemy w locie.

/** Nazwa bez rozmiarów/liczb — do rozpoznania tego samego modelu. */
export function bazaNazwy(n: string): string {
  return (n || "")
    .replace(/\d+\s*[-–]\s*\d+/g, " ")
    .replace(/\brozm\.?\b/gi, " ")
    .replace(/\d+/g, " ")
    .replace(/[+/,–-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Klucz rodziny wariantów kolorystycznych. */
export function kluczWariantu(p: Produkt): string {
  return `${bazaNazwy(p.nazwa)}|${p.cena}|${p.kategoria}`;
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

/**
 * Zwija listę do reprezentantów rodzin (jeden produkt na model), zachowując
 * kolejność wejścia. Zwraca też liczbę kolorów w każdej rodzinie.
 */
export function zwinWarianty(produkty: Produkt[]): { produkt: Produkt; kolory: number }[] {
  const grupy = new Map<string, Produkt[]>();
  for (const p of produkty) {
    const k = kluczWariantu(p);
    const arr = grupy.get(k);
    if (arr) arr.push(p);
    else grupy.set(k, [p]);
  }
  const uzyte = new Set<string>();
  const wynik: { produkt: Produkt; kolory: number }[] = [];
  for (const p of produkty) {
    const k = kluczWariantu(p);
    if (uzyte.has(k)) continue;
    uzyte.add(k);
    const grupa = grupy.get(k)!;
    const repr = [...grupa].sort(lepszy)[0];
    const kolory = new Set(grupa.map((x) => (x.kolor || "").toLowerCase())).size;
    wynik.push({ produkt: repr, kolory });
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
  // Bieżący produkt zawsze reprezentuje swój kolor (nawet jeśli inny wariant ma więcej sztuk).
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
