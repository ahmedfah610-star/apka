// Szacowany termin dostawy — liczony w dniach roboczych od teraz.
// Założenie: nadanie w ~1 dzień roboczy + transit kuriera/paczkomatu 1–2 dni.

const DNI_TYG = ["niedz.", "pon.", "wt.", "śr.", "czw.", "pt.", "sob."];
const MIES = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];

function jestRoboczy(d: Date): boolean {
  const dz = d.getDay();
  return dz !== 0 && dz !== 6; // pomijamy sob. i niedz.
}

/** Dodaje N dni roboczych do daty (pomija weekendy). */
export function dniRoboczePo(od: Date, ile: number): Date {
  const d = new Date(od);
  let dodane = 0;
  while (dodane < ile) {
    d.setDate(d.getDate() + 1);
    if (jestRoboczy(d)) dodane++;
  }
  return d;
}

const fmt = (d: Date) => `${d.getDate()} ${MIES[d.getMonth()]}`;
const dzien = (d: Date) => DNI_TYG[d.getDay()];

/**
 * Szacowany przedział dostawy (min–max dni roboczych od teraz).
 * Zamówienie złożone po 12:00 traktujemy jak nadane następnego dnia roboczego.
 */
export function szacowanaDostawa(teraz: Date = new Date(), min = 2, max = 3): { odISO: string; doISO: string; tekst: string } {
  const przesuniecie = teraz.getHours() >= 12 ? 1 : 0;
  const od = dniRoboczePo(teraz, min + przesuniecie);
  const doD = dniRoboczePo(teraz, max + przesuniecie);
  const tenSamDzien = od.toDateString() === doD.toDateString();
  const tekst = tenSamDzien
    ? `${dzien(od)}, ${fmt(od)}`
    : `${dzien(od)}–${dzien(doD)}, ${fmt(od)}–${fmt(doD)}`;
  return { odISO: od.toISOString(), doISO: doD.toISOString(), tekst };
}
