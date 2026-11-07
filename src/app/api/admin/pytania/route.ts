import { czyAdmin, odmowa } from "@/lib/adminAuth";
import { sbService } from "@/lib/supabase";
import { listaPytan, MAX_ODPOWIEDZ, pobierzPytanie, zmienPytanie } from "@/lib/pytania";
import { wyslijOdpowiedzNaPytanie } from "@/lib/mail";

export const dynamic = "force-dynamic";

// Panel: lista pytań klientów, odpowiedź mailem, „załatwione".
export async function GET() {
  if (!czyAdmin()) return odmowa();
  const sb = sbService();
  if (!sb) return Response.json({ ok: false, blad: "Brak bazy." }, { status: 503 });
  try {
    return Response.json({ ok: true, items: await listaPytan(sb) }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return Response.json({ ok: false, blad: e instanceof Error ? e.message : "Błąd" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!czyAdmin()) return odmowa();
  const sb = sbService();
  if (!sb) return Response.json({ ok: false, blad: "Brak bazy." }, { status: 503 });
  const b = (await req.json().catch(() => ({}))) as { id?: unknown; akcja?: unknown; tekst?: unknown };
  const p = await pobierzPytanie(sb, String(b.id ?? ""));
  if (!p) return Response.json({ ok: false, blad: "Nie znaleziono pytania." }, { status: 404 });

  if (b.akcja === "odpowiedz") {
    const tekst = typeof b.tekst === "string" ? b.tekst.trim().slice(0, MAX_ODPOWIEDZ) : "";
    if (tekst.length < 2) return Response.json({ ok: false, blad: "Wpisz odpowiedź." }, { status: 400 });
    const wynik = await wyslijOdpowiedzNaPytanie(p, tekst);
    if (!wynik.ok) return Response.json({ ok: false, blad: `Mail nie wyszedł: ${wynik.blad ?? "błąd"}` }, { status: 502 });
    const nowe = await zmienPytanie(sb, p, { status: "odpowiedziane", odpowiedz: tekst, odpowiedzCzas: new Date().toISOString() });
    return Response.json({ ok: true, pytanie: nowe });
  }
  if (b.akcja === "zalatwione" || b.akcja === "nowe") {
    const nowe = await zmienPytanie(sb, p, { status: b.akcja });
    return Response.json({ ok: true, pytanie: nowe });
  }
  if (b.akcja === "usun") {
    await sb.from("ustawienia").delete().eq("klucz", p.id);
    return Response.json({ ok: true });
  }
  return Response.json({ ok: false, blad: "Nieznana akcja." }, { status: 400 });
}
