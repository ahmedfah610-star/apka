// Anonimowy licznik wejść na kartę produktu i dodań do koszyka — bez cookies i danych osobowych
// (liczymy zdarzenia, nie osoby). Dzienne paczki w tabeli `ustawienia`: klucz „licznik:RRRR-MM-DD",
// wartość { [idProduktu]: [wejścia, dodania do koszyka] }. Zapis z kontrolą wersji (zaktualizowano),
// żeby dwa jednoczesne wejścia nie nadpisały sobie licznika.

import type { SupabaseClient } from "@supabase/supabase-js";

export type TypZdarzenia = "w" | "k"; // wejście | dodanie do koszyka
export type DzienLicznika = Record<string, [number, number]>;

export const PREFIKS = "licznik:";

/** Dzień w strefie czasowej sklepu (RRRR-MM-DD). */
export function dzien(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Warsaw" }).format(d);
}

export function dodaj(w: DzienLicznika, id: string, typ: TypZdarzenia): DzienLicznika {
  const [we, ko] = w[id] ?? [0, 0];
  return { ...w, [id]: typ === "w" ? [we + 1, ko] : [we, ko + 1] };
}

export async function zapiszZdarzenie(sb: SupabaseClient, id: string, typ: TypZdarzenia, teraz: Date = new Date()): Promise<boolean> {
  const klucz = PREFIKS + dzien(teraz);
  for (let proba = 0; proba < 4; proba++) {
    const { data } = await sb.from("ustawienia").select("wartosc, zaktualizowano").eq("klucz", klucz).maybeSingle();
    const znacznik = new Date(Date.now() + proba).toISOString();
    if (!data) {
      const { data: wstawione } = await sb
        .from("ustawienia")
        .upsert({ klucz, wartosc: dodaj({}, id, typ), zaktualizowano: znacznik }, { onConflict: "klucz", ignoreDuplicates: true })
        .select("klucz");
      if (wstawione && wstawione.length) return true;
      continue; // ktoś utworzył dzień w międzyczasie — spróbuj aktualizacji
    }
    const { data: zmienione } = await sb
      .from("ustawienia")
      .update({ wartosc: dodaj((data.wartosc as DzienLicznika) ?? {}, id, typ), zaktualizowano: znacznik })
      .eq("klucz", klucz)
      .eq("zaktualizowano", data.zaktualizowano)
      .select("klucz");
    if (zmienione && zmienione.length) return true;
  }
  return false;
}

export interface WierszLejka {
  id: string;
  wejscia: number;
  koszyk: number;
  kupione: number; // sztuki z opłaconych zamówień (bez braków i zwrotów)
  zamowien: number;
}

/** Zsumowanie dni licznika i sprzedaży w jeden lejek na produkt. */
export function agregujLejek(
  dni: DzienLicznika[],
  zamowienia: { pozycje: { id: string; ilosc: number }[]; korekty?: { pozycje: { indeks: number; ilosc: number }[] }[] }[],
): WierszLejka[] {
  const m = new Map<string, WierszLejka>();
  const wiersz = (id: string) => {
    let w = m.get(id);
    if (!w) m.set(id, (w = { id, wejscia: 0, koszyk: 0, kupione: 0, zamowien: 0 }));
    return w;
  };
  for (const d of dni) {
    for (const [id, [we, ko]] of Object.entries(d ?? {})) {
      const w = wiersz(id);
      w.wejscia += Number(we) || 0;
      w.koszyk += Number(ko) || 0;
    }
  }
  for (const z of zamowienia) {
    const odjete = new Map<number, number>();
    for (const k of z.korekty ?? []) for (const p of k.pozycje) odjete.set(p.indeks, (odjete.get(p.indeks) ?? 0) + p.ilosc);
    const wZamowieniu = new Set<string>();
    z.pozycje.forEach((p, i) => {
      const szt = (Number(p.ilosc) || 0) - (odjete.get(i) ?? 0);
      if (szt <= 0) return;
      wiersz(p.id).kupione += szt;
      wZamowieniu.add(p.id);
    });
    for (const id of wZamowieniu) wiersz(id).zamowien++;
  }
  return [...m.values()];
}
