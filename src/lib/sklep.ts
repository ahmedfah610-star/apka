// Przełącznik przerwy technicznej. Gdy true — składanie zamówień jest
// wstrzymane (notka w koszyku/checkoutcie + blokada wysyłki zamówienia,
// także po stronie API). Aby PRZYWRÓCIĆ zamówienia: zmień na false i wdroż.
export const ZAMOWIENIA_WYLACZONE = true;

export const KOMUNIKAT_PRZERWY =
  "Składanie zamówień jest chwilowo wyłączone z powodu prac technicznych. Wrócimy najszybciej, jak to możliwe — przepraszamy za utrudnienia.";
