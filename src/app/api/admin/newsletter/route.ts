import { czyAdmin } from "@/lib/adminAuth";
import { sbService } from "@/lib/supabase";
import { katalogWszystko } from "@/lib/produktyDb";
import { KLUCZ_OSTATNIEJ, type OstatniaWysylka } from "@/lib/newsletterDobor";

export const dynamic = "force-dynamic";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Panel: lista zapisanych do newslettera, wynik ostatniej wysyłki i osoby czekające
// na powiadomienie „znów dostępne".
export async function GET() {
  if (!czyAdmin()) return Response.json({ ok: false }, { status: 401 });
  const sb = sbService();
  if (!sb) return Response.json({ ok: false, blad: "Brak bazy." }, { status: 503 });

  const [sub, ost, czek, katalog] = await Promise.all([
    sb.from("newsletter").select("email, created_at").order("created_at", { ascending: false }).range(0, 9999),
    sb.from("ustawienia").select("wartosc").eq("klucz", KLUCZ_OSTATNIEJ).maybeSingle(),
    sb
      .from("powiadomienia_dostepnosc")
      .select("id, produkt_id, rozmiar, email, created_at")
      .eq("powiadomiony", false)
      .order("created_at", { ascending: false })
      .range(0, 999),
    katalogWszystko(),
  ]);
  if (sub.error) return Response.json({ ok: false, blad: sub.error.message }, { status: 500 });

  const nazwy = new Map(katalog.map((p) => [p.id, { nazwa: p.nazwa, stan: p.stan ?? null }]));
  const { count: wyslanePowiadomienia } = await sb.from("powiadomienia_dostepnosc").select("id", { count: "exact", head: true }).eq("powiadomiony", true);

  return Response.json({
    ok: true,
    subskrybenci: (sub.data ?? []).map((r: { email: string; created_at: string }) => ({ email: r.email, od: r.created_at })),
    ostatnia: (ost.data?.wartosc as OstatniaWysylka | undefined) ?? null,
    czekajace: (czek.data ?? []).map((r: { id: string; produkt_id: string; rozmiar: string | null; email: string; created_at: string }) => ({
      id: r.id,
      produktId: r.produkt_id,
      nazwa: nazwy.get(r.produkt_id)?.nazwa ?? null,
      rozmiar: r.rozmiar,
      email: r.email,
      od: r.created_at,
    })),
    wyslanePowiadomienia: wyslanePowiadomienia ?? 0,
  });
}

// Usunięcie adresu z listy (np. prośba klienta o wypisanie / RODO).
export async function DELETE(req: Request) {
  if (!czyAdmin()) return Response.json({ ok: false }, { status: 401 });
  const sb = sbService();
  if (!sb) return Response.json({ ok: false, blad: "Brak bazy." }, { status: 503 });
  const email = (new URL(req.url).searchParams.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL.test(email)) return Response.json({ ok: false, blad: "Zły adres." }, { status: 400 });
  const { error } = await sb.from("newsletter").delete().eq("email", email);
  if (error) return Response.json({ ok: false, blad: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
