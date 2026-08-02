// ---------------------------------------------------------------------------
// Dane produktów sklepu Fasolka — zaimportowane z Allegro (sklep bobas-shopping).
//
// Zdjęcia linkowane bezpośrednio z serwera Allegro (allegroimg.com).
// To wybór poglądowy (~19 produktów z ~240 dostępnych) na potrzeby demo.
// Aby dodać/podmienić produkt: skopiuj wiersz, zmień nazwę/cenę/zdjecie/kategorię.
// zdjecie = null  =>  pokaże się kolorowy placeholder.
// ---------------------------------------------------------------------------

export type Kategoria = "dziewczynki" | "chlopcy" | "niemowleta";
export type Wiek = "0-2" | "2-6" | "6-12";

export interface Produkt {
  id: string;
  nazwa: string;
  cena: number;
  kategoria: Kategoria;
  wiek: Wiek;
  wiekLabel: string;
  badge?: string | null;
  rozmiary?: string[];
  /** Adres URL zdjęcia (np. z allegroimg.com). null = placeholder. */
  zdjecie?: string | null;
  /** Odcień koloru placeholdera, gdy brak zdjęcia (0–360). */
  hue: number;
}

export const KATEGORIE_LABEL: Record<Kategoria | "wszystkie", string> = {
  wszystkie: "Wszystkie produkty",
  dziewczynki: "Dziewczynki",
  chlopcy: "Chłopcy",
  niemowleta: "Niemowlęta",
};

export const WSZYSTKIE_ROZMIARY = ["62", "74", "86", "92", "104", "116", "128"];

