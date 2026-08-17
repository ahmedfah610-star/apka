import { czyAdmin } from "@/lib/adminAuth";
import { sbService, supabaseWlaczony } from "@/lib/supabase";
import { odswiezPoZmianieStanu } from "@/lib/rewalidacja";

export const dynamic = "force-dynamic";

// Lista wszystkich opinii (także niezatwierdzonych) — do moderacji.
export async function GET() {
  if (!czyAdmin()) return Response.json({ items: [] }, { status: 401 });
  if (!supabaseWlaczony()) return Response.json({ items: [] });
  const sb = sbService();
  if (!sb) return Response.json({ items: [] });
  const { data, error } = await sb
    .from("opinie")
    .select("id, produkt_id, imie, email, ocena, tresc, zatwierdzona, utworzono")
    .order("utworzono", { ascending: false })
    .limit(500);
  if (error) return Response.json({ items: [] });
  const items = (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id,
    produktId: r.produkt_id,
    imie: r.imie,
    email: r.email,
    ocena: Number(r.ocena),
    tresc: r.tresc ?? null,
    zatwierdzona: !!r.zatwierdzona,
    utworzono: r.utworzono,
  }));
  return Response.json({ items });
}

// Zatwierdzenie / ukrycie opinii.
export async function PATCH(req: Request) {
  if (!czyAdmin()) return Response.json({ ok: false }, { status: 401 });
  const sb = sbService();
  if (!sb) return Response.json({ ok: false, powod: "brak_bazy" }, { status: 501 });
  const { id, zatwierdzona } = (await req.json()) as { id: string; zatwierdzona: boolean };
  if (!id) return Response.json({ ok: false, blad: "Brak id" }, { status: 400 });
  const { error } = await sb.from("opinie").update({ zatwierdzona: !!zatwierdzona }).eq("id", id);
  if (error) return Response.json({ ok: false, blad: error.message }, { status: 500 });
  odswiezPoZmianieStanu();
  return Response.json({ ok: true });
}

// Usunięcie opinii.
export async function DELETE(req: Request) {
  if (!czyAdmin()) return Response.json({ ok: false }, { status: 401 });
  const sb = sbService();
  if (!sb) return Response.json({ ok: false, powod: "brak_bazy" }, { status: 501 });
  const { id } = (await req.json()) as { id: string };
  if (!id) return Response.json({ ok: false, blad: "Brak id" }, { status: 400 });
  const { error } = await sb.from("opinie").delete().eq("id", id);
  if (error) return Response.json({ ok: false, blad: error.message }, { status: 500 });
  odswiezPoZmianieStanu();
  return Response.json({ ok: true });
}
