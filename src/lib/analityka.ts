"use client";

// Pomiar ścieżki zakupu (GA4 e-commerce) i konwersji Google Ads.
// Consent Mode v2, tryb zaawansowany: zdarzenia idą zawsze, a o tym, czy Google zapisuje cookies
// i identyfikatory, decyduje stan zgody (bez zgody — anonimowe sygnały, z których Google szacuje
// konwersje). Dane klienta do konwersji rozszerzonych (e-mail, telefon) — wyłącznie po zgodzie.

type Gtag = (...args: unknown[]) => void;

export interface PozycjaPomiaru {
  id: string;
  nazwa: string;
  cena: number;
  ilosc: number;
  rozmiar?: string | null;
  kolor?: string | null;
  kategoria?: string | null;
}

const KLUCZ_ZGODY = "fasolka-zgoda-cookies";
const KLUCZ_ZAKUPU = "bobas-zakup-oczekujacy";
const KLUCZ_WYSLANYCH = "bobas-zakupy-wyslane";

// Google Ads: konto i konwersja „Zakup sklep kod" (wysyłana dopiero po potwierdzeniu płatności,
// z prawdziwą kwotą zamówienia). To publiczne identyfikatory (widać je w kodzie strony), tak jak
// identyfikator Google Analytics — zmienne środowiskowe pozwalają je podmienić bez zmiany kodu.
export const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || "AW-18533663809";
export const ADS_ETYKIETA_ZAKUPU = process.env.NEXT_PUBLIC_GOOGLE_ADS_ZAKUP || "IqzdCNak2rUdEMGIxYVF";

/** Telefon w formacie E.164 (+48…) — do konwersji rozszerzonych; pusty, gdy to nie 9-cyfrowy polski numer. */
export function telefonE164(t: unknown): string | undefined {
  const cyfry = String(t ?? "").replace(/\D/g, "");
  const nr = cyfry.length === 11 && cyfry.startsWith("48") ? cyfry.slice(2) : cyfry.length === 13 && cyfry.startsWith("0048") ? cyfry.slice(4) : cyfry;
  return nr.length === 9 ? `+48${nr}` : undefined;
}

export function zgodaNaPomiar(): boolean {
  try {
    const raw = localStorage.getItem(KLUCZ_ZGODY);
    return !!raw && JSON.parse(raw)?.wybor === "wszystkie";
  } catch {
    return false;
  }
}

function ciasteczko(nazwa: string): string {
  try {
    const m = document.cookie.match(new RegExp(`(?:^|; )${nazwa.replace(/[.$?*|{}()[\]\\/+^]/g, "\\$&")}=([^;]*)`));
    return m ? decodeURIComponent(m[1]) : "";
  } catch {
    return "";
  }
}

/**
 * Identyfikatory do zgłoszenia zakupu z serwera (lib/ga4Serwer.ts) — wysyłane razem z zamówieniem.
 * Identyfikator GA i sesji istnieją tylko po zgodzie (bez niej Google nie zapisuje cookies).
 * gclid — identyfikator kliknięcia reklamy (z cookie Google Ads albo adresu strony).
 */
export function daneDoPomiaru(): { clientId?: string; sessionId?: string; gclid?: string; zgoda: boolean } {
  if (typeof document === "undefined") return { zgoda: false };
  const zgoda = zgodaNaPomiar();
  // _ga = "GA1.1.<client_id>"
  const ga = ciasteczko("_ga").split(".");
  const clientId = ga.length >= 4 ? `${ga[2]}.${ga[3]}` : undefined;
  // _ga_<ID> = "GS1.1.<session_id>.…" albo nowszy format "GS2.1.s<session_id>$o…"
  const idPomiaru = (process.env.NEXT_PUBLIC_GA_ID || "G-RG4NHT446C").replace(/^G-/, "");
  const sesja = ciasteczko(`_ga_${idPomiaru}`);
  const sessionId = sesja.match(/^GS2\.\d\.s(\d+)/)?.[1] ?? sesja.match(/^GS1\.\d\.(\d+)/)?.[1];
  // _gcl_aw = "GCL.<czas>.<gclid>"
  const gclAw = ciasteczko("_gcl_aw").split(".").slice(2).join(".");
  let gclid = gclAw || undefined;
  try {
    gclid = gclid || new URLSearchParams(window.location.search).get("gclid") || undefined;
  } catch {
    /* ignoruj */
  }
  return { zgoda, ...(zgoda ? { clientId, sessionId } : {}), gclid };
}

type OknoGtag ={ gtag?: Gtag; bobasGa?: boolean; bobasKolejka?: unknown[][] };

// Zdarzenia sprzed konfiguracji GA (skrypt wczytuje się „afterInteractive") czekają w kolejce —
// inicjalizacja w GoogleAnalytics.tsx wysyła je zaraz po `gtag('config', …)`.
function gtag(): Gtag | null {
  if (typeof window === "undefined") return null;
  if ((window.location?.pathname ?? "").startsWith("/admin")) return null;
  const w = window as unknown as OknoGtag;
  if (typeof w.gtag !== "function") return null;
  if (w.bobasGa) return w.gtag;
  return (...args: unknown[]) => {
    (w.bobasKolejka ??= []).push(args);
  };
}

const grosze = (n: number) => Math.round(n * 100) / 100;

function elementy(pozycje: PozycjaPomiaru[]) {
  return pozycje.map((p, i) => ({
    item_id: p.id,
    item_name: p.nazwa,
    item_category: p.kategoria ?? undefined,
    item_variant: [p.kolor, p.rozmiar ? `rozm. ${p.rozmiar}` : null].filter(Boolean).join(" / ") || undefined,
    price: grosze(p.cena),
    quantity: p.ilosc,
    index: i,
  }));
}
const wartosc = (pozycje: PozycjaPomiaru[]) => grosze(pozycje.reduce((s, p) => s + p.cena * p.ilosc, 0));

