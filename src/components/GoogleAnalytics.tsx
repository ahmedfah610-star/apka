"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ADS_ID } from "@/lib/analityka";
import { stanZgod as stan } from "@/lib/zgody";

const KLUCZ = "fasolka-zgoda-cookies";

// Google Analytics 4 (+ opcjonalnie Google Ads) z Consent Mode v2 w trybie podstawowym:
// 1) zawsze najpierw ustawiamy zgody na „odmowa" (wymóg Google w UE),
// 2) skrypt Google wczytujemy WYŁĄCZNIE po zgodzie („Akceptuję wszystkie") i od razu
//    zgłaszamy zgodę („granted"); cofnięcie zgody wysyła „denied" i wyłącza pomiar.
// Identyfikator GA4 z NEXT_PUBLIC_GA_ID (domyślny poniżej), Google Ads z NEXT_PUBLIC_GOOGLE_ADS_ID.
export function GoogleAnalytics() {
  const id = process.env.NEXT_PUBLIC_GA_ID || "G-RG4NHT446C";
  const [zgoda, setZgoda] = useState(false);
  // Panel admina nie jest ruchem sklepu — nie licz go (także po przejściu ze sklepu
  // do panelu bez przeładowania, gdy gtag jest już wczytany).
  const panel = (usePathname() ?? "").startsWith("/admin");
  useEffect(() => {
    (window as unknown as Record<string, boolean>)[`ga-disable-${id}`] = panel;
  }, [panel, id]);

  useEffect(() => {
    const sprawdz = () => {
      let teraz = false;
      try {
        const raw = localStorage.getItem(KLUCZ);
        teraz = !!raw && JSON.parse(raw)?.wybor === "wszystkie";
      } catch {
        teraz = false;
      }
      setZgoda(teraz);
      // Zmiana decyzji w trakcie wizyty → aktualizacja stanu zgód (np. cofnięcie zgody).
      const g = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
      g?.("consent", "update", JSON.parse(stan(teraz ? "granted" : "denied")));
      (window as unknown as Record<string, boolean>)[`ga-disable-${id}`] = !teraz || panel;
    };
    sprawdz();
    window.addEventListener("zgoda-cookies", sprawdz);
    return () => window.removeEventListener("zgoda-cookies", sprawdz);
  }, [id, panel]);

  return (
    <>
      {id && zgoda && !panel ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`
              gtag('consent', 'update', ${stan("granted")});
              gtag('js', new Date());
              gtag('config', '${id}', { anonymize_ip: true });
              ${ADS_ID ? `gtag('config', '${ADS_ID}');` : ""}
              window.bobasGa = true;
              (window.bobasKolejka || []).forEach(function (a) { gtag.apply(null, a); });
              window.bobasKolejka = [];
            `}
          </Script>
        </>
      ) : null}
    </>
  );
}
