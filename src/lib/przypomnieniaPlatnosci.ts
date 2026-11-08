import type { SupabaseClient } from "@supabase/supabase-js";
import { wyslijPrzypomnieniePlatnosci, mailWlaczony, type DanePrzypomnienia } from "@/lib/mail";
import { produktyPoIdSwieze } from "@/lib/produktyDb";

// Automatyczne przypomnienie o niedokończonej płatności (z codziennych cronów, 2× dziennie):
// zamówienie „oczekuje na płatność" sprzed co najmniej 1 h i najwyżej 3 dni, z e-mailem,
// bez wysłanego wcześniej przypomnienia (ręcznego też), nie TEST. Pomijamy, gdy:
// klient w międzyczasie złożył i opłacił inne zamówienie, albo towar się wyprzedał
// (link do płatności i tak by nie zadziałał). Jedno przypomnienie na zamówienie.

const GODZINA = 3600000;
export const PRZYPOMNIENIE_PO_H = 1;
export const PRZYPOMNIENIE_DO_DNI = 3;
const KUPIONE = ["oplacone", "wyslane", "nowe"];

/* eslint-disable @typescript-eslint/no-explicit-any */
export function danePrzypomnienia(z: any): DanePrzypomnienia {
  return {
    id: String(z.id),
    data: String(z.created_at),
    pozycje: (z.pozycje as never[]) ?? [],
    razem: Number(z.razem),
    dostawa: Number(z.dostawa),
    rabat: Number(z.rabat ?? 0),
    kod: (z.kod_rabatowy as string | null) ?? null,
    metoda: String(z.metoda ?? ""),
    klient: (z.klient ?? {}) as DanePrzypomnienia["klient"],
  };
}

/** Czy towar z zamówienia jest nadal dostępny w zamówionej ilości. */
function dostepne(z: any, katalog: Map<string, any>): boolean {
  for (const poz of (z.pozycje as any[]) ?? []) {
    const prod = katalog.get(String(poz?.id));
    const rozm = poz?.rozmiar ? String(poz.rozmiar) : null;
    const ile = !prod ? 0 : rozm && prod.stanRozmiary ? prod.stanRozmiary[rozm] ?? 0 : prod.stan;
    if (typeof ile === "number" && ile < Number(poz?.ilosc || 1)) return false;
  }
  return true;
}

export async function automatycznePrzypomnienia(
  sb: SupabaseClient,
  teraz = Date.now(),
): Promise<{ ok: boolean; wyslano?: number; pominieto?: number; blad?: string }> {
  if (!mailWlaczony()) return { ok: false, blad: "brak_maili" };
  try {
    const { data, error } = await sb
      .from("zamowienia")
      .select("id, created_at, status, pozycje, razem, dostawa, rabat, kod_rabatowy, metoda, klient")
      .eq("status", "oczekuje_na_platnosc")
      .gte("created_at", new Date(teraz - PRZYPOMNIENIE_DO_DNI * 24 * GODZINA).toISOString())
      .lte("created_at", new Date(teraz - PRZYPOMNIENIE_PO_H * GODZINA).toISOString())
      .limit(50);
    if (error) return { ok: false, blad: error.message };
    const kandydaci = ((data ?? []) as any[]).filter((z) => z.klient?.email && !z.klient?.przypomnienie && !z.klient?.test);
    if (!kandydaci.length) return { ok: true, wyslano: 0, pominieto: 0 };

    const ids = [...new Set(kandydaci.flatMap((z) => ((z.pozycje as any[]) ?? []).map((p) => String(p?.id ?? ""))))];
    const katalog = new Map((await produktyPoIdSwieze(ids)).map((p) => [p.id, p]));

    let wyslano = 0;
    let pominieto = 0;
    for (const z of kandydaci) {
      const email = String(z.klient.email).trim();
      // Klient złożył potem inne zamówienie i je opłacił — nie przypominamy o starym.
      const { data: pozniejsze } = await sb
        .from("zamowienia")
        .select("id")
        .in("status", KUPIONE)
        .ilike("klient->>email", email.replace(/[\\%_]/g, (m) => `\\${m}`))
        .gte("created_at", z.created_at)
        .limit(1);
      if ((pozniejsze?.length ?? 0) > 0 || !dostepne(z, katalog)) {
        pominieto++;
        continue;
      }
      const mail = await wyslijPrzypomnieniePlatnosci(danePrzypomnienia(z));
      if (!mail.ok) continue;
      await sb
        .from("zamowienia")
        .update({ klient: { ...z.klient, przypomnienie: new Date().toISOString(), przypomnienieAuto: true } })
        .eq("id", z.id);
      wyslano++;
    }
    return { ok: true, wyslano, pominieto };
  } catch (e) {
    return { ok: false, blad: e instanceof Error ? e.message : String(e) };
  }
}
