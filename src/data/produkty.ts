// ---------------------------------------------------------------------------
// Dane produktów sklepu Fasolka — zaimportowane z Allegro (sklep bobas-shopping).
//
// Zdjęcia linkowane bezpośrednio z serwera Allegro (allegroimg.com).
// To wybór poglądowy (~19 produktów z ~240 dostępnych) na potrzeby demo.
// zdjecie = null => pokaże się kolorowy placeholder.
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
  /** Krótki opis produktu na stronie szczegółów. */
  opis?: string;
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
  {
    id: "bluzka-t-shirt-bawelniana",
    nazwa: "Bawełniana koszulka z krótkim rękawem",
    cena: 19.99,
    kategoria: "dziewczynki",
    wiek: "6-12",
    wiekLabel: "6-12 lat",
    badge: "NOWOŚĆ",
    rozmiary: ["128", "134", "140", "146", "152", "158", "164", "170"],
    zdjecie: "https://a.allegroimg.com/original/1104ae/ffcc0a36486cb409e8822d8e3f51",
    opis: "Klasyczna koszulka z krótkim rękawem z miękkiej, oddychającej bawełny. Wygodna na co dzień — do szkoły, na plac zabaw i na upalne dni.",
    hue: 340,
  },
  {
    id: "legginsy-prazkowane-wysoki-stan",
    nazwa: "Legginsy prążkowane z wysokim stanem",
    cena: 25.99,
    kategoria: "dziewczynki",
    wiek: "6-12",
    wiekLabel: "6-12 lat",
    badge: null,
    rozmiary: ["104", "116", "122", "128", "134", "146", "152", "158", "164"],
    zdjecie: "https://a.allegroimg.com/original/11c67a/df8febcc45ed834f951340e1e820",
    opis: "Prążkowane legginsy z wysokim stanem, które nie zsuwają się i nie krępują ruchów. Idealne pod sukienkę, tunikę albo same.",
    hue: 340,
  },
  {
    id: "legginsy-welurowe-ocieplane",
    nazwa: "Welurowe legginsy ocieplane",
    cena: 25.0,
    kategoria: "dziewczynki",
    wiek: "6-12",
    wiekLabel: "6-12 lat",
    badge: null,
    rozmiary: ["98", "104", "110", "116", "122", "134", "140", "146"],
    zdjecie: "https://a.allegroimg.com/original/117cac/84f318b54734846c69bb8f8df5c3",
    opis: "Miękkie welurowe legginsy lekko ocieplane od środka — ciepłe na chłodniejsze dni, a przy tym elastyczne i wygodne.",
    hue: 340,
  },
  {
    id: "kamizelka-sweterkowa",
    nazwa: "Sweterkowa kamizelka",
    cena: 25.0,
    kategoria: "dziewczynki",
    wiek: "2-6",
    wiekLabel: "2-6 lat",
    badge: null,
    rozmiary: ["80", "86", "92", "98", "104", "110"],
    zdjecie: "https://a.allegroimg.com/original/1170a6/8fe8fe144a718cdd12912cd7f1c0",
    opis: "Sweterkowa kamizelka-bezrękawnik, która ładnie dopełnia stylizację i grzeje, gdy nie trzeba jeszcze kurtki.",
    hue: 340,
  },
  {
    id: "bluza-z-nadrukiem",
    nazwa: "Bluza z nadrukiem",
    cena: 9.99,
    kategoria: "dziewczynki",
    wiek: "2-6",
    wiekLabel: "2-6 lat",
    badge: "-20%",
    rozmiary: ["86", "92", "98", "104", "110", "116", "122", "128"],
    zdjecie: "https://a.allegroimg.com/original/11d87b/c1a49e04452ea89a9805a1eba7d5",
    opis: "Bluza z uroczym nadrukiem, lekko ocieplana od środka. Przyjemna w dotyku i łatwa w praniu.",
    hue: 340,
  },
  {
    id: "szorty-dresowe",
    nazwa: "Szorty dresowe z kieszeniami",
    cena: 25.0,
    kategoria: "dziewczynki",
    wiek: "6-12",
    wiekLabel: "6-12 lat",
    badge: null,
    rozmiary: ["122", "128", "134", "140", "146", "152", "158", "164"],
    zdjecie: "https://a.allegroimg.com/original/1103a6/8b6640e64a0e9ed71a597fdf593d",
    opis: "Dresowe szorty z wygodnymi kieszeniami i gumką w pasie. Swoboda ruchu na upalne dni i sportowe zabawy.",
    hue: 340,
  },
  {
    id: "dres-2-czesciowy-rozowy",
    nazwa: "Różowy dres dwuczęściowy z kapturem",
    cena: 65.0,
    kategoria: "dziewczynki",
    wiek: "6-12",
    wiekLabel: "6-12 lat",
    badge: "BESTSELLER",
    rozmiary: ["104", "110", "116", "122", "128", "134", "140", "146", "152"],
    zdjecie: "https://a.allegroimg.com/original/11d4d9/f8b7ea5f439da07000997c14257d",
    opis: "Dwuczęściowy komplet: bluza z kapturem i spodnie. Miękki dres, w którym wygodnie od rana do wieczora.",
    hue: 340,
  },
  {
    id: "bluzka-w-serduszka",
    nazwa: "Bluzka w serduszka",
    cena: 14.99,
    kategoria: "dziewczynki",
    wiek: "2-6",
    wiekLabel: "2-6 lat",
    badge: null,
    rozmiary: ["92", "98", "104", "110", "116"],
    zdjecie: "https://a.allegroimg.com/original/116229/8641069a4c7283134d6baa2c7214",
    opis: "Delikatna bluzka z krótkim rękawem w serduszka. Lekka bawełna idealna na wiosnę i lato.",
    hue: 340,
  },
  {
    id: "spodnie-dresowe-sportowe",
    nazwa: "Sportowe spodnie dresowe",
    cena: 38.99,
    kategoria: "chlopcy",
    wiek: "6-12",
    wiekLabel: "6-12 lat",
    badge: "NOWOŚĆ",
    rozmiary: ["104", "110", "116", "122", "128", "134", "140", "146", "152", "158", "164", "170"],
    zdjecie: "https://a.allegroimg.com/original/115783/d562ee51483b9da4de4c93105897",
    opis: "Sportowe spodnie dresowe ze ściągaczami i kieszeniami. 100% bawełna — miękkie, wytrzymałe i wygodne na co dzień.",
    hue: 230,
  },
  {
    id: "spodnie-dresowe-do-przedszkola",
    nazwa: "Spodnie dresowe na co dzień",
    cena: 29.99,
    kategoria: "chlopcy",
    wiek: "2-6",
    wiekLabel: "2-6 lat",
    badge: null,
    rozmiary: ["98", "104", "110", "116", "122", "128"],
    zdjecie: "https://a.allegroimg.com/original/11481c/df8c2b2f479c86b955d84f477e20",
    opis: "Wygodne dresowe spodnie na co dzień — do przedszkola, na spacer i do zabawy. Gumka w pasie dla łatwego ubierania.",
    hue: 230,
  },
  {
    id: "spodnie-sportowe-z-kieszeniami",
    nazwa: "Spodnie dresowe z kieszeniami",
    cena: 38.99,
    kategoria: "chlopcy",
    wiek: "6-12",
    wiekLabel: "6-12 lat",
    badge: null,
    rozmiary: ["104", "110", "116", "122", "128", "134", "140", "152", "158", "164"],
    zdjecie: "https://a.allegroimg.com/original/113b29/ef0fbb0d4d21b01cc00dc757ace3",
    opis: "Dresowe spodnie z bocznymi kieszeniami i ściągaczami. Sportowy krój, który daje pełną swobodę ruchu.",
    hue: 230,
  },
  {
    id: "koszulka-chlopieca-t-shirt",
    nazwa: "Chłopięca koszulka T-shirt",
    cena: 19.99,
    kategoria: "chlopcy",
    wiek: "6-12",
    wiekLabel: "6-12 lat",
    badge: null,
    rozmiary: ["122", "128", "134", "140", "146", "152", "158", "164"],
    zdjecie: "https://a.allegroimg.com/original/11d50c/a3c6ce274ce9ae9f274357d3615f",
    opis: "Bawełniana koszulka z krótkim rękawem. Podstawa chłopięcej szafy — lekka, oddychająca i wygodna.",
    hue: 230,
  },
  {
    id: "komplet-chlopiecy-3-czesciowy",
    nazwa: "Elegancki komplet 3-częściowy",
    cena: 65.0,
    kategoria: "chlopcy",
    wiek: "0-2",
    wiekLabel: "0-2 lata",
    badge: "BESTSELLER",
    rozmiary: ["62", "68", "74", "80", "86"],
    zdjecie: "https://a.allegroimg.com/original/11946f/0f62f7cb4e5a88f1e92d4c6702c2",
    opis: "Elegancki 3-częściowy komplet na wyjątkowe okazje — chrzest, wesele czy rodzinną uroczystość.",
    hue: 230,
  },
  {
    id: "dresik-do-przedszkola",
    nazwa: "Dresik dwuczęściowy",
    cena: 35.0,
    kategoria: "chlopcy",
    wiek: "2-6",
    wiekLabel: "2-6 lat",
    badge: null,
    rozmiary: ["98", "104", "110"],
    zdjecie: "https://a.allegroimg.com/original/111c42/fae2a4a44e8b8dc11c8b03f2e5ed",
    opis: "Komplet bluza + spodnie z miękkiej dzianiny. Wygodny dresik na co dzień — do przedszkola i na spacer.",
    hue: 230,
  },
  {
    id: "komplet-dresowy-100-bawelna",
    nazwa: "Komplet dresowy z bawełny",
    cena: 39.99,
    kategoria: "niemowleta",
    wiek: "0-2",
    wiekLabel: "0-2 lata",
    badge: "NOWOŚĆ",
    rozmiary: ["62", "68", "74", "80", "86", "92", "100"],
    zdjecie: "https://a.allegroimg.com/original/118ba0/94450d37472183e61ecfa5fd3f28",
    opis: "Dwuczęściowy dres dla najmłodszych ze 100% bawełny. Miękki, przyjazny skórze i łatwy do ubrania.",
    hue: 160,
  },
  {
    id: "komplet-dresowy-mis",
    nazwa: "Komplet dresowy Miś",
    cena: 39.99,
    kategoria: "niemowleta",
    wiek: "0-2",
    wiekLabel: "0-2 lata",
    badge: null,
    rozmiary: ["68", "74", "80", "86", "92", "100"],
    zdjecie: "https://a.allegroimg.com/original/118adf/29bdc7004b6cb57cdbe65fe7c26d",
    opis: "Uroczy komplet dresowy z misiem. Ciepły i mięciutki — idealny na pierwsze spacery.",
    hue: 160,
  },
  {
    id: "polspiochy-ze-skarpetkami",
    nazwa: "Półśpiochy ze stópkami",
    cena: 16.99,
    kategoria: "niemowleta",
    wiek: "0-2",
    wiekLabel: "0-2 lata",
    badge: null,
    rozmiary: ["62", "68", "74", "80"],
    zdjecie: "https://a.allegroimg.com/original/112978/955688f940569413f08f916b9828",
    opis: "Półśpiochy z delikatnej bawełny z wykończonymi stópkami. Trzymają ciepło i nie uwierają.",
    hue: 160,
  },
  {
    id: "legginsy-niemowlece-prazkowane",
    nazwa: "Legginsy niemowlęce prążkowane",
    cena: 19.99,
    kategoria: "niemowleta",
    wiek: "0-2",
    wiekLabel: "0-2 lata",
    badge: null,
    rozmiary: ["62", "68", "74", "80", "86"],
    zdjecie: "https://a.allegroimg.com/original/11e2d1/db27631f4255aceb0f6b3832d24d",
    opis: "Prążkowane legginsy z miękkiej dzianiny, elastyczne w pasie. Wygodne na warstwę i na co dzień.",
    hue: 160,
  },
  {
    id: "komplet-dres-3-czesciowy",
    nazwa: "Komplet niemowlęcy 3-częściowy",
    cena: 59.99,
    kategoria: "niemowleta",
    wiek: "0-2",
    wiekLabel: "0-2 lata",
    badge: "BESTSELLER",
    rozmiary: ["68", "74", "80", "86"],
    zdjecie: "https://a.allegroimg.com/original/116ba0/05f0e4ed44b59d02d51e67d566b9",
    opis: "Trzyczęściowy komplet niemowlęcy: body, bluza i spodnie. Wszystko, czego trzeba, w jednym zestawie.",
    hue: 160,
  },
];

export function znajdzProdukt(id: string): Produkt | undefined {
  return PRODUKTY.find((p) => p.id === id);
}
