"use client";

import type { Produkt } from "@/data/produkty";

// Jeden wspólny odczyt katalogu na kartę przeglądarki (koszyk, ulubione, wyszukiwarka, strony).
let obietnica: Promise<Produkt[] | null> | null = null;

/** Aktualny katalog sklepu albo null, gdy nie udało się go pobrać (wtedy spróbujemy ponownie). */
export function pobierzKatalog(): Promise<Produkt[] | null> {
  if (!obietnica) {
    obietnica = fetch("/api/katalog")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => (Array.isArray(d?.items) && d.items.length ? (d.items as Produkt[]) : null))
      .catch(() => null)
      .then((k) => {
        if (!k) obietnica = null;
        return k;
      });
  }
  return obietnica;
}
