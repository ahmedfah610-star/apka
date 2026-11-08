import { bazowyUrl } from "@/lib/platnosci";
import { ipZadania, wLimicie } from "@/lib/rateLimit";
import { nowaPlatnoscZamowienia, UUID } from "@/lib/ponowPlatnosc";

export const dynamic = "force-dynamic";

const NAGLOWKI = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };
const przekieruj = (url: string) => new Response(null, { status: 303, headers: { ...NAGLOWKI, Location: url } });

// Link „Zapłać" z maila z przypomnieniem: od razu przekierowuje do Przelewy24 (nowa transakcja
// na kwotę z zamówienia). Gdy płatność nie jest możliwa (już opłacone, minęło 14 dni, towar się
// wyprzedał…) — strona statusu zamówienia, która pokaże, co się dzieje.
export async function GET(req: Request) {
  const baza = bazowyUrl(req) || new URL(req.url).origin;
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!UUID.test(id)) return przekieruj(`${baza}/status-zamowienia`);
  const strona = `${baza}/zamowienie/dziekujemy?zamowienie=${id}`;
  if (!wLimicie(`zaplac:${ipZadania(req)}`, 10, 10 * 60 * 1000)) return przekieruj(strona);
  const w = await nowaPlatnoscZamowienia(id, baza);
  return przekieruj(w.ok ? w.url : strona);
}
