"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const KLUCZ = "fasolka-zgoda-cookies";

// Google Analytics 4 — ładowane WYŁĄCZNIE po zgodzie na cookies analityczne
// („Akceptuję wszystkie"), zgodnie z RODO/ePrivacy. Identyfikator z env
// NEXT_PUBLIC_GA_ID (np. "G-XXXXXXXXXX"). Brak env lub brak zgody = brak śledzenia.
export function GoogleAnalytics() {
  // Identyfikator GA4. Domyślnie stały (publiczny i tak widoczny w źródle strony);
  // można nadpisać zmienną NEXT_PUBLIC_GA_ID w Vercel.
  const id = process.env.NEXT_PUBLIC_GA_ID || "G-RG4NHT446C";
  const [zgoda, setZgoda] = useState(false);

  useEffect(() => {
    const sprawdz = () => {
      try {
        const raw = localStorage.getItem(KLUCZ);
        setZgoda(!!raw && JSON.parse(raw)?.wybor === "wszystkie");
      } catch {
        setZgoda(false);
      }
    };
    sprawdz();
    // Reaguj na wybór w banerze (bez przeładowania strony).
    window.addEventListener("zgoda-cookies", sprawdz);
    return () => window.removeEventListener("zgoda-cookies", sprawdz);
  }, []);

  if (!id || !zgoda) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
