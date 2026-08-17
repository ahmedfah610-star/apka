import { czyAdmin } from "@/lib/adminAuth";
import { sbService, supabaseWlaczony } from "@/lib/supabase";
import { listaKodow } from "@/lib/kodyDb";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!czyAdmin()) return Response.json({ items: [] }, { status: 401 });
  return Response.json({ items: await listaKodow() });
}

// Utworzenie / nadpisanie kodu.
export async function POST(req: Request) {
  if (!czyAdmin()) return Response.json({ ok: false }, { status: 401 });
  if (!supabaseWlaczony()) return Response.json({ ok: false, powod: "brak_bazy" }, { status: 501 });
  const sb = sbService();
  if (!sb) return Response.json({ ok: false, powod: "brak_bazy" }, { status: 501 });

  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const kod = String(b.kod ?? "").trim().toUpperCase().slice(0, 40);
  const typ = b.typ === "kwota" ? "kwota" : "procent";
  const wartosc = Number(b.wartosc);
  if (!kod) return Response.json({ ok: false, blad: "Podaj kod." }, { status: 400 });
  if (!Number.isFinite(wartosc) || wartosc <= 0) return Response.json({ ok: false, blad: "Podaj wartość rabatu." }, { status: 400 });
  if (typ === "procent" && wartosc > 100) return Response.json({ ok: false, blad: "Procent nie może przekraczać 100." }, { status: 400 });

  const wiersz = {
    kod,
    typ,
    wartosc,
    min_koszyk: Math.max(0, Number(b.minKoszyk) || 0),
    aktywny: b.aktywny === undefined ? true : !!b.aktywny,
    wazny_do: b.waznyDo ? new Date(String(b.waznyDo)).toISOString() : null,
    limit_uzyc: b.limitUzyc === null || b.limitUzyc === undefined || b.limitUzyc === "" ? null : Math.max(1, parseInt(String(b.limitUzyc), 10) || 1),
  };
  const { error } = await sb.from("kody_rabatowe").upsert(wiersz, { onConflict: "kod" });
  if (error) return Response.json({ ok: false, blad: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

// Włącz/wyłącz kod.
export async function PATCH(req: Request) {
  if (!czyAdmin()) return Response.json({ ok: false }, { status: 401 });
  const sb = sbService();
  if (!sb) return Response.json({ ok: false, powod: "brak_bazy" }, { status: 501 });
  const { kod, aktywny } = (await req.json()) as { kod: string; aktywny: boolean };
  if (!kod) return Response.json({ ok: false, blad: "Brak kodu" }, { status: 400 });
  const { error } = await sb.from("kody_rabatowe").update({ aktywny: !!aktywny }).eq("kod", kod.toUpperCase());
  if (error) return Response.json({ ok: false, blad: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!czyAdmin()) return Response.json({ ok: false }, { status: 401 });
  const sb = sbService();
  if (!sb) return Response.json({ ok: false, powod: "brak_bazy" }, { status: 501 });
  const { kod } = (await req.json()) as { kod: string };
  if (!kod) return Response.json({ ok: false, blad: "Brak kodu" }, { status: 400 });
  const { error } = await sb.from("kody_rabatowe").delete().eq("kod", kod.toUpperCase());
  if (error) return Response.json({ ok: false, blad: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
