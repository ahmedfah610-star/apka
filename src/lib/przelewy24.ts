import crypto from "crypto";

// Integracja z Przelewy24 (REST API v1). Bez kluczy sklep działa bez płatności
// online. Wszystkie sekrety pochodzą ze zmiennych środowiskowych.
//
// Wymagane zmienne (panel Przelewy24 → Moje dane / Konfiguracja / API):
//   P24_MERCHANT_ID  – ID sprzedawcy
//   P24_POS_ID       – ID sklepu (zwykle takie samo jak MERCHANT_ID)
//   P24_CRC          – klucz CRC
//   P24_API_KEY      – klucz do API (Secret Id / „klucz do raportów")
//   P24_SANDBOX      – "true" dla środowiska testowego, w innym wypadku produkcja

export interface P24Config {
  merchantId: number;
  posId: number;
  crc: string;
  apiKey: string;
  sandbox: boolean;
}

export interface P24Notyfikacja {
  merchantId: number;
  posId: number;
  sessionId: string;
  amount: number;
  originAmount: number;
  currency: string;
  orderId: number;
  methodId: number;
  statement: string;
  sign: string;
}

export function p24Wlaczony(): boolean {
  return !!(process.env.P24_MERCHANT_ID && process.env.P24_CRC && process.env.P24_API_KEY);
}

export function p24Config(): P24Config | null {
  const merchantId = Number(process.env.P24_MERCHANT_ID);
  const posId = Number(process.env.P24_POS_ID || process.env.P24_MERCHANT_ID);
  const crc = process.env.P24_CRC || "";
  const apiKey = process.env.P24_API_KEY || "";
  if (!merchantId || !posId || !crc || !apiKey) return null;
  const sandbox = String(process.env.P24_SANDBOX || "").toLowerCase() === "true";
  return { merchantId, posId, crc, apiKey, sandbox };
}

function baza(cfg: P24Config): string {
  return cfg.sandbox ? "https://sandbox.przelewy24.pl" : "https://secure.przelewy24.pl";
}

function auth(cfg: P24Config): string {
  return "Basic " + Buffer.from(`${cfg.posId}:${cfg.apiKey}`).toString("base64");
}

// Podpis SHA-384 z JSON-a o ściśle określonej kolejności pól (wymóg P24).
function sha384(obj: Record<string, unknown>): string {
  return crypto.createHash("sha384").update(JSON.stringify(obj)).digest("hex");
}

/** Rejestruje transakcję i zwraca URL do przekierowania klienta. */
export async function p24Rejestruj(p: {
  sessionId: string;
  amount: number; // w groszach
  email: string;
  description: string;
  urlReturn: string;
  urlStatus: string;
}): Promise<{ ok: boolean; url?: string; blad?: string }> {
  const cfg = p24Config();
  if (!cfg) return { ok: false, blad: "Brak konfiguracji Przelewy24" };

  const sign = sha384({
    sessionId: p.sessionId,
    merchantId: cfg.merchantId,
    amount: p.amount,
    currency: "PLN",
    crc: cfg.crc,
  });

  const body = {
    merchantId: cfg.merchantId,
    posId: cfg.posId,
    sessionId: p.sessionId,
    amount: p.amount,
    currency: "PLN",
    description: p.description,
    email: p.email,
    country: "PL",
    language: "pl",
    urlReturn: p.urlReturn,
    urlStatus: p.urlStatus,
    sign,
  };

  try {
    const res = await fetch(`${baza(cfg)}/api/v1/transaction/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: auth(cfg) },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as { data?: { token?: string }; error?: unknown; code?: unknown };
    if (!res.ok || !json?.data?.token) {
      const blad = typeof json?.error === "string" ? json.error : JSON.stringify(json?.error ?? json?.code ?? `HTTP ${res.status}`);
      console.error(`[p24] rejestracja nieudana: ${blad}`);
      return { ok: false, blad: `Przelewy24: ${blad}` };
    }
    return { ok: true, url: `${baza(cfg)}/trnRequest/${json.data.token}` };
  } catch (e) {
    const blad = e instanceof Error ? e.message : "błąd sieci";
    console.error(`[p24] wyjątek rejestracji: ${blad}`);
    return { ok: false, blad };
  }
}

/** Potwierdza transakcję po otrzymaniu powiadomienia (krok obowiązkowy). */
export async function p24Weryfikuj(p: { sessionId: string; orderId: number; amount: number }): Promise<boolean> {
  const cfg = p24Config();
  if (!cfg) return false;

  const sign = sha384({
    sessionId: p.sessionId,
    orderId: p.orderId,
    amount: p.amount,
    currency: "PLN",
    crc: cfg.crc,
  });

  try {
    const res = await fetch(`${baza(cfg)}/api/v1/transaction/verify`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: auth(cfg) },
      body: JSON.stringify({
        merchantId: cfg.merchantId,
        posId: cfg.posId,
        sessionId: p.sessionId,
        amount: p.amount,
        currency: "PLN",
        orderId: p.orderId,
        sign,
      }),
    });
    const json = (await res.json().catch(() => ({}))) as { data?: { status?: string } };
    return res.ok && json?.data?.status === "success";
  } catch (e) {
    console.error(`[p24] wyjątek weryfikacji: ${e instanceof Error ? e.message : ""}`);
    return false;
  }
}

/** Weryfikuje podpis przychodzącego powiadomienia (urlStatus). */
export function p24PodpisNotyfikacjiOk(n: P24Notyfikacja): boolean {
  const cfg = p24Config();
  if (!cfg) return false;
  const oczekiwany = sha384({
    merchantId: n.merchantId,
    posId: n.posId,
    sessionId: n.sessionId,
    amount: n.amount,
    originAmount: n.originAmount,
    currency: n.currency,
    orderId: n.orderId,
    methodId: n.methodId,
    statement: n.statement,
    crc: cfg.crc,
  });
  return oczekiwany === n.sign;
}
