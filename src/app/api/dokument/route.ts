import { sbService } from "@/lib/supabase";
import { pobierzDokument, zamowienieDoDokumentow } from "@/lib/dokumentyMagazyn";
import { tokenDokumentuOk } from "@/lib/dokumentToken";
import { ipZadania, wLimicie } from "@/lib/rateLimit";
import { stronaProsta } from "@/lib/stronaProsta";

export const dynamic = "force-dynamic";

// Mail z fakturą → „Otwórz" (podpisany link): plik otwiera się w przeglądarce telefonu/komputera.
export async function GET(req: Request) {
  const html = (tytul: string, tekst: string, status: number) => {
    const r = stronaProsta(tytul, tekst);
    return new Response(r.body, { status, headers: r.headers });
  };
  if (!wLimicie(`dokument-mail:${ipZadania(req)}`, 30, 10 * 60 * 1000)) return html("Spróbuj za chwilę", "Za dużo prób otwarcia — spróbuj ponownie za kilka minut.", 429);
  const q = new URL(req.url).searchParams;
  const zId = q.get("z") ?? "";
  const dId = q.get("d") ?? "";
  if (!tokenDokumentuOk(zId, dId, q.get("t"))) return html("Link nieprawidłowy", "Ten link do dokumentu jest nieprawidłowy. Plik znajdziesz też w załączniku maila.", 404);
  const sb = sbService();
  if (!sb) return html("Chwilowo niedostępne", "Spróbuj ponownie za chwilę albo otwórz załącznik maila.", 503);
  const z = await zamowienieDoDokumentow(sb, zId);
  const d = z?.klient.dokumenty?.find((x) => x.id === dId);
  if (!d) return html("Dokument niedostępny", "Tego dokumentu już nie ma — mogliśmy wysłać nowszą wersję. Napisz do nas, jeśli go potrzebujesz.", 404);
  const tresc = await pobierzDokument(sb, d.plik);
  if (!tresc) return html("Chwilowo niedostępne", "Nie udało się otworzyć pliku — spróbuj za chwilę albo otwórz załącznik maila.", 500);
  const nazwa = d.nazwaPliku.replace(/[^\w.-]/g, "_");
  return new Response(tresc as unknown as BodyInit, {
    headers: {
      "Content-Type": d.mime || "application/pdf",
      "Content-Disposition": `inline; filename="${nazwa}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex",
    },
  });
}
