"use client";

import Link from "next/link";
import { useState } from "react";

const LINKI = [
  { href: "/", label: "Strona główna", klucz: "home" },
  { href: "/produkty", label: "Produkty", klucz: "produkty" },
  { href: "/produkty?kategoria=dziewczynki", label: "Dziewczynki" },
  { href: "/produkty?kategoria=chlopcy", label: "Chłopcy" },
  { href: "/produkty?kategoria=niemowleta", label: "Niemowlęta" },
];

export function MenuMobilne({ aktywna }: { aktywna?: "home" | "produkty" }) {
  const [otwarte, setOtwarte] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setOtwarte((o) => !o)}
        aria-label={otwarte ? "Zamknij menu" : "Otwórz menu"}
        aria-expanded={otwarte}
        className="flex h-9 w-9 items-center justify-center text-ink"
      >
        {otwarte ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        )}
      </button>

      {otwarte ? (
        <>
          <div className="fixed inset-0 top-[57px] z-40 bg-black/20" onClick={() => setOtwarte(false)} />
          <nav className="absolute left-0 right-0 top-full z-50 border-b border-linia bg-tlo shadow-[0_18px_40px_-20px_rgba(0,0,0,0.35)]">
            <div className="flex flex-col px-6 py-2">
              {LINKI.map((l) => {
                const on = l.klucz && l.klucz === aktywna;
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOtwarte(false)}
                    className={`border-b border-linia py-3.5 text-[15px] no-underline last:border-b-0 ${
                      on ? "font-bold text-akcent" : "text-ink"
                    }`}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </>
      ) : null}
    </div>
  );
}
