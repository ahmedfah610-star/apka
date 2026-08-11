import { sbService } from "@/lib/supabase";
import { katalogWidoczny } from "@/lib/produktyDb";
import { ARTYKULY } from "@/data/blog";
import { wyslijNewsletterTygodniowy, mailWlaczony, type ProduktMail } from "@/lib/mail";
import { BAZA } from "@/lib/mailSzablon";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Cotygodniowy newsletter. Uruchamiany przez Vercel Cron (vercel.json) z
// nagłówkiem Authorization: Bearer <CRON_SECRET>. Bez sekretu — endpoint odmawia.
export async function GET(req: Request) {
  const sekret = process.env.CRON_SECRET;
  if (!sekret) return Response.json({ ok: false, powod: "brak_CRON_SECRET" }, { status: 503 });
  if (req.headers.get("authorization") !== `Bearer ${sekret}`) {
    return Response.json({ ok: false, powod: "brak_dostepu" }, { status: 401 });
  }
  if (!mailWlaczony()) return Response.json({ ok: false, powod: "brak_maili" }, { status: 503 });

  const sb = sbService();
  if (!sb) return Response.json({ ok: false, powod: "brak_bazy" }, { status: 503 });

  // Subskrybenci.
  const { data: sub } = await sb.from("newsletter").select("email");
  const adresy = (sub ?? []).map((r: { email: string }) => r.email).filter(Boolean);
  if (adresy.length === 0) return Response.json({ ok: true, wyslano: 0, powod: "brak_subskrybentow" });

  // Wyróżnione produkty (badge), uzupełnione o pierwsze z katalogu.
  const katalog = await katalogWidoczny();
  const wybor = [...katalog.filter((p) => p.badge), ...katalog].filter(
    (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i,
  );
  const produkty: ProduktMail[] = wybor.slice(0, 4).map((p) => ({
    nazwa: p.nazwa,
    cena: p.cena,
    zdjecie: p.zdjecie ?? null,
    url: `${BAZA}/produkty/${p.id}`,
  }));

  // Najnowszy wpis z bloga.
  const a = ARTYKULY[0];
  const artykul = a ? { tytul: a.tytul, opis: a.opis, url: `${BAZA}/blog/${a.slug}` } : undefined;

  const { wyslano } = await wyslijNewsletterTygodniowy(adresy, produkty, artykul);
  return Response.json({ ok: true, wyslano, subskrybenci: adresy.length });
}
