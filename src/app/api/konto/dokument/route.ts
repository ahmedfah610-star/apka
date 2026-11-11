import { sbService } from "@/lib/supabase";
import { linkDoDokumentu, zamowienieDoDokumentow } from "@/lib/dokumentyMagazyn";
import { ipZadania, wLimicie, limitOdpowiedz } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

// Moje zamówienia → „Pobierz": link do dokumentu tylko dla zalogowanego klienta, którego
// e-mail jest w zamówieniu (sesja przekazana w nagłówku Authorization).
export async function GET(req: Request) {
  if (!wLimicie(`dokument:${ipZadania(req)}`, 30, 10 * 60 * 1000)) return limitOdpowiedz();
  const sb = sbService();
  if (!sb) return Response.json({ ok: false, blad: "Chwilowo niedostępne." }, { status: 503 });
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return Response.json({ ok: false, blad: "Zaloguj się, aby pobrać dokument." }, { status: 401 });
  const { data: u } = await sb.auth.getUser(token);
  const email = u?.user?.email?.trim().toLowerCase();
  if (!email) return Response.json({ ok: false, blad: "Zaloguj się, aby pobrać dokument." }, { status: 401 });

  const q = new URL(req.url).searchParams;
  const z = await zamowienieDoDokumentow(sb, q.get("zamowienie") ?? "");
  // Ta sama odpowiedź dla cudzego i nieistniejącego zamówienia — nie zdradzamy, co istnieje.
  if (!z || String(z.klient.email ?? "").trim().toLowerCase() !== email) {
    return Response.json({ ok: false, blad: "Nie znaleziono dokumentu." }, { status: 404 });
  }
  const d = (z.klient.dokumenty ?? []).find((x) => x.id === q.get("dokument"));
  if (!d) return Response.json({ ok: false, blad: "Nie znaleziono dokumentu." }, { status: 404 });
  const link = await linkDoDokumentu(sb, d);
  if (!link) return Response.json({ ok: false, blad: "Nie udało się przygotować pliku." }, { status: 500 });
  return Response.json({ ok: true, url: link }, { headers: { "Cache-Control": "no-store" } });
}
