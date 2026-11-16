"use client";

import { useEffect } from "react";
import { kwotaZapamietanegoZakupu, oczekujeZakup, zglosZakup } from "@/lib/analityka";

const OPLACONE = ["oplacone", "wyslane", "nowe"];
const OCZEKUJE = "oczekuje_na_platnosc";

const MAX_WIEK_MS = 3 * 86400000; // starsze zamówienia (np. link otwarty po tygodniu) nie są nową konwersją

/**
 * Strona podziękowania: zgłasza zakup do GA4 / Google Ads.
 *
 * 1) Gdy serwer potwierdzi płatność (webhook Przelewy24 bywa opóźniony — czekamy do ~3 min).
 * 2) Gdy klient wraca z Przelewy24 i zamyka stronę / przechodzi do innej aplikacji, ZANIM
 *    potwierdzenie doszło (typowe po BLIK-u) — wtedy zgłaszamy od razu (wysyłka „beacon”),
 *    bo inaczej ta sprzedaż przepadała dla Google Ads. Warunek: zamówienie nie jest anulowane
 *    i ta przeglądarka właśnie je składała. Klient, który zostaje na stronie i widzi
 *    „płatność niepotwierdzona”, nie jest liczony, dopóki płatność nie dojdzie.
 *
 * Działa także po płatności z linku w mailu i w innej przeglądarce; bez zgody na cookies —
 * w trybie bez cookies (Consent Mode). Powtórne wejście nie dubluje: zglosZakup pamięta wysłane,
 * a Google odrzuca ten sam transaction_id.
 */
export function ZglosZakup({ id }: { id: string }) {
  useEffect(() => {
    if (!id) return;
    let koniec = false;
    let zgloszone = false;
    let proby = 0;
    // Ostatni znany stan z serwera; „null” = jeszcze nie wiemy (np. klient wyszedł w pierwszej sekundzie).
    let status: string | null = null;
    let kwota: number | null = null;
    let zaStare = false;
    // Zamówienie złożone w tej przeglądarce przed chwilą (koszyk zapamiętany przed płatnością).
    const swiezeZTejPrzegladarki = oczekujeZakup();

    const zglos = (razem: number, beacon = false) => {
      if (zgloszone) return;
      zgloszone = zglosZakup(id, razem, { beacon });
    };

    const przyWyjsciu = () => {
      if (zgloszone || zaStare || !swiezeZTejPrzegladarki) return;
      if (status !== null && status !== OCZEKUJE) return; // anulowane / nieznane — nie liczymy
      const razem = kwota ?? kwotaZapamietanegoZakupu();
      if (razem === null) return;
      zglos(razem, true);
    };
    const naZmianeWidocznosci = () => {
      if (document.visibilityState === "hidden") przyWyjsciu();
    };
    window.addEventListener("pagehide", przyWyjsciu);
    document.addEventListener("visibilitychange", naZmianeWidocznosci);

    const sprawdz = async () => {
      if (koniec || zgloszone) return;
      proby++;
      try {
        const r = await fetch(`/api/zamowienie-status?id=${encodeURIComponent(id)}`, { cache: "no-store" });
        const d = (await r.json()) as { ok?: boolean; status?: string; razem?: number; utworzono?: string };
        if (d.ok && d.utworzono && Date.now() - new Date(d.utworzono).getTime() > MAX_WIEK_MS) {
          zaStare = true;
          return;
        }
        if (d.ok && d.status) {
          status = d.status;
          if (typeof d.razem === "number") kwota = d.razem;
        }
        if (d.ok && d.status && OPLACONE.includes(d.status) && typeof d.razem === "number") {
          zglos(d.razem);
          return;
        }
        if (d.ok && d.status && d.status !== OCZEKUJE) return; // anulowane itp. — koniec
        if (!r.ok && r.status !== 429) return;
      } catch {
        /* spróbuj ponownie */
      }
      if (proby < 36) setTimeout(sprawdz, proby < 10 ? 3000 : 6000);
    };
    sprawdz();
    return () => {
      koniec = true;
      // Wyjście ze strony podziękowania w obrębie sklepu (np. „Wróć do sklepu”) — to też opuszczenie strony.
      if (process.env.NODE_ENV === "production") przyWyjsciu();
      window.removeEventListener("pagehide", przyWyjsciu);
      document.removeEventListener("visibilitychange", naZmianeWidocznosci);
    };
  }, [id]);
  return null;
}
