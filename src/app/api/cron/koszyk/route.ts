import { sbService } from "@/lib/supabase";
import { katalogWidoczny } from "@/lib/produktyDb";
import { wyslijMailPorzuconyKoszyk, mailWlaczony, type ProduktMail } from "@/lib/mail";
import { BAZA } from "@/lib/mailSzablon";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/* eslint-disable @typescript-eslint/no-explicit-any */

// Przypomnienie o porzuconym koszyku. Uruchamiane przez Vercel Cron (vercel.json)
// z nagłówkiem Authorization: Bearer <CRON_SECRET>.
// Kwalifikacja: koszyk niepusty, ostatnia zmiana 1h–3 dni temu, i albo brak
// wcześniejszego przypomnienia, albo koszyk zmieniony po ostatnim przypomnieniu.
export async function GET(req: Request) {
  const sekret = process.env.CRON_SECRET;
  if (!sekret) return Response.json({ ok: false, powod: "brak_CRON_SECRET" }, { status: 503 });
  if (req.headers.get("authorization") !== `Bearer ${sekret}`) {
    return Response.json({ ok: false, powod: "brak_dostepu" }, { status: 401 });
  }
  if (!mailWlaczony()) return Response.json({ ok: false, powod: "brak_maili" }, { status: 503 });

  const sb = sbService();
  if (!sb) return Response.json({ ok: false, powod: "brak_bazy" }, { status: 503 });

  const teraz = Date.now();
  const GODZINA = 60 * 60 * 1000;
  const dolne = teraz - 3 * 24 * GODZINA; // nie starsze niż 3 dni
  const gorne = teraz - 1 * GODZINA; // nie świeższe niż 1 h

  const { data: rzedy, error } = await sb
    .from("konto_dane")
    .select("user_id, koszyk, zaktualizowano, koszyk_przypomniano_at")
    .order("zaktualizowano", { ascending: false })
    .limit(500);
  if (error) return Response.json({ ok: false, blad: error.message }, { status: 500 });

  const kandydaci = (rzedy ?? []).filter((r: any) => {
    const koszyk = Array.isArray(r.koszyk) ? r.koszyk : [];
    if (koszyk.length === 0) return false;
    const zakt = new Date(r.zaktualizowano).getTime();
    if (!(zakt <= gorne && zakt >= dolne)) return false;
    // nie wysyłaj ponownie, dopóki koszyk się nie zmieni po ostatnim przypomnieniu
    if (r.koszyk_przypomniano_at && new Date(r.koszyk_przypomniano_at).getTime() >= zakt) return false;
    return true;
  });
  if (kandydaci.length === 0) return Response.json({ ok: true, wyslano: 0 });

  const katalog = await katalogWidoczny();
  const mapa = new Map(katalog.map((p) => [p.id, p]));

  let wyslano = 0;
  for (const r of kandydaci as any[]) {
    // E-mail i imię z konta (service role).
    const { data: u } = await sb.auth.admin.getUserById(r.user_id);
    const email = u?.user?.email;
    if (!email) continue;
    const imie = (u?.user?.user_metadata?.imie as string) || undefined;

    // Czy klient złożył zamówienie po ostatniej zmianie koszyka — jeśli tak, pomiń.
    const zakt = new Date(r.zaktualizowano).getTime();
    const { data: zam } = await sb
      .from("zamowienia")
      .select("created_at")
      .ilike("klient->>email", email)
      .gte("created_at", new Date(zakt).toISOString())
      .limit(1);
    if (zam && zam.length > 0) {
      await sb.from("konto_dane").update({ koszyk_przypomniano_at: new Date().toISOString() }).eq("user_id", r.user_id);
      continue;
    }

    const produkty: ProduktMail[] = (r.koszyk as any[])
      .map((it) => mapa.get(String(it.id)))
      .filter((p): p is NonNullable<typeof p> => !!p)
      .slice(0, 4)
      .map((p) => ({ nazwa: p.nazwa, cena: p.cena, zdjecie: p.zdjecie ?? null, url: `${BAZA}/produkty/${p.id}` }));
    if (produkty.length === 0) continue;

    const res = await wyslijMailPorzuconyKoszyk({ email, imie, produkty });
    if (res.ok) wyslano++;
    await sb.from("konto_dane").update({ koszyk_przypomniano_at: new Date().toISOString() }).eq("user_id", r.user_id);
  }

  return Response.json({ ok: true, wyslano, kandydatow: kandydaci.length });
}
