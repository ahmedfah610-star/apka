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
    if (!(await zapiszToken(String(d.access_token), String(d.refresh_token), Number(d.expires_in) || 3600))) {
      return { ok: false, blad: "Allegro dało dostęp, ale nie udało się go zapisać w bazie — spróbuj jeszcze raz." };
    }
    await zapiszBladTokenu(null);
    await zapiszZdarzenie("Połączono z Allegro");
    return { ok: true };
  }
  // Allegro zwraca 400 z error=authorization_pending / slow_down do czasu potwierdzenia.
  if (d.error === "authorization_pending" || d.error === "slow_down") return { ok: false, oczekuje: true };
  return { ok: false, blad: String(d.error_description || d.error || `Allegro token ${res.status}`) };
}

// ── Token: przechowywanie i odświeżanie ─────────────────────────────────

async function zapiszToken(access: string, refresh: string, expiresIn: number): Promise<boolean> {
  const sb = sbService();
  if (!sb) return false;
  const wiersz = {
    id: 1,
    access_token: access,
    refresh_token: refresh,
    expires_at: new Date(Date.now() + (expiresIn - 60) * 1000).toISOString(),
    zaktualizowano: new Date().toISOString(),
  };
  // Nowej pary NIE wolno zgubić (stary refresh token przestaje działać po 60 s) — jedna ponowna próba.
  for (let proba = 0; proba < 2; proba++) {
    const { error } = (await sb.from("allegro_auth").upsert(wiersz)) ?? { error: null };
    if (!error) return true;
    console.error(`[allegro] zapis tokenu nieudany: ${error.message}`);
  }
  return false;
}

// Ostatni błąd odświeżenia tokenu (do panelu) — bez samych tokenów.
const KLUCZ_BLEDU = "allegro:blad-tokenu";
const KLUCZ_HISTORII = "allegro:historia-tokenu";
const KLUCZ_BLOKADY = "allegro:odswiezanie";

/** Allegro wkleja tokeny (JWT) do opisów błędów — nie pokazujemy ich w panelu. */
export const bezTokenow = (t: string) => t.replace(/eyJ[\w-]*(\.[\w-]*){0,2}/g, "[token]");

async function zapiszBladTokenu(blad: string | null): Promise<void> {
  const sb = sbService();
  if (!sb) return;
  if (blad === null) await sb.from("ustawienia").delete().eq("klucz", KLUCZ_BLEDU);
  else await sb.from("ustawienia").upsert({ klucz: KLUCZ_BLEDU, wartosc: { blad: bezTokenow(blad), czas: new Date().toISOString() }, zaktualizowano: new Date().toISOString() });
}

export interface ZdarzenieTokenu {
  czas: string;
  co: string;
}

/** Krótka historia odświeżeń (ostatnie 15) — w panelu przy „Połączenie wygasło", żeby było widać, co się stało. */
async function zapiszZdarzenie(co: string): Promise<void> {
  const sb = sbService();
  if (!sb) return;
  try {
    const { data } = await sb.from("ustawienia").select("wartosc").eq("klucz", KLUCZ_HISTORII).maybeSingle();
    const lista = Array.isArray(data?.wartosc) ? (data!.wartosc as ZdarzenieTokenu[]) : [];
    const nowa = [{ czas: new Date().toISOString(), co: bezTokenow(co).slice(0, 200) }, ...lista].slice(0, 15);
    await sb.from("ustawienia").upsert({ klucz: KLUCZ_HISTORII, wartosc: nowa, zaktualizowano: new Date().toISOString() });
  } catch {
    /* historia jest tylko pomocnicza */
  }
}

export async function historiaTokenu(): Promise<ZdarzenieTokenu[]> {
  const sb = sbService();
  if (!sb) return [];
  const { data } = await sb.from("ustawienia").select("wartosc").eq("klucz", KLUCZ_HISTORII).maybeSingle();
  return Array.isArray(data?.wartosc) ? (data!.wartosc as ZdarzenieTokenu[]) : [];
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
      return { token: null, blad: bezTokenow(`Allegro ${res.status}: ${String(d.error_description || d.error || "odmowa odświeżenia")}`).slice(0, 300) };
    }
    // Refresh token Allegro jest jednorazowy (stary działa jeszcze 60 s) — nowy MUSI się zapisać.
    const zapisany = await zapiszToken(String(d.access_token), String(d.refresh_token || refresh), Number(d.expires_in) || 3600);
    await zapiszZdarzenie(zapisany ? "Odświeżono klucz" : "Odświeżono klucz, ale NIE udało się go zapisać w bazie");
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

const czekaj = (ms: number) => new Promise((r) => setTimeout(r, ms));
const BLOKADA_MS = 25000; // dłużej żadne odświeżenie nie trwa (timeout zapytania 10 s)

