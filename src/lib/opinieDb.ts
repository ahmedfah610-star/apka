import { sbAnon, sbService, supabaseWlaczony } from "@/lib/supabase";

// Warstwa danych opinii o produktach. Opinie mogą wystawić tylko klienci,
// którzy kupili dany produkt (weryfikacja po e-mailu z zamówienia).

export interface Opinia {
  id: string;
  produktId: string;
  imie: string;
  ocena: number;
  tresc: string | null;
  utworzono: string;
}

export interface AgregatOpinii {
  srednia: number;
  liczba: number;
}

// Statusy zamówień oznaczające faktyczny zakup (pomijamy nieopłacone i anulowane).
const STATUSY_ZAKUPU = ["nowe", "oplacone", "wyslane"];

/* eslint-disable @typescript-eslint/no-explicit-any */
function zRzedu(r: any): Opinia {
  return {
    id: r.id,
    produktId: r.produkt_id,
    imie: r.imie,
    ocena: Number(r.ocena),
    tresc: r.tresc ?? null,
    utworzono: r.utworzono,
  };
}

// Odczyt bez pola e-mail (nie udostępniamy danych klienta publicznie).
const KOLUMNY = "id, produkt_id, imie, ocena, tresc, utworzono";

export async function pobierzOpinie(produktId: string, limit = 50): Promise<Opinia[]> {
  if (!supabaseWlaczony()) return [];
  const sb = sbService() ?? sbAnon();
  if (!sb) return [];
  const { data, error } = await sb
    .from("opinie")
    .select(KOLUMNY)
    .eq("produkt_id", produktId)
    .eq("zatwierdzona", true)
    .order("utworzono", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map(zRzedu);
}

export function agregat(op: Opinia[]): AgregatOpinii {
  if (op.length === 0) return { srednia: 0, liczba: 0 };
  const suma = op.reduce((s, o) => s + o.ocena, 0);
  return { srednia: Math.round((suma / op.length) * 10) / 10, liczba: op.length };
}

/** Czy dany e-mail ma zamówienie (opłacone/zrealizowane) zawierające ten produkt. */
export async function czyKupil(email: string, produktId: string): Promise<boolean> {
  const sb = sbService();
  if (!sb) return false;
  const { data, error } = await sb
    .from("zamowienia")
    .select("pozycje, status")
    .ilike("klient->>email", email)
    .in("status", STATUSY_ZAKUPU)
    .limit(200);
  if (error || !data) return false;
  return data.some(
    (z: any) => Array.isArray(z.pozycje) && z.pozycje.some((it: any) => it?.id === produktId),
  );
}

export type WynikDodania = { ok: boolean; blad?: string; kod?: "duplikat" };

export async function dodajOpinie(o: {
  produktId: string;
  imie: string;
  email: string;
  ocena: number;
  tresc?: string | null;
}): Promise<WynikDodania> {
  if (!supabaseWlaczony()) return { ok: false, blad: "Opinie są chwilowo niedostępne." };
  const sb = sbService();
  if (!sb) return { ok: false, blad: "Brak konfiguracji." };
  const { error } = await sb.from("opinie").insert({
    produkt_id: o.produktId,
    imie: o.imie,
    email: o.email.toLowerCase(),
    ocena: o.ocena,
    tresc: o.tresc ?? null,
  });
  if (error) {
    // 23505 = naruszenie unikalności (jedna opinia na produkt na klienta).
    if ((error as any).code === "23505") return { ok: false, blad: "Masz już opinię o tym produkcie.", kod: "duplikat" };
    return { ok: false, blad: error.message };
  }
  return { ok: true };
}
