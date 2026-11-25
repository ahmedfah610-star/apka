// Zgłoszenie zakupu do GA4 z serwera (Measurement Protocol) — po potwierdzeniu płatności.
//
// Dlaczego: w przeglądarce zakup zgłasza dopiero strona „Dziękujemy”. Klient, który zapłaci
// w Przelewy24 i nie wróci do sklepu (częste na telefonie), ginął dla GA4 i Google Ads —
// w listopadzie 2026 Google widział ok. połowę opłaconych zamówień.
//
// Zasady:
//  - tylko przy zgodzie na pomiar (z przeglądarki przychodzi wtedy identyfikator GA z cookie _ga),
//    bez zgody nic nie wysyłamy — wtedy działa samo modelowanie Consent Mode z przeglądarki,
//  - ten sam transaction_id co w przeglądarce → GA4 nie liczy zakupu podwójnie,
//  - session_id z sesji, w której klient składał zamówienie → zakup przypisuje się do jej źródła
//    (np. google / cpc), a nie do „(direct)”,
//  - błąd wysyłki nie może zatrzymać obsługi płatności (wywołujący łapie wyjątki; tu limit czasu).

export interface PomiarZamowienia {
  clientId?: string;
  sessionId?: string;
  gclid?: string;
  zgoda?: boolean;
}

const MAX = 120;
const CLIENT_ID = /^\d{5,12}\.\d{5,12}$/;
const SESSION_ID = /^\d{5,12}$/;
const GCLID = /^[A-Za-z0-9_-]{10,200}$/;

/** Oczyszcza dane pomiaru przysłane z przeglądarki (nic poza znanymi polami i formatami). */
export function oczyscPomiar(we: unknown): PomiarZamowienia | undefined {
  if (!we || typeof we !== "object") return undefined;
  const z = we as Record<string, unknown>;
  const s = (v: unknown) => (typeof v === "string" ? v.trim().slice(0, MAX) : "");
  const zgoda = z.zgoda === true;
  const clientId = s(z.clientId);
  const sessionId = s(z.sessionId);
  const gclid = typeof z.gclid === "string" ? z.gclid.trim().slice(0, 200) : "";
  const p: PomiarZamowienia = {
    zgoda,
    clientId: zgoda && CLIENT_ID.test(clientId) ? clientId : undefined,
    sessionId: zgoda && SESSION_ID.test(sessionId) ? sessionId : undefined,
    gclid: GCLID.test(gclid) ? gclid : undefined,
  };
  return p.clientId || p.gclid ? p : undefined;
}

interface PozycjaZam {
  id?: string;
  nazwa?: string;
  cena?: number;
  ilosc?: number;
  rozmiar?: string | null;
  kolor?: string | null;
}

export interface ZamowienieDoGA4 {
  id: string;
  razem: number;
  dostawa: number;
  rabat?: number;
  kod?: string | null;
  pozycje: PozycjaZam[];
  klient?: { pomiar?: PomiarZamowienia; test?: unknown } | null;
}

const grosze = (n: unknown) => Math.round((Number(n) || 0) * 100) / 100;

/** Treść żądania Measurement Protocol (osobno — do testów). Null = nie wysyłamy. */
export function trescZakupuGA4(z: ZamowienieDoGA4): Record<string, unknown> | null {
  const p = z.klient?.pomiar;
  if (!p?.zgoda || !p.clientId || z.klient?.test) return null;
  return {
    client_id: p.clientId,
    events: [
      {
        name: "purchase",
        params: {
          transaction_id: z.id,
          currency: "PLN",
          value: grosze(z.razem),
          shipping: grosze(z.dostawa),
          ...(z.kod ? { coupon: z.kod } : {}),
          ...(z.rabat ? { discount: grosze(z.rabat) } : {}),
          ...(p.sessionId ? { session_id: p.sessionId } : {}),
          engagement_time_msec: 1,
          zrodlo_zgloszenia: "serwer",
          items: (z.pozycje ?? []).map((x) => ({
            item_id: String(x.id ?? ""),
            item_name: String(x.nazwa ?? ""),
            price: grosze(x.cena),
            quantity: Number(x.ilosc) || 1,
            ...(x.rozmiar ? { item_variant: String(x.rozmiar) } : {}),
          })),
        },
      },
    ],
  };
}

/** Wysyła zakup do GA4. Zwraca true, gdy wysłano (GA4 nie potwierdza treści — tylko przyjęcie). */
export async function zglosZakupGA4Serwer(z: ZamowienieDoGA4): Promise<boolean> {
  const sekret = process.env.GA4_API_SECRET;
  const pomiarId = process.env.NEXT_PUBLIC_GA_ID || "G-RG4NHT446C";
  if (!sekret) return false;
  const tresc = trescZakupuGA4(z);
  if (!tresc) return false;
  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(pomiarId)}&api_secret=${encodeURIComponent(sekret)}`;
  try {
    const r = await fetch(url, { method: "POST", body: JSON.stringify(tresc), signal: AbortSignal.timeout(4000) });
    if (!r.ok) console.error(`[ga4] zakup ${z.id}: odpowiedź ${r.status}`);
    return r.ok;
  } catch (e) {
    console.error(`[ga4] zakup ${z.id}: ${e instanceof Error ? e.message : e}`);
    return false;
  }
}
