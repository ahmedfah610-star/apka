import { wyslijMailRejestracja } from "@/lib/mail";
import { ipZadania, wLimicie, limitOdpowiedz } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Wysyła mail powitalny po AKTYWACJI konta (wołany ze strony /auth/confirm).
export async function POST(req: Request) {
  if (!wLimicie(`powitanie:${ipZadania(req)}`, 4, 60 * 1000)) return limitOdpowiedz();

  const b = (await req.json().catch(() => ({}))) as { email?: string; imie?: string };
  const email = String(b.email ?? "").trim().toLowerCase();
  if (!EMAIL.test(email)) return Response.json({ ok: false }, { status: 400 });

  await wyslijMailRejestracja(email, b.imie);
  return Response.json({ ok: true });
}
