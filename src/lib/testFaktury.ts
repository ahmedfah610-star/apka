// Zamówienie testowe do sprawdzenia faktur (panel → Zamówienia → „Zamówienie testowe z fakturą").
// Zapis wprost do bazy: bez płatności, bez maili, bez zdejmowania stanów, wartość 0 zł,
// znacznik TEST (poza statystykami, pakowaniem i automatycznymi mailami).

const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/;

export function zamowienieTestoweFaktury(emailWe: unknown): { ok: true; wiersz: Record<string, unknown> } | { ok: false; blad: string } {
  const email = String(emailWe ?? "").trim().toLowerCase().slice(0, 160);
  if (!EMAIL.test(email)) return { ok: false, blad: "Podaj prawidłowy e-mail, na który ma przyjść testowa faktura." };
  return {
    ok: true,
    wiersz: {
      pozycje: [{ id: "test-faktura", nazwa: "Pozycja testowa (sprawdzenie faktury)", cena: 0, ilosc: 1, rozmiar: null, kolor: null, zdjecie: null }],
      suma: 0,
      dostawa: 0,
      razem: 0,
      metoda: "Test · bez płatności",
      status: "oplacone",
      klient: {
        imie: "Test faktury",
        email,
        uwagi: "Zamówienie testowe — sprawdzenie wysyłki faktury. Bez płatności i bez towaru.",
        test: true,
        faktura: { typ: "osoba", nazwa: "Test Faktury", adres: "ul. Testowa 1", kod: "20-001", miasto: "Lublin", kraj: "PL", uwagi: "Faktura testowa" },
      },
    },
  };
}
