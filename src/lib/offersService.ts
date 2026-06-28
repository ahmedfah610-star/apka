import type { Oferta } from "@/types/domain";
import { getOffersForFood } from "@/data/offers";

// Warstwa serwisowa pobierania ofert. Na etapie 1 czyta z lokalnego seeda (src/data/offers.ts).
// Docelowo (etap 3+) ta funkcja zostanie podmieniona na zapytanie do tabeli `offers`
// w Supabase albo na bezpośrednie wywołanie feedu afiliacyjnego (Awin/TradeDoubler) —
// sygnatura funkcji (foodId, foodName) -> Oferta[] ma się nie zmieniać.
export async function fetchOffers(foodId: string, foodName: string): Promise<Oferta[]> {
  return getOffersForFood(foodId, foodName);
}

/** Wybiera najtańszą ofertę liczoną jako cena + dostawa. */
export function pickCheapestOffer(offers: Oferta[]): Oferta | null {
  const dostepne = offers.filter((o) => o.inStock);
  const lista = dostepne.length > 0 ? dostepne : offers;
  if (lista.length === 0) return null;
  return lista.reduce((best, o) =>
    o.price + o.delivery < best.price + best.delivery ? o : best
  );
}
