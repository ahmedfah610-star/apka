import { urlProduktu } from "@/lib/adresProduktu";
import { sbService } from "@/lib/supabase";
import { katalogWidoczny } from "@/lib/produktyDb";
import { ARTYKULY } from "@/data/blog";
import { wyslijNewsletterTygodniowy, mailWlaczony, type ProduktMail } from "@/lib/mail";
import { BAZA } from "@/lib/mailSzablon";
import { artykulTygodnia, DNI_NOWOSCI, KLUCZ_OSTATNIEJ, tematNewslettera, wybierzNowosci, type OstatniaWysylka } from "@/lib/newsletterDobor";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Cotygodniowy newsletter z NOWOŚCIAMI (produkty dziecięce na stanie dodane w ostatnim tygodniu).
// Gdy nic nowego nie doszło — nie wysyłamy (lepiej nic niż powtórka). Uruchamiany przez Vercel Cron
// (vercel.json) z nagłówkiem Authorization: Bearer <CRON_SECRET>. Bez sekretu — endpoint odmawia.
export async function GET(req: Request) {
  const sekret = process.env.CRON_SECRET;
  if (!sekret) return Response.json({ ok: false, powod: "brak_CRON_SECRET" }, { status: 503 });
  if (req.headers.get("authorization") !== `Bearer ${sekret}`) {
    return Response.json({ ok: false, powod: "brak_dostepu" }, { status: 401 });
  }
  if (!mailWlaczony()) return Response.json({ ok: false, powod: "brak_maili" }, { status: 503 });

  const sb = sbService();
  if (!sb) return Response.json({ ok: false, powod: "brak_bazy" }, { status: 503 });

  const teraz = new Date();
  const zapisz = async (w: Omit<OstatniaWysylka, "czas">) => {
    await sb.from("ustawienia").upsert({ klucz: KLUCZ_OSTATNIEJ, wartosc: { czas: teraz.toISOString(), ...w }, zaktualizowano: teraz.toISOString() });
    return Response.json({ ok: true, ...w });
  };

  const { data: sub } = await sb.from("newsletter").select("email");
  const adresy = (sub ?? []).map((r: { email: string }) => r.email).filter(Boolean);
  if (adresy.length === 0) return zapisz({ wyslano: 0, subskrybenci: 0, produkty: [], powod: "brak_subskrybentow" });

  // Produkty dodane w ostatnim tygodniu (data z bazy), potem filtr: dziecięce i na stanie.
  const od = new Date(teraz.getTime() - DNI_NOWOSCI * 86400000).toISOString();
  const { data: swieze } = await sb.from("produkty").select("id, created_at").eq("ukryty", false).gte("created_at", od);
  const dodane = new Map((swieze ?? []).map((r: { id: string; created_at: string }) => [r.id, r.created_at]));
  const nowosci = wybierzNowosci(await katalogWidoczny(), dodane);
  if (nowosci.length === 0) return zapisz({ wyslano: 0, subskrybenci: adresy.length, produkty: [], powod: "brak_nowosci" });

  const produkty: ProduktMail[] = nowosci.map((p) => ({ nazwa: p.nazwa, cena: p.cena, zdjecie: p.zdjecie ?? null, url: `${BAZA}${urlProduktu(p)}` }));
  const a = artykulTygodnia(ARTYKULY, teraz);
  const artykul = a ? { tytul: a.tytul, opis: a.opis, url: `${BAZA}/blog/${a.slug}` } : undefined;
  const temat = tematNewslettera(nowosci);

  const { wyslano } = await wyslijNewsletterTygodniowy(adresy, produkty, artykul, temat);
  return zapisz({
    wyslano,
    subskrybenci: adresy.length,
    produkty: nowosci.map((p) => p.nazwa),
    temat,
    ...(wyslano < adresy.length ? { powod: "blad" as const } : {}),
  });
}
