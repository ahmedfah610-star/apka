// Statusy, z których wpłata zmienia zamówienie w „opłacone" (zdjęcie stanu, maile, licznik kodu).
// „anulowane" — klient zapłacił mimo anulowania (np. starym linkiem): pieniądze są, więc opłacamy.
// Z „oplacone" / „wyslane" / „nowe" (bez płatności online — stan już zdjęty) NIE: powtórzone
// powiadomienie albo druga wpłata nie może cofnąć wysyłki ani drugi raz zdjąć towaru.
const CZEKA_NA_WPLATE = ["oczekuje_na_platnosc", "anulowane"];

export function czekaNaWplate(status: unknown): boolean {
  return CZEKA_NA_WPLATE.includes(String(status));
}