/** Blokada w bazie: tylko jeden proces naraz (cron, panel, kilka wątków synchronizacji) odświeża klucz. */
async function zalozBlokade(): Promise<boolean> {
  const sb = sbService();
  if (!sb) return true;
  const teraz = new Date().toISOString();
  const { error } = await sb.from("ustawienia").insert({ klucz: KLUCZ_BLOKADY, wartosc: { czas: teraz }, zaktualizowano: teraz });
  if (!error) return true;
  // Zajęta — chyba że to pozostałość po przerwanej funkcji.
  const { data } = await sb.from("ustawienia").select("wartosc").eq("klucz", KLUCZ_BLOKADY).maybeSingle();
  const czas = (data?.wartosc as { czas?: string } | undefined)?.czas;
  if (!data || (czas && Date.now() - new Date(czas).getTime() > BLOKADA_MS)) {
    await sb.from("ustawienia").delete().eq("klucz", KLUCZ_BLOKADY);
    const { error: e2 } = await sb.from("ustawienia").insert({ klucz: KLUCZ_BLOKADY, wartosc: { czas: teraz }, zaktualizowano: teraz });
    return !e2;
  }
  return false;
}

async function zdejmijBlokade(): Promise<void> {
  const sb = sbService();
  if (sb) await sb.from("ustawienia").delete().eq("klucz", KLUCZ_BLOKADY);
}

/** Token z bazy, który można użyć (ważny i nie ten, który Allegro właśnie odrzuciło). */
const uzywalny = (w: Awaited<ReturnType<typeof wierszTokenu>>, odrzucony?: string) =>
  waznyAccess(w) && (!odrzucony || w!.access_token !== odrzucony);

async function odswiezZBlokada(odrzucony?: string): Promise<string | null> {
  let mam = await zalozBlokade();
  if (!mam) {
    // Ktoś inny właśnie odświeża — czekamy na jego nowy klucz zamiast zużywać ten sam refresh token.
    for (let i = 0; i < 24 && !mam; i++) {
      await czekaj(500);
      const w = await wierszTokenu();
      if (uzywalny(w, odrzucony)) return w!.access_token!;
      if (i % 4 === 3) mam = await zalozBlokade();
    }
    if (!mam) return null;
  }
  try {
    // Odczyt pod blokadą — mogło się już odświeżyć, zanim ją dostaliśmy.
    const w = await wierszTokenu();
    if (!w?.refresh_token) return null;
    if (uzywalny(w, odrzucony)) return w.access_token!;
    const r = await odswiez(w.refresh_token);
    if (r.token) {
      await zapiszBladTokenu(null);
      return r.token;
    }
    const w2 = await wierszTokenu();
    if (uzywalny(w2, odrzucony)) return w2!.access_token!;
    console.error(`[allegro] nie udało się odświeżyć tokenu: ${r.blad}`);
    await zapiszZdarzenie(`Odmowa odświeżenia — ${r.blad ?? "nieznany błąd"}`);
    await zapiszBladTokenu(r.blad ?? "nieznany błąd");
    return null;
  } finally {
    await zdejmijBlokade();
  }
}

// W obrębie jednej funkcji: równoległe wątki czekają na to samo odświeżenie.
let wToku: Promise<string | null> | null = null;

/**
 * Ważny access_token (odświeżany automatycznie) lub null, gdy brak połączenia.
 * `odrzucony` — token, który Allegro odrzuciło (401), choć według daty był ważny: trzeba nowego.
 */
export async function aktualnyToken(opcje: { odrzucony?: string } = {}): Promise<string | null> {
  const w = await wierszTokenu();
  if (!w?.refresh_token) return null;
  if (uzywalny(w, opcje.odrzucony)) return w.access_token!;
  if (!wToku) wToku = odswiezZBlokada(opcje.odrzucony).finally(() => (wToku = null));
  return wToku;
}

export type StanPolaczenia = "brak" | "ok" | "wygaslo";

/** "ok" tylko, gdy da się uzyskać działający token; "wygaslo" — trzeba połączyć ponownie. */
export async function stanPolaczenia(): Promise<{ stan: StanPolaczenia; blad?: string; historia?: ZdarzenieTokenu[] }> {
  const w = await wierszTokenu();
  if (!w?.refresh_token) return { stan: "brak" };
  if (await aktualnyToken()) return { stan: "ok" };
  const sb = sbService();
  const { data } = sb ? await sb.from("ustawienia").select("wartosc").eq("klucz", KLUCZ_BLEDU).maybeSingle() : { data: null };
  const blad = (data?.wartosc as { blad?: string } | undefined)?.blad;
  // Brak zapisanej odmowy = inny proces akurat odświeża klucz (nie udało się doczekać) — połączenie jest.
  if (!blad) return { stan: "ok" };
  return { stan: "wygaslo", blad: bezTokenow(blad), historia: await historiaTokenu() };
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
    await zapiszZdarzenie(`Allegro odrzuciło klucz (401) — odświeżam`);
    const nowy = await aktualnyToken({ odrzucony: token });
    if (nowy && nowy !== token) res = await zapytaj(nowy);
  }
  if (!res.ok) throw new Error(bezTokenow(`Allegro ${sciezka} → ${res.status}: ${await res.text().catch(() => "")}`).slice(0, 500));
  return (await res.json()) as T;
}
