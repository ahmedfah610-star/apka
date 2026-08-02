import { cookies } from "next/headers";

export const COOKIE_ADMIN = "fasolka_admin";

export function adminHaslo(): string {
  return process.env.ADMIN_HASLO ?? "";
}

/** Czy bieżące żądanie ma ważną sesję admina (cookie ustawione po logowaniu). */
export function czyAdmin(): boolean {
  const h = adminHaslo();
  if (!h) return false;
  return cookies().get(COOKIE_ADMIN)?.value === h;
}

export function odmowa() {
  return Response.json({ ok: false, powod: "brak_dostepu" }, { status: 401 });
}
