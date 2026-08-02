import { czyAdmin } from "@/lib/adminAuth";
import { sbService, supabaseWlaczony } from "@/lib/supabase";

export const dynamic = "force-dynamic";

interface NoweZamowienie {
  pozycje: { id: string; nazwa: string; cena: number; ilosc: number; rozmiar?: string }[];
  suma: number;
  dostawa: number;
  razem: number;
  metoda: string;
  klient?: Record<string, unknown>;
}

// Złożenie zamówienia — zapis + atomowe zmniejszenie stanów (RPC).
export async function POST(req: Request) {
  const z = (await req.json()) as NoweZamowienie;
  if (!supabaseWlaczony()) return Response.json({ ok: true, demo: true });
  const sb = sbService();
  if (!sb) return Response.json({ ok: true, demo: true });

  const { data, error } = await sb.rpc("zloz_zamowienie", {
    p_pozycje: z.pozycje,
    p_suma: z.suma,
    p_dostawa: z.dostawa,
    p_razem: z.razem,
    p_metoda: z.metoda,
    p_klient: z.klient ?? {},
  });
  if (error) return Response.json({ ok: false, blad: error.message }, { status: 500 });
  return Response.json({ ok: true, id: data });
}

// Lista zamówień — panel (statystyki).
export async function GET() {
  if (!czyAdmin()) return Response.json({ items: [] }, { status: 401 });
  if (!supabaseWlaczony()) return Response.json({ items: [] });
  const sb = sbService();
  if (!sb) return Response.json({ items: [] });
  const { data, error } = await sb.from("zamowienia").select("*").order("created_at", { ascending: false }).limit(200);
  if (error) return Response.json({ items: [] });
  const items = (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id,
    data: r.created_at,
    pozycje: r.pozycje,
    suma: Number(r.suma),
    dostawa: Number(r.dostawa),
    razem: Number(r.razem),
    metoda: r.metoda,
  }));
  return Response.json({ items });
}
