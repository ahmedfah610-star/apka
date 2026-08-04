import { czyAdmin, odmowa } from "@/lib/adminAuth";
import { mailWlaczony, wyslijTest } from "@/lib/mail";

export const dynamic = "force-dynamic";

// Diagnostyka maili — wysyła testowy e-mail i zwraca faktyczną odpowiedź Resend.
// Użycie: /api/admin/mail-test?to=adres@example.com (domyślnie MAIL_SKLEP).
export async function GET(req: Request) {
  if (!czyAdmin()) return odmowa();
  if (!mailWlaczony()) return Response.json({ ok: false, powod: "Brak RESEND_API_KEY" }, { status: 501 });

  const url = new URL(req.url);
  const to = url.searchParams.get("to") || process.env.MAIL_SKLEP;
  if (!to) return Response.json({ ok: false, powod: "Podaj ?to=adres lub ustaw MAIL_SKLEP" }, { status: 400 });

  const wynik = await wyslijTest(to);
  return Response.json({
    ...wynik,
    do: to,
    nadawca: process.env.MAIL_FROM || "bobas-shopping <onboarding@resend.dev>",
  });
}
