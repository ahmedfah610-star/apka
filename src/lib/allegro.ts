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
    await zapiszBladTokenu(null);
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

// Ostatni błąd odświeżenia tokenu (do panelu) — bez samych tokenów.
const KLUCZ_BLEDU = "allegro:blad-tokenu";

async function zapiszBladTokenu(blad: string | null): Promise<void> {
  const sb = sbService();
  if (!sb) return;
  if (blad === null) await sb.from("ustawienia").delete().eq("klucz", KLUCZ_BLEDU);
  else await sb.from("ustawienia").upsert({ klucz: KLUCZ_BLEDU, wartosc: { blad, czas: new Date().toISOString() }, zaktualizowano: new Date().toISOString() });
}

async function odswiez(refresh: string): Promise<{ token: string | null; blad?: string }> {
  try {
    const res = await fetch(`${OAUTH}/token`, {
      method: "POST",
      headers: { Authorization: basic(), "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refresh }),
      signal: AbortSignal.timeout(10000),
    });
    const d = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok || !d.access_token) {
      return { token: null, blad: `Allegro ${res.status}: ${String(d.error_description || d.error || "odmowa odświeżenia")}`.slice(0, 300) };
    }
    // Refresh token Allegro jest jednorazowy (stary działa jeszcze 60 s) — nowy MUSI się zapisać.
    await zapiszToken(String(d.access_token), String(d.refresh_token || refresh), Number(d.expires_in) || 3600);
    return { token: String(d.access_token) };
  } catch (e) {
    return { token: null, blad: e instanceof Error ? e.message : "błąd sieci" };
  }
}

async function wierszTokenu() {
  const sb = sbService();
  if (!sb) return null;
  const { data } = await sb.from("allegro_auth").select("access_token, refresh_token, expires_at").eq("id", 1).maybeSingle();
  return data as { access_token?: string; refresh_token?: string; expires_at?: string } | null;
}

/** Czas wygaśnięcia zapisany w samym tokenie (JWT „exp", ms) — Allegro sprawdza właśnie jego. */
export function wygasaTokenJwt(token: string): number | null {
  const czesc = token.split(".")[1];
  if (!czesc) return null;
  try {
    const json = JSON.parse(Buffer.from(czesc.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")) as { exp?: unknown };
    return typeof json.exp === "number" ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

const ZAPAS_MS = 5 * 60 * 1000; // odśwież 5 min przed końcem, żeby długa synchronizacja nie trafiła na wygaśnięcie

const waznyAccess = (w: { access_token?: string; expires_at?: string } | null) => {
  if (!w?.access_token || !w.expires_at || new Date(w.expires_at).getTime() <= Date.now()) return false;
  const exp = wygasaTokenJwt(w.access_token);
  return exp === null || exp - ZAPAS_MS > Date.now();
};

/**
 * Ważny access_token (odświeżany automatycznie) lub null, gdy brak połączenia.
 * `wymus` — Allegro odrzuciło token (401), choć według zapisanej daty był ważny: odśwież mimo to.
 */
export async function aktualnyToken(opcje: { wymus?: boolean; odrzucony?: string } = {}): Promise<string | null> {
  // Przy wymuszeniu: token odrzucony przez Allegro nie jest ważny, ale inny (świeższy, np. z równoległego odświeżenia) — tak.
  const uzywalny = (x: Awaited<ReturnType<typeof wierszTokenu>>) =>
    waznyAccess(x) && !(opcje.wymus && (!opcje.odrzucony || x!.access_token === opcje.odrzucony));
  const w = await wierszTokenu();
  if (!w?.refresh_token) return null;
  if (uzywalny(w)) return w.access_token!;
  const r = await odswiez(w.refresh_token);
  if (r.token) {
    await zapiszBladTokenu(null);
    return r.token;
  }
  // Równoległe odświeżenie (np. synchronizacja + panel) mogło już zapisać nową parę — użyj jej.
  const w2 = await wierszTokenu();
  if (uzywalny(w2)) return w2!.access_token!;
  if (w2?.refresh_token && w2.refresh_token !== w.refresh_token) {
    const r2 = await odswiez(w2.refresh_token);
    if (r2.token) return r2.token;
  }
  console.error(`[allegro] nie udało się odświeżyć tokenu: ${r.blad}`);
  await zapiszBladTokenu(r.blad ?? "nieznany błąd");
  return null;
}

export type StanPolaczenia = "brak" | "ok" | "wygaslo";

/** "ok" tylko, gdy da się uzyskać działający token; "wygaslo" — trzeba połączyć ponownie. */
export async function stanPolaczenia(): Promise<{ stan: StanPolaczenia; blad?: string }> {
  const w = await wierszTokenu();
  if (!w?.refresh_token) return { stan: "brak" };
  if (await aktualnyToken()) return { stan: "ok" };
  const sb = sbService();
  const { data } = sb ? await sb.from("ustawienia").select("wartosc").eq("klucz", KLUCZ_BLEDU).maybeSingle() : { data: null };
  return { stan: "wygaslo", blad: (data?.wartosc as { blad?: string } | undefined)?.blad };
}

export async function czyPolaczony(): Promise<boolean> {
  return (await stanPolaczenia()).stan === "ok";
}

// ── Zapytania do API ────────────────────────────────────────────────────

/** Autoryzowane GET do Allegro API. Zwraca sparsowany JSON lub rzuca błąd. */
export async function allegroGet<T = unknown>(sciezka: string): Promise<T> {
  const token = await aktualnyToken();
  if (!token) throw new Error("Brak połączenia z Allegro.");
  const zapytaj = (t: string) =>
    fetch(`${API}${sciezka}`, {
      headers: { Authorization: `Bearer ${t}`, Accept: ACCEPT },
      signal: AbortSignal.timeout(10000), // zawieszone zapytanie nie może zjeść limitu funkcji
    });
  let res = await zapytaj(token);
  if (res.status === 401) {
    // Token wygasł/unieważniony po stronie Allegro, choć według naszej daty był ważny — odśwież i spróbuj raz jeszcze.
    const nowy = await aktualnyToken({ wymus: true, odrzucony: token });
    if (nowy && nowy !== token) res = await zapytaj(nowy);
  }
  if (!res.ok) throw new Error(`Allegro ${sciezka} → ${res.status}: ${await res.text().catch(() => "")}`);
  return (await res.json()) as T;
}
