"use client";

// Anonimowe zdarzenie dla licznika produktów (bez cookies). sendBeacon nie blokuje strony.
export function licz(id: string, typ: "w" | "k"): void {
  try {
    if (typeof navigator === "undefined" || (navigator as Navigator & { webdriver?: boolean }).webdriver) return;
    const body = JSON.stringify({ id, typ });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/licznik", new Blob([body], { type: "application/json" }));
    else void fetch("/api/licznik", { method: "POST", body, keepalive: true });
  } catch {
    /* ignoruj */
  }
}
