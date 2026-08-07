import { cookies } from "next/headers";
import { COOKIE_ADMIN, adminHaslo, czyAdmin, tokenAdmina, hasloOk } from "@/lib/adminAuth";
import { ipZadania, wLimicie, limitOdpowiedz } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

// Sprawdzenie, czy bieżąca sesja jest zalogowana (cookie httpOnly nie jest
// czytelne z JS, więc panel pyta serwer).
export async function GET() {
  return Response.json({ ok: czyAdmin(), skonfigurowane: !!adminHaslo() });
}

export async function POST(req: Request) {
  // Ochrona przed zgadywaniem hasła — 5 prób / 5 min na adres IP.
  if (!wLimicie(`admin-login:${ipZadania(req)}`, 5, 5 * 60 * 1000)) return limitOdpowiedz();

  const { haslo } = (await req.json().catch(() => ({}))) as { haslo?: string };
  if (!adminHaslo()) return Response.json({ ok: false, powod: "brak_konfiguracji" }, { status: 501 });
  if (!hasloOk(String(haslo ?? ""))) return Response.json({ ok: false }, { status: 401 });

  cookies().set(COOKIE_ADMIN, tokenAdmina(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return Response.json({ ok: true });
}

export async function DELETE() {
  cookies().delete(COOKIE_ADMIN);
  return Response.json({ ok: true });
}
