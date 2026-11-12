import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

export const COOKIE_ADMIN = "fasolka_admin";

export function adminHaslo(): string {
  return process.env.ADMIN_HASLO ?? "";
}

// Token sesji = termin ważności + podpis HMAC kluczem z hasła („<exp>.<podpis>").
// Surowe hasło nigdy nie trafia do cookie; sesja wygasa po 8 h także po stronie serwera
// (skradzione cookie nie działa w nieskończoność), a zmiana hasła unieważnia wszystkie sesje.
export const WAZNOSC_SESJI_MS = 8 * 60 * 60 * 1000;

function podpis(haslo: string, exp: number): string {
  return createHmac("sha256", `bobas-admin-v2:${haslo}`).update(String(exp)).digest("hex");
}

export function tokenAdmina(teraz: number = Date.now()): string {
  const h = adminHaslo();
  if (!h) return "";
  const exp = teraz + WAZNOSC_SESJI_MS;
  return `${exp}.${podpis(h, exp)}`;
}

/** Czy token sesji jest prawdziwy i jeszcze ważny. */
export function tokenAdminaOk(token: string, teraz: number = Date.now()): boolean {
  const h = adminHaslo();
  if (!h || !token) return false;
  const [expTekst, sig] = token.split(".");
  const exp = Number(expTekst);
  if (!Number.isFinite(exp) || exp <= teraz || exp > teraz + WAZNOSC_SESJI_MS + 60_000 || !sig) return false;
  return rowne(sig, podpis(h, exp));
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
  return tokenAdminaOk(cookies().get(COOKIE_ADMIN)?.value ?? "");
}

export function odmowa() {
  return Response.json({ ok: false, powod: "brak_dostepu" }, { status: 401 });
}
