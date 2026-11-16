"use client";

import { useEffect } from "react";
import { zglosZakup } from "@/lib/analityka";

const OPLACONE = ["oplacone", "wyslane", "nowe"];

const MAX_WIEK_MS = 3 * 86400000; // starsze zamówienia (np. link otwarty po tygodniu) nie są nową konwersją

/**
 * Strona podziękowania: zgłasza zakup do GA4 / Google Ads, gdy serwer potwierdzi płatność
 * (webhook Przelewy24 bywa opóźniony — czekamy do ~3 min). Działa także po płatności z linku
 * w mailu i w innej przeglądarce; bez zgody na cookies — w trybie bez cookies (Consent Mode).
 * Powtórne wejście nie dubluje: zglosZakup pamięta wysłane, a Google odrzuca ten sam transaction_id.
 */
export function ZglosZakup({ id }: { id: string }) {
  useEffect(() => {
    if (!id) return;
    let koniec = false;
    let proby = 0;
    const sprawdz = async () => {
      if (koniec) return;
      proby++;
      try {
        const r = await fetch(`/api/zamowienie-status?id=${encodeURIComponent(id)}`, { cache: "no-store" });
        const d = (await r.json()) as { ok?: boolean; status?: string; razem?: number; utworzono?: string };
        if (d.ok && d.utworzono && Date.now() - new Date(d.utworzono).getTime() > MAX_WIEK_MS) return;
        if (d.ok && d.status && OPLACONE.includes(d.status) && typeof d.razem === "number") {
          zglosZakup(id, d.razem);
          return;
        }
        if (!r.ok && r.status !== 429) return;
      } catch {
        /* spróbuj ponownie */
      }
      if (proby < 36) setTimeout(sprawdz, proby < 10 ? 3000 : 6000);
    };
    sprawdz();
    return () => {
      koniec = true;
    };
  }, [id]);
  return null;
}
