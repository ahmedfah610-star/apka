import { cookies } from "next/headers";
import { COOKIE_ADMIN, adminHaslo, czyAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

// Sprawdzenie, czy bieżąca sesja jest zalogowana (cookie httpOnly nie jest
// czytelne z JS, więc panel pyta serwer).
export async function GET() {
  return Response.json({ ok: czyAdmin(), skonfigurowane: !!adminHaslo() });
}

export async function POST(req: Request) {
  const { haslo } = (await req.json().catch(() => ({}))) as { haslo?: string };
  if (!adminHaslo()) return Response.json({ ok: false, powod: "brak_konfiguracji" }, { status: 501 });
  if (haslo !== adminHaslo()) return Response.json({ ok: false }, { status: 401 });
  cookies().set(COOKIE_ADMIN, adminHaslo(), {
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
