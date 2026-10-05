"use client";

// Pomiar ścieżki zakupu (GA4 e-commerce) i konwersji Google Ads.
// Zdarzenia wysyłamy WYŁĄCZNIE po zgodzie na cookies analityczne/marketingowe
// (tryb podstawowy Consent Mode v2) — bez zgody każda funkcja tu nic nie robi.

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

export const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || ""; // np. AW-123456789
export const ADS_ETYKIETA_ZAKUPU = process.env.NEXT_PUBLIC_GOOGLE_ADS_ZAKUP || ""; // etykieta konwersji „Zakup"

export function zgodaNaPomiar(): boolean {
  try {
    const raw = localStorage.getItem(KLUCZ_ZGODY);
    return !!raw && JSON.parse(raw)?.wybor === "wszystkie";
  } catch {
    return false;
  }
}

type OknoGtag = { gtag?: Gtag; bobasGa?: boolean; bobasKolejka?: unknown[][] };

// Zdarzenia sprzed konfiguracji GA (skrypt wczytuje się „afterInteractive") czekają w kolejce —
// inicjalizacja w GoogleAnalytics.tsx wysyła je zaraz po `gtag('config', …)`.
function gtag(): Gtag | null {
  if (typeof window === "undefined" || !zgodaNaPomiar()) return null;
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
export function zapamietajZakup(d: { pozycje: PozycjaPomiaru[]; dostawa: number; rabat: number; kod?: string | null }): void {
  try {
    localStorage.setItem(KLUCZ_ZAKUPU, JSON.stringify({ ...d, czas: Date.now() }));
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

/**
 * Zgłasza zakup (GA4 „purchase" + konwersja Google Ads) — raz na zamówienie.
 * Wołane na stronie podziękowania dopiero, gdy serwer potwierdzi opłacenie.
 */
export function zglosZakup(idZamowienia: string, razem: number): boolean {
  const g = gtag();
  if (!g) return false;
  let wyslane: string[] = [];
  try {
    wyslane = JSON.parse(localStorage.getItem(KLUCZ_WYSLANYCH) || "[]");
  } catch {
    /* ignoruj */
  }
  if (wyslane.includes(idZamowienia)) return true;

  let d: { pozycje?: PozycjaPomiaru[]; dostawa?: number; rabat?: number; kod?: string | null; czas?: number } = {};
  try {
    d = JSON.parse(localStorage.getItem(KLUCZ_ZAKUPU) || "{}");
  } catch {
    /* ignoruj */
  }
  // Zapamiętane pozycje tylko ze świeżej wizyty (do 2 dni) — inaczej sama kwota.
  const pozycje = d.czas && Date.now() - d.czas < 2 * 86400000 ? d.pozycje ?? [] : [];
  const kwota = grosze(razem);

  g("event", "purchase", {
    transaction_id: idZamowienia,
    currency: "PLN",
    value: kwota,
    shipping: grosze(d.dostawa ?? 0),
    coupon: d.kod || undefined,
    discount: d.rabat ? grosze(d.rabat) : undefined,
    items: elementy(pozycje),
  });
  if (ADS_ID && ADS_ETYKIETA_ZAKUPU) {
    g("event", "conversion", { send_to: `${ADS_ID}/${ADS_ETYKIETA_ZAKUPU}`, value: kwota, currency: "PLN", transaction_id: idZamowienia });
  }
  try {
    localStorage.setItem(KLUCZ_WYSLANYCH, JSON.stringify([...wyslane, idZamowienia].slice(-50)));
    localStorage.removeItem(KLUCZ_ZAKUPU);
  } catch {
    /* ignoruj */
  }
  return true;
}
