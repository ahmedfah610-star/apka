import type { Oferta } from "@/types/domain";
import { buildFallbackUrl } from "@/lib/links";

// Przykładowe oferty sklepów na etap 1 — później zastąpione realnym feedem afiliacyjnym
// (patrz src/lib/offersService.ts, gdzie wydzielone jest pobieranie ofert).
// affiliateUrl jest tu pusty, więc warstwa serwisowa dorabia fallback (Ceneo / szukaj w sklepie).
interface OfertaSeed extends Omit<Oferta, "affiliateUrl"> {
  affiliateUrl?: string;
}

const RAW_OFFERS: Record<string, OfertaSeed[]> = {
  f1: [
    { foodId: "f1", shop: "Zooplus", price: 289, delivery: 0, inStock: true, fast: true },
    { foodId: "f1", shop: "Kakadu", price: 299, delivery: 9.99, inStock: true, fast: false },
  ],
  f2: [
    { foodId: "f2", shop: "Zooplus", price: 269, delivery: 0, inStock: true, fast: false },
    { foodId: "f2", shop: "Ceneo", price: 279, delivery: 0, inStock: true, fast: true },
  ],
  f3: [
    { foodId: "f3", shop: "Kakadu", price: 229, delivery: 9.99, inStock: true, fast: true },
  ],
  f4: [
    { foodId: "f4", shop: "Zooplus", price: 319, delivery: 0, inStock: true, fast: true },
    { foodId: "f4", shop: "Ceneo", price: 329, delivery: 0, inStock: false, fast: false },
  ],
  f5: [
    { foodId: "f5", shop: "Kakadu", price: 309, delivery: 9.99, inStock: true, fast: false },
  ],
  f6: [
    { foodId: "f6", shop: "Zooplus", price: 6.5, delivery: 0, inStock: true, fast: true },
  ],
  f7: [
    { foodId: "f7", shop: "Zooplus", price: 79, delivery: 0, inStock: true, fast: true },
  ],
  f8: [
    { foodId: "f8", shop: "Kakadu", price: 75, delivery: 9.99, inStock: true, fast: false },
  ],
  f9: [
    { foodId: "f9", shop: "Ceneo", price: 83, delivery: 0, inStock: true, fast: true },
  ],
  f10: [
    { foodId: "f10", shop: "Zooplus", price: 89, delivery: 0, inStock: true, fast: false },
  ],
  f11: [
    { foodId: "f11", shop: "Kakadu", price: 8.5, delivery: 9.99, inStock: true, fast: true },
  ],
};

/** Zwraca oferty dla danej karmy, dopełniając brakujący affiliateUrl fallbackiem. */
export function getOffersForFood(foodId: string, foodName: string): Oferta[] {
  const seeds = RAW_OFFERS[foodId] ?? [];
  return seeds.map((s) => ({
    ...s,
    affiliateUrl: s.affiliateUrl || buildFallbackUrl(s.shop, foodName),
  }));
}
