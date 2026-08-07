import { cookies } from "next/headers";
import { createHash, timingSafeEqual } from "node:crypto";

export const COOKIE_ADMIN = "fasolka_admin";

export function adminHaslo(): string {
  return process.env.ADMIN_HASLO ?? "";
}

// Token sesji = skrót hasła. Dzięki temu surowe hasło NIGDY nie trafia do
// cookie, logów ani kopii zapasowych (wcześniej cookie zawierało samo hasło).
export function tokenAdmina(): string {
  const h = adminHaslo();
  if (!h) return "";
  return createHash("sha256").update(`bobas-admin-v1:${h}`).digest("hex");
}

// Porównanie w czasie stałym (odporność na ataki czasowe).
function rowne(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/** Czy podane hasło jest poprawne (porównanie stałoczasowe). */
export function hasloOk(podane: string): boolean {
  const h = adminHaslo();
  if (!h) return false;
  return rowne(podane, h);
}

/** Czy bieżące żądanie ma ważną sesję admina (cookie httpOnly). */
export function czyAdmin(): boolean {
  const t = tokenAdmina();
  if (!t) return false;
  const c = cookies().get(COOKIE_ADMIN)?.value ?? "";
  return rowne(c, t);
}

export function odmowa() {
  return Response.json({ ok: false, powod: "brak_dostepu" }, { status: 401 });
}
