import { bazowyUrl } from "@/lib/platnosci";
import { ipZadania, wLimicie, limitOdpowiedz } from "@/lib/rateLimit";
import { nowaPlatnoscZamowienia } from "@/lib/ponowPlatnosc";

export const dynamic = "force-dynamic";

// „Dokończ płatność" z panelu konta i ze strony powrotu z płatności — logika w lib/ponowPlatnosc.
export async function POST(req: Request) {
  if (!wLimicie(`ponow:${ipZadania(req)}`, 10, 10 * 60 * 1000)) return limitOdpowiedz();
  const b = (await req.json().catch(() => ({}))) as { id?: unknown };
  const w = await nowaPlatnoscZamowienia(String(b.id ?? ""), bazowyUrl(req));
  if (!w.ok) return Response.json({ ok: false, blad: w.blad }, { status: w.status });
  return Response.json({ ok: true, url: w.url });
}