export function zdarzenie(nazwa: string, parametry: Record<string, unknown>): void {
  gtag()?.("event", nazwa, parametry);
}

export function pomiarProduktu(nazwaZdarzenia: "view_item" | "add_to_cart", p: PozycjaPomiaru): void {
  zdarzenie(nazwaZdarzenia, { currency: "PLN", value: wartosc([p]), items: elementy([p]) });
}

export function pomiarKoszyka(nazwaZdarzenia: "view_cart" | "begin_checkout", pozycje: PozycjaPomiaru[]): void {
  if (!pozycje.length) return;
  zdarzenie(nazwaZdarzenia, { currency: "PLN", value: wartosc(pozycje), items: elementy(pozycje) });
}

/** Przed przejściem do płatności: zapamiętaj zawartość zamówienia (zakup zgłosimy po potwierdzeniu płatności). */
export function zapamietajZakup(d: {
  pozycje: PozycjaPomiaru[];
  dostawa: number;
  rabat: number;
  kod?: string | null;
  email?: string;
  telefon?: string;
}): void {
  try {
    // E-mail i telefon (do konwersji rozszerzonych) zapisujemy tylko przy zgodzie — i kasujemy po zgłoszeniu zakupu.
    const { email, telefon, ...reszta } = d;
    const kontakt = zgodaNaPomiar() ? { email: email?.trim().toLowerCase() || undefined, telefon: telefonE164(telefon) } : {};
    localStorage.setItem(KLUCZ_ZAKUPU, JSON.stringify({ ...reszta, ...kontakt, czas: Date.now() }));
  } catch {
    /* ignoruj */
  }
}

/** Czy ta przeglądarka właśnie składała zamówienie (świeży zapis z koszyka)? */
export function oczekujeZakup(): boolean {
  try {
    const d = JSON.parse(localStorage.getItem(KLUCZ_ZAKUPU) || "{}") as { czas?: number };
    return !!d.czas && Date.now() - d.czas < 2 * 86400000;
  } catch {
    return false;
  }
}

/** Kwota zamówienia z koszyka zapamiętanego przed płatnością (gdy serwer jeszcze nie odpowiedział). */
export function kwotaZapamietanegoZakupu(): number | null {
  try {
    const d = JSON.parse(localStorage.getItem(KLUCZ_ZAKUPU) || "{}") as { pozycje?: PozycjaPomiaru[]; dostawa?: number; rabat?: number; czas?: number };
    if (!d.czas || Date.now() - d.czas > 2 * 86400000 || !d.pozycje?.length) return null;
    return grosze(Math.max(0, wartosc(d.pozycje) - (d.rabat ?? 0)) + (d.dostawa ?? 0));
  } catch {
    return null;
  }
}

/**
 * Zgłasza zakup (GA4 „purchase" + konwersja Google Ads) — raz na zamówienie.
 * Wołane na stronie podziękowania: po potwierdzeniu płatności albo gdy klient opuszcza stronę
 * zaraz po powrocie z Przelewy24, zanim potwierdzenie zdążyło dojść (`beacon` — wysyłka przy zamykaniu).
 */
export function zglosZakup(idZamowienia: string, razem: number, opcje: { beacon?: boolean } = {}): boolean {
  const g = gtag();
  if (!g) return false;
  let wyslane: string[] = [];
  try {
    wyslane = JSON.parse(localStorage.getItem(KLUCZ_WYSLANYCH) || "[]");
  } catch {
    /* ignoruj */
  }
  if (wyslane.includes(idZamowienia)) return true;

  let d: { pozycje?: PozycjaPomiaru[]; dostawa?: number; rabat?: number; kod?: string | null; czas?: number; email?: string; telefon?: string } = {};
  try {
    d = JSON.parse(localStorage.getItem(KLUCZ_ZAKUPU) || "{}");
  } catch {
    /* ignoruj */
  }
  // Zapamiętane pozycje tylko ze świeżej wizyty (do 2 dni) — inaczej sama kwota.
  const pozycje = d.czas && Date.now() - d.czas < 2 * 86400000 ? d.pozycje ?? [] : [];
  const kwota = grosze(razem);

  const transport = opcje.beacon ? { transport_type: "beacon" } : {};
  g("event", "purchase", {
    ...transport,
    transaction_id: idZamowienia,
    currency: "PLN",
    value: kwota,
    shipping: grosze(d.dostawa ?? 0),
    coupon: d.kod || undefined,
    discount: d.rabat ? grosze(d.rabat) : undefined,
    items: elementy(pozycje),
  });
  // Konwersje rozszerzone: Google sam haszuje dane (SHA-256) przed wysłaniem; tylko po zgodzie.
  const swiezy = !!d.czas && Date.now() - d.czas < 2 * 86400000;
  if (swiezy && zgodaNaPomiar() && (d.email || d.telefon)) {
    g("set", "user_data", { ...(d.email ? { email: d.email } : {}), ...(d.telefon ? { phone_number: d.telefon } : {}) });
  }
  if (ADS_ID && ADS_ETYKIETA_ZAKUPU) {
    g("event", "conversion", { ...transport, send_to: `${ADS_ID}/${ADS_ETYKIETA_ZAKUPU}`, value: kwota, currency: "PLN", transaction_id: idZamowienia });
  }
  try {
    localStorage.setItem(KLUCZ_WYSLANYCH, JSON.stringify([...wyslane, idZamowienia].slice(-50)));
    localStorage.removeItem(KLUCZ_ZAKUPU);
  } catch {
    /* ignoruj */
  }
  return true;
}
