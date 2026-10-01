"use client";

import { useEffect, useState } from "react";
import { DOMYSLNA_DOSTAWA, type UstawieniaDostawy } from "@/lib/dostawa";

// Jeden odczyt ustawień dostawy na kartę (koszyk, zamówienie, edycja). Do czasu wczytania —
// wartości z kodu, więc nic nie „skacze" przy złym łączu.
let obietnica: Promise<UstawieniaDostawy | null> | null = null;

export function pobierzDostaweKlient(): Promise<UstawieniaDostawy | null> {
  if (!obietnica) {
    obietnica = fetch("/api/dostawa", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((d) => {
        if (!d) obietnica = null;
        return d;
      });
  }
  return obietnica;
}

export function useDostawa(): UstawieniaDostawy {
  const [u, setU] = useState<UstawieniaDostawy>(DOMYSLNA_DOSTAWA);
  useEffect(() => {
    let aktywny = true;
    pobierzDostaweKlient().then((d) => aktywny && d && setU(d));
    return () => {
      aktywny = false;
    };
  }, []);
  return u;
}
