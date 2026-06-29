import type { Opinia, TypUslugodawcy, Uslugodawca } from "@/types/domain";

// Klient Google Places API (Text Search + Place Details). Działa wyłącznie po stronie
// serwera (klucz API w GOOGLE_PLACES_API_KEY, bez prefiksu NEXT_PUBLIC_, nigdy nie trafia
// do przeglądarki). Wołany z src/app/api/specjalisci/route.ts.

const ZAPYTANIE: Record<TypUslugodawcy, (miasto: string) => string> = {
  weterynarz: (miasto) => `weterynarz ${miasto}`,
  fryzjer: (miasto) => `fryzjer dla psów i kotów ${miasto}`,
};

interface GoogleTextSearchResult {
  place_id: string;
}

interface GoogleReview {
  author_name: string;
  rating: number;
  text: string;
  relative_time_description?: string;
  time?: number;
}

interface GooglePlaceDetails {
  place_id: string;
  name: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  rating?: number;
  user_ratings_total?: number;
  reviews?: GoogleReview[];
}

const MAKS_WYNIKOW = 10;

export async function szukajUslugodawcow(
  miasto: string,
  typ: TypUslugodawcy,
  apiKey: string
): Promise<Uslugodawca[]> {
  const query = encodeURIComponent(ZAPYTANIE[typ](miasto));
  const urlSzukania = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${apiKey}`;

  const odpowiedzSzukania = await fetch(urlSzukania);
  const danSzukania = (await odpowiedzSzukania.json()) as {
    status: string;
    results?: GoogleTextSearchResult[];
    error_message?: string;
  };

  if (danSzukania.status !== "OK" && danSzukania.status !== "ZERO_RESULTS") {
    throw new Error(`Google Places text search: ${danSzukania.status} ${danSzukania.error_message ?? ""}`);
  }

  const idMiejsc = (danSzukania.results ?? []).slice(0, MAKS_WYNIKOW).map((r) => r.place_id);

  const szczegoly = await Promise.all(idMiejsc.map((placeId) => pobierzSzczegoly(placeId, apiKey)));

  return szczegoly
    .filter((s): s is GooglePlaceDetails => s !== null)
    .map((s) => mapujNaUslugodawce(s, typ, miasto));
}

async function pobierzSzczegoly(placeId: string, apiKey: string): Promise<GooglePlaceDetails | null> {
  const pola = "place_id,name,formatted_address,formatted_phone_number,rating,user_ratings_total,reviews";
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${pola}&language=pl&key=${apiKey}`;

  const odpowiedz = await fetch(url);
  const dane = (await odpowiedz.json()) as { status: string; result?: GooglePlaceDetails };

  if (dane.status !== "OK" || !dane.result) return null;
  return dane.result;
}

function mapujNaUslugodawce(s: GooglePlaceDetails, typ: TypUslugodawcy, miasto: string): Uslugodawca {
  const opinie: Opinia[] = (s.reviews ?? []).map((r) => ({
    autor: r.author_name,
    ocena: r.rating,
    tresc: r.text,
    data: r.time ? new Date(r.time * 1000).toISOString() : new Date().toISOString(),
  }));

  return {
    id: s.place_id,
    typ,
    nazwa: s.name,
    miasto,
    adres: s.formatted_address ?? "",
    telefon: s.formatted_phone_number,
    specjalizacje: [],
    ocenaSrednia: s.rating ?? 0,
    liczbaOpinii: s.user_ratings_total ?? 0,
    opinie,
  };
}
