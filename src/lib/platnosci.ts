import Stripe from "stripe";

// Klient Stripe — tylko gdy ustawiony klucz. Bez klucza sklep działa w trybie
// demonstracyjnym (bez realnej płatności).

let klient: Stripe | null = null;

export function stripeWlaczony(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

export function stripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!klient) klient = new Stripe(key, { apiVersion: "2024-06-20" });
  return klient;
}

/** Bazowy adres sklepu (do success/cancel URL). */
export function bazowyUrl(req: Request): string {
  const env = process.env.NEXT_PUBLIC_BAZOWY_URL;
  if (env) return env.replace(/\/$/, "");
  const origin = req.headers.get("origin");
  if (origin) return origin;
  const host = req.headers.get("host");
  return host ? `https://${host}` : "";
}