export const PRODUKTY: Produkt[] = [
  { id: "bluzka-t-shirt-bawelniana", nazwa: "Bluzka T-shirt bawełniana", cena: 19.99, kategoria: "dziewczynki", wiek: "6-12", wiekLabel: "6-12 lat", badge: "NOWOŚĆ", zdjecie: "https://a.allegroimg.com/original/1104ae/ffcc0a36486cb409e8822d8e3f51", hue: 340 },
  { id: "legginsy-prazkowane-wysoki-stan", nazwa: "Legginsy prążkowane wysoki stan", cena: 25.99, kategoria: "dziewczynki", wiek: "6-12", wiekLabel: "6-12 lat", badge: null, zdjecie: "https://a.allegroimg.com/original/11c67a/df8febcc45ed834f951340e1e820", hue: 340 },
  { id: "legginsy-welurowe-ocieplane", nazwa: "Legginsy welurowe ocieplane", cena: 25.0, kategoria: "dziewczynki", wiek: "6-12", wiekLabel: "6-12 lat", badge: null, zdjecie: "https://a.allegroimg.com/original/117cac/84f318b54734846c69bb8f8df5c3", hue: 340 },
  { id: "kamizelka-sweterkowa", nazwa: "Kamizelka sweterkowa", cena: 25.0, kategoria: "dziewczynki", wiek: "2-6", wiekLabel: "2-6 lat", badge: null, zdjecie: "https://a.allegroimg.com/original/1170a6/8fe8fe144a718cdd12912cd7f1c0", hue: 340 },
  { id: "bluza-z-nadrukiem", nazwa: "Bluza z nadrukiem", cena: 9.99, kategoria: "dziewczynki", wiek: "2-6", wiekLabel: "2-6 lat", badge: "-20%", zdjecie: "https://a.allegroimg.com/original/11d87b/c1a49e04452ea89a9805a1eba7d5", hue: 340 },
  { id: "szorty-dresowe", nazwa: "Szorty dresowe", cena: 25.0, kategoria: "dziewczynki", wiek: "6-12", wiekLabel: "6-12 lat", badge: null, zdjecie: "https://a.allegroimg.com/original/1103a6/8b6640e64a0e9ed71a597fdf593d", hue: 340 },
  { id: "dres-2-czesciowy-rozowy", nazwa: "Dres 2-częściowy różowy", cena: 65.0, kategoria: "dziewczynki", wiek: "6-12", wiekLabel: "6-12 lat", badge: "BESTSELLER", zdjecie: "https://a.allegroimg.com/original/11d4d9/f8b7ea5f439da07000997c14257d", hue: 340 },
  { id: "bluzka-w-serduszka", nazwa: "Bluzka w serduszka", cena: 14.99, kategoria: "dziewczynki", wiek: "2-6", wiekLabel: "2-6 lat", badge: null, zdjecie: "https://a.allegroimg.com/original/116229/8641069a4c7283134d6baa2c7214", hue: 340 },
  { id: "spodnie-dresowe-sportowe", nazwa: "Spodnie dresowe sportowe", cena: 38.99, kategoria: "chlopcy", wiek: "6-12", wiekLabel: "6-12 lat", badge: "NOWOŚĆ", zdjecie: "https://a.allegroimg.com/original/115783/d562ee51483b9da4de4c93105897", hue: 230 },
  { id: "spodnie-dresowe-do-przedszkola", nazwa: "Spodnie dresowe do przedszkola", cena: 29.99, kategoria: "chlopcy", wiek: "2-6", wiekLabel: "2-6 lat", badge: null, zdjecie: "https://a.allegroimg.com/original/11481c/df8c2b2f479c86b955d84f477e20", hue: 230 },
  { id: "spodnie-sportowe-z-kieszeniami", nazwa: "Spodnie sportowe z kieszeniami", cena: 38.99, kategoria: "chlopcy", wiek: "6-12", wiekLabel: "6-12 lat", badge: null, zdjecie: "https://a.allegroimg.com/original/113b29/ef0fbb0d4d21b01cc00dc757ace3", hue: 230 },
  { id: "koszulka-chlopieca-t-shirt", nazwa: "Koszulka chłopięca T-shirt", cena: 19.99, kategoria: "chlopcy", wiek: "6-12", wiekLabel: "6-12 lat", badge: null, zdjecie: "https://a.allegroimg.com/original/11d50c/a3c6ce274ce9ae9f274357d3615f", hue: 230 },
  { id: "komplet-chlopiecy-3-czesciowy", nazwa: "Komplet chłopięcy 3-częściowy", cena: 65.0, kategoria: "chlopcy", wiek: "0-2", wiekLabel: "0-2 lata", badge: "BESTSELLER", zdjecie: "https://a.allegroimg.com/original/11946f/0f62f7cb4e5a88f1e92d4c6702c2", hue: 230 },
  { id: "dresik-do-przedszkola", nazwa: "Dresik do przedszkola", cena: 35.0, kategoria: "chlopcy", wiek: "2-6", wiekLabel: "2-6 lat", badge: null, zdjecie: "https://a.allegroimg.com/original/111c42/fae2a4a44e8b8dc11c8b03f2e5ed", hue: 230 },
  { id: "komplet-dresowy-100-bawelna", nazwa: "Komplet dresowy 100% bawełna", cena: 39.99, kategoria: "niemowleta", wiek: "0-2", wiekLabel: "0-2 lata", badge: "NOWOŚĆ", zdjecie: "https://a.allegroimg.com/original/118ba0/94450d37472183e61ecfa5fd3f28", hue: 160 },
  { id: "komplet-dresowy-mis", nazwa: "Komplet dresowy Miś", cena: 39.99, kategoria: "niemowleta", wiek: "0-2", wiekLabel: "0-2 lata", badge: null, zdjecie: "https://a.allegroimg.com/original/118adf/29bdc7004b6cb57cdbe65fe7c26d", hue: 160 },
  { id: "polspiochy-ze-skarpetkami", nazwa: "Półśpiochy ze skarpetkami", cena: 16.99, kategoria: "niemowleta", wiek: "0-2", wiekLabel: "0-2 lata", badge: null, zdjecie: "https://a.allegroimg.com/original/112978/955688f940569413f08f916b9828", hue: 160 },
  { id: "legginsy-niemowlece-prazkowane", nazwa: "Legginsy niemowlęce prążkowane", cena: 19.99, kategoria: "niemowleta", wiek: "0-2", wiekLabel: "0-2 lata", badge: null, zdjecie: "https://a.allegroimg.com/original/11e2d1/db27631f4255aceb0f6b3832d24d", hue: 160 },
  { id: "komplet-dres-3-czesciowy", nazwa: "Komplet dres 3-częściowy", cena: 59.99, kategoria: "niemowleta", wiek: "0-2", wiekLabel: "0-2 lata", badge: "BESTSELLER", zdjecie: "https://a.allegroimg.com/original/116ba0/05f0e4ed44b59d02d51e67d566b9", hue: 160 },
];
