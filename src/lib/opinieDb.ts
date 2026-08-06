import { sbAnon, sbService, supabaseWlaczony } from "@/lib/supabase";

// Warstwa danych opinii o produktach. Bez bazy — pusto (sklep działa dalej).

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

export async function pobierzOpinie(produktId: string, limit = 50): Promise<Opinia[]> {
  if (!supabaseWlaczony()) return [];
  const sb = sbAnon() ?? sbService();
  if (!sb) return [];
  const { data, error } = await sb
    .from("opinie")
    .select("*")
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

export async function dodajOpinie(o: {
  produktId: string;
  imie: string;
  ocena: number;
  tresc?: string | null;
}): Promise<{ ok: boolean; blad?: string }> {
  if (!supabaseWlaczony()) return { ok: false, blad: "Opinie są chwilowo niedostępne." };
  const sb = sbService();
  if (!sb) return { ok: false, blad: "Brak konfiguracji." };
  const { error } = await sb.from("opinie").insert({
    produkt_id: o.produktId,
    imie: o.imie,
    ocena: o.ocena,
    tresc: o.tresc ?? null,
  });
  if (error) return { ok: false, blad: error.message };
  return { ok: true };
}
