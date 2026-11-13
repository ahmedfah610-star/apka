import type { Produkt } from "@/data/produkty";
import { ZDJECIA_REKLAMOWE } from "@/data/zdjeciaReklamowe";

// Etykiety do kampanii Google Ads (custom_label_1..3 w pliku produktowym). Dzięki nim kampanię
// ustawia się RAZ i steruje nią wyłączaniem grup produktów, bez tworzenia nowych kampanii:
//  - cena:  kliknięcie kosztuje tyle samo przy body za 10 zł i komplecie za 55 zł — reklamujemy droższe
//           (cena-40plus / cena-20-40 / cena-ponizej-20),
//  - stan:  pojedyncza sztuka wyprzedaje się po jednej sprzedaży — reklama dalej płaci za kliknięcia,
//  - dział: dziecięce i męskie to inni kupujący i inne stawki.
export const PROG_CENY_REKLAMY = 40;
export const PROG_TANICH = 20; // poniżej — najtańsze (do wykluczenia z kampanii)
export const PROG_STANU_REKLAMY = 3;

/** Sztuki na stanie łącznie (wszystkie rozmiary). */
export function sztukNaStanie(p: Pick<Produkt, "stan" | "stanRozmiary">): number {
  if (p.stanRozmiary) return Object.values(p.stanRozmiary).reduce((s, n) => s + (Number(n) || 0), 0);
  return Number(p.stan ?? 0) || 0;
}

export function etykietyReklamowe(p: Pick<Produkt, "cena" | "kategoria" | "stan" | "stanRozmiary">): { cena: string; stan: string; dzial: string } {
  return {
    cena: p.cena >= PROG_CENY_REKLAMY ? "cena-40plus" : p.cena >= PROG_TANICH ? "cena-20-40" : "cena-ponizej-20",
    stan: sztukNaStanie(p) >= PROG_STANU_REKLAMY ? "stan-3plus" : "stan-1-2",
    dzial: p.kategoria === "dorosli" ? "meskie" : "dzieciece",
  };
}

/** Zdjęcia do pliku produktowego: wybrane ujęcie reklamowe jako pierwsze (jeśli nadal jest w galerii). */
export function zdjeciaDoReklamy(p: Pick<Produkt, "id" | "zdjecie" | "zdjecia">, wybrane: Record<string, string> = ZDJECIA_REKLAMOWE): { zdjecia: string[]; top: boolean } {
  const galeria = (p.zdjecia?.length ? p.zdjecia : p.zdjecie ? [p.zdjecie] : []).filter(Boolean) as string[];
  const najlepsze = wybrane[p.id];
  if (!najlepsze) return { zdjecia: galeria, top: false };
  // Zdjęcie zniknęło z galerii (np. po ponownym imporcie) — zostaje zdjęcie główne, bez etykiety „top".
  if (!galeria.includes(najlepsze)) return { zdjecia: galeria, top: false };
  return { zdjecia: [najlepsze, ...galeria.filter((u) => u !== najlepsze)], top: true };
}

/**
 * Tytuł do pliku dla Google (sklep zostaje bez zmian). Cienkie swetry męskie, które w nazwie z Allegro
 * nie mają słowa „cienki” (a w opisie tak), dostają je w tytule — klienci szukają np. „cienki sweter
 * męski rozpinany” i to hasło już sprzedawało. Ciepłych modeli (ocieplane, polar, futerko) nie ruszamy.
 */
export function tytulDoFeedu(p: Pick<Produkt, "nazwa" | "opis" | "kategoria">): string {
  const n = p.nazwa;
  const cienkiWOpisie = /cienk/i.test((p.opis ?? "").slice(0, 400));
  if (p.kategoria !== "dorosli" || !/sweter/i.test(n) || /cienk/i.test(n) || !cienkiWOpisie || /ociepl|podszyt|polar|futer/i.test(n)) return n;
  const m = n.match(/^(sweter męski|męski sweter)\s+/i);
  return m ? `${m[0]}cienki ${n.slice(m[0].length)}` : `Cienki ${n.charAt(0).toLowerCase()}${n.slice(1)}`;
}
