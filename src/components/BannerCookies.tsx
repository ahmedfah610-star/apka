"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const KLUCZ = "fasolka-zgoda-cookies";

// Baner zgody na cookies (RODO / ePrivacy). Odrzucenie jest tak samo łatwe jak akceptacja.
// Zapisuje wybór w localStorage; realne skrypty analityczne/marketingowe wczytuj dopiero po zgodzie.
export function BannerCookies() {
  const [widoczny, setWidoczny] = useState(false);

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
    setWidoczny(false);
  }

  if (!widoczny) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] border-t-[3px] border-akcent bg-white shadow-[0_-12px_44px_-8px_rgba(0,0,0,0.4)]">
      <div className="mx-auto flex max-w-content flex-col gap-4 px-5 py-5 sm:px-6 md:flex-row md:items-center md:justify-between">
        <p className="text-[13.5px] leading-relaxed text-ink md:max-w-2xl">
          <span className="mr-1 font-bold">🍪 Szanujemy Twoją prywatność.</span>
          <span className="text-ink-2">
            Używamy plików cookies, aby sklep działał poprawnie, a za Twoją zgodą także do analityki i marketingu.
            Możesz zaakceptować wszystkie lub ograniczyć się do niezbędnych. Szczegóły w{" "}
            <Link href="/cookies" className="text-ink underline underline-offset-2 hover:text-akcent">Polityce cookies</Link>.
          </span>
        </p>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <button
            onClick={() => zapisz("niezbedne")}
            className="order-2 border border-linia-2 px-5 py-2.5 text-[13px] font-semibold text-ink transition-colors hover:border-ink sm:order-1"
          >
            Tylko niezbędne
          </button>
          <button
            onClick={() => zapisz("wszystkie")}
            className="order-1 bg-ink px-5 py-2.5 text-[13px] font-semibold tracking-wide text-tlo transition-colors hover:bg-akcent sm:order-2"
          >
            Akceptuję wszystkie
          </button>
        </div>
      </div>
    </div>
  );
}
