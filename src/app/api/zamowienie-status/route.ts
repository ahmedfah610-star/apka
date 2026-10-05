import { sbService, supabaseWlaczony } from "@/lib/supabase";
import { ipZadania, wLimicie, limitOdpowiedz } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function POST(req: Request) {
  // Ochrona przed enumeracją numerów zamówień — 10 prób / min na IP.
  if (!wLimicie(`status:${ipZadania(req)}`, 10, 60 * 1000)) return limitOdpowiedz();

  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const numer = String(b.numer ?? "").trim().replace(/^#/, "").toLowerCase();
  const email = String(b.email ?? "").trim().toLowerCase();

  if (numer.length < 4 || !email) {
    return Response.json({ ok: false, blad: "Podaj numer zamówienia i e-mail." }, { status: 400 });
  }
  if (!supabaseWlaczony()) return Response.json({ ok: false, blad: "Sprawdzanie statusu jest chwilowo niedostępne." }, { status: 503 });
  const sb = sbService();
  if (!sb) return Response.json({ ok: false, blad: "Błąd konfiguracji." }, { status: 500 });

  // Zamówienia dla podanego e-maila, potem dopasowanie po numerze (prefiks id).
  const { data } = await sb
    .from("zamowienia")
    .select("id, created_at, status, razem, dostawa, metoda, pozycje")
    .ilike("klient->>email", email)
    .order("created_at", { ascending: false })
    .limit(50);

  const zam = (data ?? []).find((z: any) => String(z.id).toLowerCase().startsWith(numer));
  if (!zam) {
    return Response.json({ ok: false, blad: "Nie znaleziono zamówienia dla podanych danych." }, { status: 404 });
  }

  return Response.json({
    ok: true,
    zamowienie: {
      numer: String(zam.id).slice(0, 8),
      status: zam.status,
      data: zam.created_at,
      razem: Number(zam.razem),
      dostawa: Number(zam.dostawa),
      metoda: zam.metoda ?? "",
      pozycje: Array.isArray(zam.pozycje)
        ? zam.pozycje.map((p: any) => ({ nazwa: p.nazwa, ilosc: p.ilosc, rozmiar: p.rozmiar ?? null }))
        : [],
    },
  });
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Strona podziękowania: czy płatność już potwierdzona (do zgłoszenia zakupu w GA4/Google Ads).
// Tylko status i kwota — po pełnym, niezgadywalnym id zamówienia (z adresu powrotu z płatności).
export async function GET(req: Request) {
  if (!wLimicie(`status-id:${ipZadania(req)}`, 30, 60 * 1000)) return limitOdpowiedz();
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!UUID.test(id)) return Response.json({ ok: false }, { status: 400 });
  const sb = supabaseWlaczony() ? sbService() : null;
  if (!sb) return Response.json({ ok: false }, { status: 503 });
  const { data } = await sb.from("zamowienia").select("status, razem").eq("id", id).maybeSingle();
  if (!data) return Response.json({ ok: false }, { status: 404 });
  return Response.json(
    { ok: true, status: data.status, razem: Number(data.razem) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
