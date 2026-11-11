import type { Produkt } from "@/data/produkty";
import { sbService } from "@/lib/supabase";
import { tydzienRoku } from "@/lib/newsletterDobor";
import { porownajRozmiary } from "@/lib/rozmiary";

// „Hit tygodnia" na stronie głównej:
// 0) produkt wybrany ręcznie (data/hitTygodnia.ts) — pierwszy z listy, który jest na stanie,
// 1) najchętniej kupowany produkt dziecięcy z ostatnich dni (prawdziwe, opłacone zamówienia),
// 2) gdy brak sprzedaży — co tydzień inna nowość dziecięca z porządną galerią.

export const DNI_SPRZEDAZY = 14;

export interface Hit {
  produkt: Produkt;
  zrodlo: "sprzedaz" | "wybor" | "polecany";
  rozmiary: string[]; // rozmiary na stanie
}

/** Rozmiary, których są sztuki (w kolejności rozmiarów). */
export function rozmiaryNaStanie(p: Produkt): string[] {
  const sr = p.stanRozmiary;
  const lista = p.rozmiary ?? [];
  if (!sr) return (p.stan ?? 1) > 0 ? [...lista] : [];
  return lista.filter((r) => (Number(sr[r]) || 0) > 0).sort(porownajRozmiary);
}

const kandydat = (p: Produkt) => p.kategoria !== "dorosli" && !p.ukryty && !!p.zdjecie && (p.stan ?? 1) > 0;

export function wybierzHit(
  katalog: Produkt[],
  sprzedaz: Map<string, number>,
  teraz: Date = new Date(),
  preferuj?: (p: Produkt) => boolean, // np. ciepłe zimą — gdy brak sprzedaży, wybór z nich
  wybrane: readonly string[] = [], // ręczny wybór (data/hitTygodnia.ts) — ma pierwszeństwo, dopóki jest na stanie
): Hit | undefined {
  const dostepne = katalog.filter((p) => kandydat(p) && rozmiaryNaStanie(p).length > 0);
  if (!dostepne.length) return undefined;

  for (const id of wybrane) {
    const p = dostepne.find((x) => x.id === id);
    if (p) return { produkt: p, zrodlo: "polecany", rozmiary: rozmiaryNaStanie(p) };
  }

  // Pozycja w katalogu = kolejność dodania (od najstarszego) — remis wygrywa nowszy.
  const kolejnosc = new Map(katalog.map((p, i) => [p.id, i]));
  const sprzedawane = dostepne
    .filter((p) => (sprzedaz.get(p.id) ?? 0) > 0)
    .sort((a, b) => (sprzedaz.get(b.id)! - sprzedaz.get(a.id)!) || kolejnosc.get(b.id)! - kolejnosc.get(a.id)!);
  if (sprzedawane.length) return { produkt: sprzedawane[0], zrodlo: "sprzedaz", rozmiary: rozmiaryNaStanie(sprzedawane[0]) };

  // Bez sprzedaży: 12 najnowszych z co najmniej dwoma zdjęciami, co tydzień kolejny.
  const preferowane = preferuj ? dostepne.filter(preferuj) : [];
  const baza = preferowane.length >= 3 ? preferowane : dostepne;
  const zGaleria = baza.filter((p) => (p.zdjecia?.length ?? 0) >= 2);
  const pula = (zGaleria.length ? zGaleria : baza).slice(-12).reverse();
  const p = pula[(teraz.getUTCFullYear() * 53 + tydzienRoku(teraz)) % pula.length];
  return { produkt: p, zrodlo: "wybor", rozmiary: rozmiaryNaStanie(p) };
}

/** Sztuki sprzedane w ostatnich dniach (opłacone/wysłane, bez zamówień testowych). */
export async function sprzedazOstatnio(dni = DNI_SPRZEDAZY): Promise<Map<string, number>> {
  const wynik = new Map<string, number>();
  const sb = sbService();
  if (!sb) return wynik;
  try {
    const od = new Date(Date.now() - dni * 86400000).toISOString();
    const { data } = await sb.from("zamowienia").select("pozycje, klient").in("status", ["oplacone", "wyslane"]).gte("created_at", od);
    for (const z of (data ?? []) as { pozycje: unknown; klient: { test?: boolean } | null }[]) {
      if (z.klient?.test || !Array.isArray(z.pozycje)) continue;
      for (const poz of z.pozycje as { id?: string; ilosc?: number }[]) {
        if (!poz?.id) continue;
        wynik.set(poz.id, (wynik.get(poz.id) ?? 0) + (Number(poz.ilosc) || 1));
      }
    }
  } catch {
    /* strona główna działa także bez danych o sprzedaży */
  }
  return wynik;
}

/** „56–74" albo „62, 74, 86" — krótko, do banera. */
export function rozmiaryTekst(r: string[]): string {
  if (!r.length) return "";
  if (r.length <= 3) return r.join(", ");
  // Zakres tylko dla rozmiarów-liczb (56, 62…); „30-34 cm" itp. wypisujemy.
  if (r.every((x) => /^\d+$/.test(x))) return `${r[0]}–${r[r.length - 1]}`;
  return `${r.slice(0, 3).join(", ")} i więcej`;
}
