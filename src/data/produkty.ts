// ---------------------------------------------------------------------------
// Dane produktów sklepu Fasolka.
//
// To JEST miejsce, w które trafiają artykuły przeniesione z Allegro.
// Każdy produkt = jeden obiekt Produkt. Żeby dodać / podmienić ofertę:
//   1. skopiuj jeden blok poniżej,
//   2. wpisz nazwę i cenę,
//   3. wklej adres zdjęcia z Allegro w pole `zdjecie`
//      (na ofercie: prawy przycisk na zdjęciu → "Kopiuj adres obrazu",
//       adres z domeny allegroimg.com),
//   4. ustaw kategorię i wiek.
//
// Pole `zdjecie` puste (null) => pokaże się kolorowy placeholder.
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

// Dane poglądowe (demo). Podmień na realne oferty z Allegro.
export const PRODUKTY: Produkt[] = [
  { id: "bluza-slonik", nazwa: "Bluza Słonik", cena: 89.9, kategoria: "niemowleta", wiek: "0-2", wiekLabel: "0-2 lata", badge: "NOWOŚĆ", zdjecie: null, hue: 160 },
  { id: "kombinezon-skrzaty", nazwa: "Kombinezon Leśne Skrzaty", cena: 129.9, kategoria: "niemowleta", wiek: "0-2", wiekLabel: "0-2 lata", badge: "BESTSELLER", zdjecie: null, hue: 250 },
  { id: "body-chmurki", nazwa: "Body w Chmurki", cena: 49.9, kategoria: "niemowleta", wiek: "0-2", wiekLabel: "0-2 lata", badge: null, zdjecie: null, hue: 200 },
  { id: "sukienka-kwiatki", nazwa: "Sukienka w Kwiatki", cena: 79.9, kategoria: "dziewczynki", wiek: "2-6", wiekLabel: "2-6 lat", badge: "NOWOŚĆ", zdjecie: null, hue: 340 },
  { id: "spodniczka-motylek", nazwa: "Spódniczka Motylek", cena: 59.9, kategoria: "dziewczynki", wiek: "2-6", wiekLabel: "2-6 lat", badge: null, zdjecie: null, hue: 320 },
  { id: "bluza-jednorozec", nazwa: "Bluza Jednorożec", cena: 74.9, kategoria: "dziewczynki", wiek: "6-12", wiekLabel: "6-12 lat", badge: "-20%", zdjecie: null, hue: 300 },
  { id: "bluza-dino", nazwa: "Bluza Dino", cena: 69.9, kategoria: "chlopcy", wiek: "2-6", wiekLabel: "2-6 lat", badge: "-20%", zdjecie: null, hue: 230 },
  { id: "spodnie-odkrywca", nazwa: "Spodnie Odkrywca", cena: 84.9, kategoria: "chlopcy", wiek: "6-12", wiekLabel: "6-12 lat", badge: null, zdjecie: null, hue: 95 },
  { id: "koszulka-rakieta", nazwa: "Koszulka Rakieta", cena: 44.9, kategoria: "chlopcy", wiek: "2-6", wiekLabel: "2-6 lat", badge: "NOWOŚĆ", zdjecie: null, hue: 250 },
  { id: "kurtka-piknik", nazwa: "Kurtka Piknik", cena: 149.9, kategoria: "chlopcy", wiek: "6-12", wiekLabel: "6-12 lat", badge: null, zdjecie: null, hue: 30 },
  { id: "spiochy-gwiazdki", nazwa: "Śpiochy Gwiazdki", cena: 54.9, kategoria: "niemowleta", wiek: "0-2", wiekLabel: "0-2 lata", badge: null, zdjecie: null, hue: 95 },
  { id: "sukienka-truskawka", nazwa: "Sukienka Truskawka", cena: 69.9, kategoria: "dziewczynki", wiek: "0-2", wiekLabel: "0-2 lata", badge: null, zdjecie: null, hue: 35 },
];
