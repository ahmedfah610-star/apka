import { czyAdmin, odmowa } from "@/lib/adminAuth";
import { sbService } from "@/lib/supabase";
import { PREFIKS_MAILA } from "@/lib/mailLog";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */
// Dziennik maili: lista (bez treści) albo jeden mail z treścią HTML (?id=…).
export async function GET(req: Request) {
  if (!czyAdmin()) return odmowa();
  const sb = sbService();
  if (!sb) return Response.json({ ok: false, items: [] });
  const id = new URL(req.url).searchParams.get("id");

  if (id) {
    if (!id.startsWith(PREFIKS_MAILA)) return Response.json({ ok: false }, { status: 400 });
    const { data } = await sb.from("ustawienia").select("wartosc").eq("klucz", id).maybeSingle();
    if (!data) return Response.json({ ok: false }, { status: 404 });
    return Response.json({ ok: true, mail: data.wartosc }, { headers: { "Cache-Control": "no-store" } });
  }

  const { data, error } = await sb
    .from("ustawienia")
    .select("klucz, do:wartosc->>do, temat:wartosc->>temat, typ:wartosc->>typ, ok:wartosc->>ok, blad:wartosc->>blad, czas:wartosc->>czas")
    .like("klucz", `${PREFIKS_MAILA}%`)
    .order("klucz", { ascending: false })
    .limit(500);
  if (error) return Response.json({ ok: false, items: [], blad: error.message });
  const items = (data ?? []).map((r: any) => ({ id: r.klucz, do: r.do, temat: r.temat, typ: r.typ, ok: r.ok === "true", blad: r.blad ?? null, czas: r.czas }));
  return Response.json({ ok: true, items }, { headers: { "Cache-Control": "no-store" } });
}
