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
      {/* Zasłona dla czytelności tekstu po lewej */}
      <div className="absolute inset-0 bg-gradient-to-r from-tlo/90 via-tlo/55 to-tlo/10" />
    </>
  );
}
