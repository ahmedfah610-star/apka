// Porządkowanie opisów z Allegro do wyświetlenia w sklepie. Sprzedawca pisał je
// pod Allegro: „ZOBACZ NASZE INNE AUKCJE :)", „Zapraszamy do innych aukcji gdzie
// mamy dostępne inne rozmiary oraz kolory", „KOLORY DOSTĘPNE NA INNYCH AUKCJACH".
// W sklepie nie ma aukcji — takie zdania wprowadzają w błąd. Do tego „�" (emoji
// zepsute przy kopiowaniu). Funkcje czyste, deterministyczne.

// Całe zdanie/nagłówek zawierające „aukcj…" (bez przechodzenia przez tagi HTML),
// razem z końcowym „:)" i kropką.
const ZDANIE_O_AUKCJACH = /[^.!?\n<>]*aukcj[^.!?\n<>]*[.!?]*/gi;
const ZEPSUTY_ZNAK = /�\s*/g;

/** Opis tekstowy (lista, wyszukiwarka, feed, meta). */
export function oczyscTekstOpisu(t: string | null | undefined): string | undefined {
  if (!t) return t ?? undefined;
  return t
    .replace(ZDANIE_O_AUKCJACH, "")
    .replace(ZEPSUTY_ZNAK, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Opis HTML (strona produktu). Usuwa też elementy, które zostały puste. */
export function oczyscHtmlOpisu(h: string | null | undefined): string | null {
  if (!h) return h ?? null;
  let s = h.replace(ZDANIE_O_AUKCJACH, "").replace(ZEPSUTY_ZNAK, "");
  const pusty = /<(h[1-6]|p|b|strong|em|i|u|span|li|ul|ol)\b[^>]*>(?:\s|&nbsp;|:\)|<br\s*\/?>)*<\/\1>/gi;
  // Kilka przebiegów: po usunięciu <b></b> może zostać puste <h1></h1>.
  for (let i = 0, poprz = ""; i < 4 && s !== poprz; i++) {
    poprz = s;
    s = s.replace(pusty, "");
  }
  return s.replace(/\n{3,}/g, "\n\n").trim();
}
