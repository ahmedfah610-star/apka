"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const KLUCZ = "fasolka-zgoda-cookies";

// Baner zgody na cookies (RODO / ePrivacy). Odrzucenie jest tak samo łatwe jak akceptacja.
// Zapisuje wybór w localStorage; realne skrypty analityczne/marketingowe wczytuj dopiero po zgodzie.
export function BannerCookies() {
  const [widoczny, setWidoczny] = useState(false);
  const panel = (usePathname() ?? "").startsWith("/admin"); // w panelu admina baner nie jest potrzebny

  useEffect(() => {
    try {
      if (!localStorage.getItem(KLUCZ)) setWidoczny(true);
    } catch {
      /* ignoruj */
    }
  }, []);

  function zapisz(wybor: "wszystkie" | "niezbedne") {
    try {
      localStorage.setItem(KLUCZ, JSON.stringify({ wybor, data: new Date().toISOString() }));
    } catch {
      /* ignoruj */
    }
    // Powiadom Google Analytics o wyborze (start/stop bez przeładowania).
    try {
      window.dispatchEvent(new CustomEvent("zgoda-cookies", { detail: wybor }));
    } catch {
      /* ignoruj */
    }
    setWidoczny(false);
  }

  if (!widoczny || panel) return null;

  // Na telefonie zwięźle (krótki tekst, przyciski obok siebie) — baner nie zasłania produktu.
  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] border-t-[3px] border-akcent bg-white shadow-[0_-12px_44px_-8px_rgba(0,0,0,0.4)]">
      <div className="mx-auto flex max-w-content flex-col gap-3 px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3.5 sm:px-6 md:flex-row md:items-center md:justify-between md:gap-4 md:py-5">
        <p className="text-[13px] leading-snug text-ink md:max-w-2xl md:text-[13.5px] md:leading-relaxed">
          <span className="mr-1 font-bold">🍪 Szanujemy Twoją prywatność.</span>
          <span className="text-ink-2 md:hidden">
            Cookies niezbędne działają zawsze, analityczne i marketingowe tylko za Twoją zgodą.{" "}
            <Link href="/cookies" className="text-ink underline underline-offset-2">Szczegóły</Link>
          </span>
          <span className="hidden text-ink-2 md:inline">
            Używamy plików cookies niezbędnych do działania sklepu (m.in. koszyk). Cookies analityczne lub marketingowe
            włączymy wyłącznie za Twoją zgodą. Możesz zaakceptować wszystkie lub ograniczyć się do niezbędnych — szczegóły w{" "}
            <Link href="/cookies" className="text-ink underline underline-offset-2 hover:text-akcent">Polityce cookies</Link>.
          </span>
        </p>
        <div className="grid shrink-0 grid-cols-2 gap-2 md:flex">
          <button
            onClick={() => zapisz("niezbedne")}
            className="rounded-lg border border-linia-2 px-4 py-2.5 text-[13px] font-semibold text-ink transition-colors hover:border-ink"
          >
            Tylko niezbędne
          </button>
          <button
            onClick={() => zapisz("wszystkie")}
            className="rounded-lg bg-ink px-4 py-2.5 text-[13.5px] font-bold text-white transition-colors hover:bg-akcent md:px-5 md:text-[14.5px]"
          >
            Akceptuję wszystkie
          </button>
        </div>
      </div>
    </div>
  );
}
