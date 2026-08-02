import { czyAdmin } from "@/lib/adminAuth";
import { sbService, supabaseWlaczony } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Lista zamówień — panel (statystyki + obsługa). Składanie zamówień: /api/platnosc/checkout.
export async function GET() {
  if (!czyAdmin()) return Response.json({ items: [] }, { status: 401 });
  if (!supabaseWlaczony()) return Response.json({ items: [] });
  const sb = sbService();
  if (!sb) return Response.json({ items: [] });
  const { data, error } = await sb.from("zamowienia").select("*").order("created_at", { ascending: false }).limit(300);
  if (error) return Response.json({ items: [] });
  const items = (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id,
    data: r.created_at,
    pozycje: r.pozycje,
    suma: Number(r.suma),
    dostawa: Number(r.dostawa),
    razem: Number(r.razem),
    metoda: r.metoda,
    klient: r.klient ?? {},
    status: r.status ?? "nowe",
  }));
  return Response.json({ items });
}

const DOZWOLONE = ["nowe", "oczekuje_na_platnosc", "oplacone", "wyslane", "anulowane"];

// Zmiana statusu zamówienia.
export async function PATCH(req: Request) {
  if (!czyAdmin()) return Response.json({ ok: false }, { status: 401 });
  const sb = sbService();
  if (!sb) return Response.json({ ok: false, powod: "brak_bazy" }, { status: 501 });
  const { id, status } = (await req.json()) as { id: string; status: string };
  if (!DOZWOLONE.includes(status)) return Response.json({ ok: false, blad: "Zły status" }, { status: 400 });
  const { error } = await sb.from("zamowienia").update({ status }).eq("id", id);
  if (error) return Response.json({ ok: false, blad: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
