import { czyAdmin, odmowa } from "@/lib/adminAuth";
import { sbService } from "@/lib/supabase";
import { PREFIKS_MAILA } from "@/lib/mailLog";
import { listaZResend, mailZResend } from "@/lib/resendHistoria";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */
// Wysłane maile: własny dziennik (od uruchomienia) + historia z Resend (także starsze maile).
// Lista bez treści albo jeden mail z treścią HTML (?id=mail:… lub ?id=resend:…).
export async function GET(req: Request) {
  if (!czyAdmin()) return odmowa();
  const sb = sbService();
  const id = new URL(req.url).searchParams.get("id");

  if (id?.startsWith("resend:")) {
    const r = await mailZResend(id.slice("resend:".length));
    if (!r.mail) return Response.json({ ok: false, blad: r.blad }, { status: 502 });
    return Response.json({ ok: true, mail: r.mail }, { headers: { "Cache-Control": "no-store" } });
  }
  if (id) {
    if (!id.startsWith(PREFIKS_MAILA) || !sb) return Response.json({ ok: false }, { status: 400 });
    const { data } = await sb.from("ustawienia").select("wartosc").eq("klucz", id).maybeSingle();
    if (!data) return Response.json({ ok: false }, { status: 404 });
    return Response.json({ ok: true, mail: data.wartosc }, { headers: { "Cache-Control": "no-store" } });
  }

  const [wlasne, resend] = await Promise.all([
    sb
      ? sb
          .from("ustawienia")
          .select("klucz, do:wartosc->>do, temat:wartosc->>temat, typ:wartosc->>typ, ok:wartosc->>ok, blad:wartosc->>blad, czas:wartosc->>czas, idResend:wartosc->>idResend")
          .like("klucz", `${PREFIKS_MAILA}%`)
          .order("klucz", { ascending: false })
          .limit(500)
      : Promise.resolve({ data: [] as any[] }),
    listaZResend(),
  ]);

  const z_dziennika = (wlasne.data ?? []).map((r: any) => ({
    id: r.klucz,
    do: r.do,
    temat: r.temat,
    typ: r.typ,
    ok: r.ok === "true",
    blad: r.blad ?? null,
    czas: r.czas,
    idResend: r.idResend ?? null,
    zrodlo: "dziennik",
  }));
  // Mail z Resend, który jest już w dzienniku — pokazujemy wpis z dziennika z dopisanym statusem doręczenia.
  const zdarzenia = new Map(resend.items.map((m) => [m.idResend, m.zdarzenie]));
  const wDzienniku = new Set(z_dziennika.map((m) => m.idResend).filter(Boolean));
  const items = [
    ...z_dziennika.map((m) => ({ ...m, zdarzenie: (m.idResend && zdarzenia.get(m.idResend)) || null })),
    ...resend.items.filter((m) => !wDzienniku.has(m.idResend)).map((m) => ({ ...m, zrodlo: "resend" })),
  ].sort((a, b) => +new Date(b.czas) - +new Date(a.czas));

  return Response.json({ ok: true, items, resendBlad: resend.blad ?? null }, { headers: { "Cache-Control": "no-store" } });
}
