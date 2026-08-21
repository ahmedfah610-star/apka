import { sbService } from "@/lib/supabase";

// Klient Allegro REST API (oficjalny) + autoryzacja Device Flow.
// Token (refresh_token) trzymamy w tabeli allegro_auth; access_token odnawiamy sami.

const SANDBOX = process.env.ALLEGRO_SANDBOX === "1";
const OAUTH = SANDBOX ? "https://allegro.pl.allegrosandbox.pl/auth/oauth" : "https://allegro.pl/auth/oauth";
const API = SANDBOX ? "https://api.allegro.pl.allegrosandbox.pl" : "https://api.allegro.pl";
const ACCEPT = "application/vnd.allegro.public.v1+json";

function creds() {
  const id = process.env.ALLEGRO_CLIENT_ID?.trim();
  const secret = process.env.ALLEGRO_CLIENT_SECRET?.trim();
  return { id, secret };
}

export function allegroSkonfigurowany(): boolean {
  const { id, secret } = creds();
  return !!id && !!secret;
}

function basic(): string {
  const { id, secret } = creds();
  return "Basic " + Buffer.from(`${id}:${secret}`).toString("base64");
}

// ── Device Flow ─────────────────────────────────────────────────────────

export interface DeviceStart {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete: string;
  interval: number;
  expires_in: number;
}

/** Krok 1: poproś Allegro o kod urządzenia (pokazujemy user_code + link). */
export async function rozpocznijDevice(): Promise<{ ok: boolean; dane?: DeviceStart; blad?: string }> {
  const { id } = creds();
  if (!allegroSkonfigurowany()) return { ok: false, blad: "Brak ALLEGRO_CLIENT_ID/SECRET." };
  const res = await fetch(`${OAUTH}/device`, {
    method: "POST",
    headers: { Authorization: basic(), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: id! }),
  });
  if (!res.ok) return { ok: false, blad: `Allegro device ${res.status}: ${await res.text().catch(() => "")}` };
  return { ok: true, dane: (await res.json()) as DeviceStart };
}

/** Krok 2: odpytaj o token. Dopóki użytkownik nie potwierdzi — { oczekuje: true }. */
export async function sprawdzDevice(deviceCode: string): Promise<{ ok: boolean; oczekuje?: boolean; blad?: string }> {
  const res = await fetch(`${OAUTH}/token`, {
    method: "POST",
    headers: { Authorization: basic(), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:device_code", device_code: deviceCode }),
  });
  const d = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (res.ok && d.access_token) {
    await zapiszToken(String(d.access_token), String(d.refresh_token), Number(d.expires_in) || 3600);
    return { ok: true };
  }
  // Allegro zwraca 400 z error=authorization_pending / slow_down do czasu potwierdzenia.
  if (d.error === "authorization_pending" || d.error === "slow_down") return { ok: false, oczekuje: true };
  return { ok: false, blad: String(d.error_description || d.error || `Allegro token ${res.status}`) };
}

// ── Token: przechowywanie i odświeżanie ─────────────────────────────────

async function zapiszToken(access: string, refresh: string, expiresIn: number): Promise<void> {
  const sb = sbService();
  if (!sb) return;
  await sb.from("allegro_auth").upsert({
    id: 1,
    access_token: access,
    refresh_token: refresh,
    expires_at: new Date(Date.now() + (expiresIn - 60) * 1000).toISOString(),
    zaktualizowano: new Date().toISOString(),
  });
}

async function odswiez(refresh: string): Promise<string | null> {
  const res = await fetch(`${OAUTH}/token`, {
    method: "POST",
    headers: { Authorization: basic(), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refresh }),
  });
  const d = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || !d.access_token) return null;
  await zapiszToken(String(d.access_token), String(d.refresh_token || refresh), Number(d.expires_in) || 3600);
  return String(d.access_token);
}

/** Ważny access_token (odświeżany automatycznie) lub null, gdy brak połączenia. */
export async function aktualnyToken(): Promise<string | null> {
  const sb = sbService();
  if (!sb) return null;
  const { data } = await sb.from("allegro_auth").select("access_token, refresh_token, expires_at").eq("id", 1).maybeSingle();
  if (!data?.refresh_token) return null;
  const wazny = data.access_token && data.expires_at && new Date(data.expires_at).getTime() > Date.now();
  if (wazny) return data.access_token as string;
  return odswiez(data.refresh_token as string);
}

export async function czyPolaczony(): Promise<boolean> {
  const sb = sbService();
  if (!sb) return false;
  const { data } = await sb.from("allegro_auth").select("refresh_token").eq("id", 1).maybeSingle();
  return !!data?.refresh_token;
}

// ── Zapytania do API ────────────────────────────────────────────────────

/** Autoryzowane GET do Allegro API. Zwraca sparsowany JSON lub rzuca błąd. */
export async function allegroGet<T = unknown>(sciezka: string): Promise<T> {
  const token = await aktualnyToken();
  if (!token) throw new Error("Brak połączenia z Allegro.");
  const res = await fetch(`${API}${sciezka}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: ACCEPT },
  });
  if (!res.ok) throw new Error(`Allegro ${sciezka} → ${res.status}: ${await res.text().catch(() => "")}`);
  return (await res.json()) as T;
}
