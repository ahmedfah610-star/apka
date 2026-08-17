import { sprawdzKod } from "@/lib/kodyDb";
import { ipZadania, wLimicie, limitOdpowiedz } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

// Publiczna walidacja kodu rabatowego względem sumy koszyka.
// Zwraca kwotę rabatu — ale ostateczny rabat i tak przelicza checkout na serwerze.
export async function POST(req: Request) {
  if (!wLimicie(`kod:${ipZadania(req)}`, 20, 60 * 1000)) return limitOdpowiedz();
  const b = (await req.json().catch(() => ({}))) as { kod?: string; suma?: number };
  const suma = Math.max(0, Number(b.suma) || 0);
  const r = await sprawdzKod(String(b.kod ?? ""), suma);
  if (!r.ok) return Response.json({ ok: false, blad: r.blad });
  return Response.json({
    ok: true,
    kod: r.kod!.kod,
    typ: r.kod!.typ,
    wartosc: r.kod!.wartosc,
    rabat: r.rabat,
  });
}
