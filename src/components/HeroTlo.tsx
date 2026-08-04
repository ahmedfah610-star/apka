"use client";

import { useState } from "react";

/**
 * Zdjęcie tła hero (public/img/hero.jpg). Gdy pliku nie ma — nic nie renderuje,
 * więc widać zapasowe tło gradientowe z komponentu Hero.
 */
export function HeroTlo() {
  const [ok, setOk] = useState(true);
  if (!ok) return null;
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/img/hero.jpg"
        alt=""
        aria-hidden
        onError={() => setOk(false)}
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      {/* Zasłona dla czytelności tekstu — mocniejsza po lewej (pod tekstem), dodatkowo lekko od dołu */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, oklch(99% 0.003 90 / 0.97) 0%, oklch(99% 0.003 90 / 0.9) 34%, oklch(99% 0.003 90 / 0.45) 58%, transparent 82%)",
        }}
      />
      <div
        className="absolute inset-0 md:hidden"
        style={{ background: "linear-gradient(180deg, oklch(99% 0.003 90 / 0.55) 0%, transparent 45%)" }}
      />
    </>
  );
}
