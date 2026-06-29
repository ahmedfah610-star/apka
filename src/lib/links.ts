// Jedno miejsce odpowiedzialne za budowanie linków do sklepów / fallback i doklejanie
// parametrów UTM/afiliacyjnych. Gdy podłączymy realny feed afiliacyjny (np. Awin,
// TradeDoubler), to właśnie tutaj podmieniamy logikę — reszta aplikacji się nie zmienia.

// Zweryfikowane, realne formaty adresów wyszukiwania (sprawdzone, że zwracają wyniki).
// Sklepy, których formatu nie udało się zweryfikować, dostają fallback do Ceneo —
// to też realny, działający agregator ofert, więc link nigdy nie jest "wymyślony".
const SEARCH_URLS: Record<string, (query: string) => string> = {
  Zooplus: (q) => `https://www.zooplus.pl/search?q=${q}`,
};

/** Link wyszukiwania w danym sklepie, a jeśli sklep nieznany/niezweryfikowany — wyszukiwanie na Ceneo. */
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
