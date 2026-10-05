"use client";

import { useEffect } from "react";
import { oczekujeZakup, zglosZakup, zgodaNaPomiar } from "@/lib/analityka";

const OPLACONE = ["oplacone", "wyslane", "nowe"];

/**
 * Strona podziękowania: zgłasza zakup do GA4 / Google Ads dopiero, gdy serwer
 * potwierdzi płatność (webhook Przelewy24 może dojść kilka sekund po powrocie klienta).
 * Tylko w przeglądarce, która składała to zamówienie, i tylko po zgodzie na cookies.
 */
export function ZglosZakup({ id }: { id: string }) {
  useEffect(() => {
    if (!id || !zgodaNaPomiar() || !oczekujeZakup()) return;
    let koniec = false;
    let proby = 0;
    const sprawdz = async () => {
      if (koniec) return;
      proby++;
      try {
        const r = await fetch(`/api/zamowienie-status?id=${encodeURIComponent(id)}`, { cache: "no-store" });
        const d = (await r.json()) as { ok?: boolean; status?: string; razem?: number };
        if (d.ok && d.status && OPLACONE.includes(d.status) && typeof d.razem === "number") {
          zglosZakup(id, d.razem);
          return;
        }
        if (!r.ok && r.status !== 429) return;
      } catch {
        /* spróbuj ponownie */
      }
      if (proby < 10) setTimeout(sprawdz, 4000);
    };
    sprawdz();
    return () => {
      koniec = true;
    };
  }, [id]);
  return null;
}
