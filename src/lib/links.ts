// Jedno miejsce odpowiedzialne za budowanie linków do sklepów / fallback i doklejanie
// parametrów UTM/afiliacyjnych. Gdy podłączymy realny feed afiliacyjny (np. Awin,
// TradeDoubler), to właśnie tutaj podmieniamy logikę — reszta aplikacji się nie zmienia.

const SEARCH_URLS: Record<string, (query: string) => string> = {
  Zooplus: (q) => `https://www.zooplus.pl/szukaj?q=${q}`,
  Kakadu: (q) => `https://kakadu.pl/szukaj?q=${q}`,
  "Animals.pl": (q) => `https://www.animals.pl/szukaj?q=${q}`,
};

/** Link wyszukiwania w danym sklepie, a jeśli sklep nieznany — wyszukiwanie na Ceneo. */
export function buildFallbackUrl(shop: string, foodName: string): string {
  const query = encodeURIComponent(foodName);
  const builder = SEARCH_URLS[shop];
  if (builder) return builder(query);
  return `https://www.ceneo.pl/;szukaj-${query}`;
}

/** Dokleja parametry UTM/afiliacyjne do dowolnego linku w jednym, wspólnym miejscu. */
export function withTrackingParams(url: string, source = "mojalapa"): string {
  try {
    const u = new URL(url);
    u.searchParams.set("utm_source", source);
    u.searchParams.set("utm_medium", "porownywarka");
    u.searchParams.set("utm_campaign", "wyniki_dopasowania");
    return u.toString();
  } catch {
    // jeśli link nie jest poprawnym URL-em, zwracamy go bez zmian
    return url;
  }
}
