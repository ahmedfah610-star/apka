import { czyAdmin, odmowa } from "@/lib/adminAuth";
import { sbService } from "@/lib/supabase";
import { sprawdzFakture } from "@/lib/faktura";
import { zamowienieDoDokumentow } from "@/lib/dokumentyMagazyn";

export const dynamic = "force-dynamic";

// Panel: dopisanie / poprawa / usunięcie danych do faktury w zamówieniu (np. klient poprosił
// o fakturę po zakupie). Te same reguły co w formularzu zamówienia.
export async function PATCH(req: Request) {
  if (!czyAdmin()) return odmowa();
  const sb = sbService();
  if (!sb) return Response.json({ ok: false, blad: "Brak bazy." }, { status: 501 });
  const b = (await req.json().catch(() => ({}))) as { zamowienie?: unknown; faktura?: unknown };
  const z = await zamowienieDoDokumentow(sb, String(b.zamowienie ?? ""));
  if (!z) return Response.json({ ok: false, blad: "Nie znaleziono zamówienia." }, { status: 404 });
  const w = sprawdzFakture(b.faktura ?? null);
  if (!w.ok) return Response.json({ ok: false, blad: w.blad }, { status: 400 });
  const { faktura: _stara, ...reszta } = z.klient;
  void _stara;
  const klient = w.faktura ? { ...reszta, faktura: w.faktura } : reszta;
  const { error } = await sb.from("zamowienia").update({ klient }).eq("id", z.id);
  if (error) return Response.json({ ok: false, blad: error.message }, { status: 500 });
  return Response.json({ ok: true, faktura: w.faktura });
}
