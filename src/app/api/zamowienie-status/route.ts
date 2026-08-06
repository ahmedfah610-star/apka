import { sbService, supabaseWlaczony } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function POST(req: Request) {
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
