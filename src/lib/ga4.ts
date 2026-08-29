import { createSign } from "node:crypto";

// Dostęp do Google Analytics 4 (Data API) przez konto serwisowe — bez zewnętrznych
// bibliotek. Podpisujemy JWT (RS256) kluczem konta serwisowego i wymieniamy na
// token dostępu, którym odpytujemy raporty. Wymagane zmienne środowiskowe:
//   GA4_PROPERTY_ID    – numer usługi GA4 (same cyfry, np. 401234567)
//   GA4_CLIENT_EMAIL   – e-mail konta serwisowego
//   GA4_PRIVATE_KEY    – klucz prywatny konta serwisowego (z \n)

const SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

export function ga4Skonfigurowane(): boolean {
  return !!(process.env.GA4_PROPERTY_ID && process.env.GA4_CLIENT_EMAIL && process.env.GA4_PRIVATE_KEY);
}

function b64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

let cache: { token: string; exp: number } | null = null;

async function token(): Promise<string> {
  if (cache && cache.exp > Date.now() + 60_000) return cache.token;
  const email = process.env.GA4_CLIENT_EMAIL!;
  const key = (process.env.GA4_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({ iss: email, scope: SCOPE, aud: "https://oauth2.googleapis.com/token", exp: now + 3600, iat: now }));
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claim}`);
  const sig = b64url(signer.sign(key));
  const jwt = `${header}.${claim}.${sig}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const d = (await res.json()) as { access_token?: string; expires_in?: number; error_description?: string };
  if (!d.access_token) throw new Error(d.error_description || "Brak tokenu GA4");
  cache = { token: d.access_token, exp: Date.now() + (d.expires_in ?? 3600) * 1000 };
  return d.access_token;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
async function api(metoda: string, body: any): Promise<any> {
  const pid = process.env.GA4_PROPERTY_ID!;
  const t = await token();
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${pid}:${metoda}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d?.error?.message || `Błąd GA4 (${res.status})`);
  return d;
}

export function raport(body: any): Promise<any> {
  return api("runReport", body);
}
export function raportNaZywo(body: any): Promise<any> {
  return api("runRealtimeReport", body);
}

/** Zamienia odpowiedź runReport na tablicę { klucze wymiarów..., metryki jako liczby }. */
export function wiersze(odp: any): { wymiary: string[]; metryki: number[] }[] {
  return (odp?.rows ?? []).map((r: any) => ({
    wymiary: (r.dimensionValues ?? []).map((v: any) => v.value ?? ""),
    metryki: (r.metricValues ?? []).map((v: any) => Number(v.value ?? 0)),
  }));
}
