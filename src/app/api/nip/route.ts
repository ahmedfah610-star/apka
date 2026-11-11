import { firmaPoNip } from "@/lib/rejestrVat";
import { ipZadania, wLimicie, limitOdpowiedz } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

// „Pobierz dane" przy fakturze na firmę: nazwa i adres z wykazu podatników VAT.
// Dane z rejestru są publiczne; limit chroni przed wykorzystaniem sklepu jako pośrednika.
export async function GET(req: Request) {
  if (!wLimicie(`nip:${ipZadania(req)}`, 10, 10 * 60 * 1000)) return limitOdpowiedz();
  const nip = new URL(req.url).searchParams.get("nip") ?? "";
  const w = await firmaPoNip(nip);
  if (!w.ok) return Response.json({ ok: false, blad: w.blad }, { status: 200, headers: { "Cache-Control": "no-store" } });
  return Response.json({ ok: true, firma: w.firma }, { headers: { "Cache-Control": "private, max-age=3600" } });
}
