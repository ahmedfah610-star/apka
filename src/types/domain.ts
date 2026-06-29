// Typy domenowe aplikacji mojaŁapa

export type Gatunek = "pies" | "kot";

export type RozmiarPsa = "mala" | "srednia" | "duza" | "olbrzymia";

export type StanCiala = "niedowaga" | "norma" | "nadwaga";

export type Aktywnosc = "spokojny" | "umiarkowany" | "bardzo_aktywny";

export type EtapZycia = "puppy" | "adult" | "senior";

export type RodzajKarmy = "sucha" | "mokra" | "obie";

export type Schorzenie = "brak" | "nerki" | "stawy" | "skora" | "trawienie";

export type Cel = "coat" | "sensitive" | "weight" | "joints";

/** Profil pupila tworzony w kreatorze (odpowiada tabeli `pets` w Supabase) */
export interface ProfilPupila {
  id?: string;
  imie: string;
  gatunek: Gatunek;
  rasa?: string;
  wiekLat: number;
  wagaKg: number;
  rozmiar?: RozmiarPsa;
  sterylizowany: boolean;
  stanCiala: StanCiala;
  aktywnosc: Aktywnosc;
  rodzajKarmy: RodzajKarmy;
  alergeny: string[];
  cele: Cel[];
  schorzenie: Schorzenie;
}

/** Pozycja katalogu karm (odpowiada tabeli `foods` w Supabase) */
export interface Karma {
  id: string;
  name: string;
  brand: string;
  species: Gatunek;
  stage: EtapZycia[];
  grainFree: boolean;
  goals: Cel[];
  activity: Aktywnosc | "all";
  contains: string[];
  type: "sucha" | "mokra";
  kcalKg: number;
  packageKg: number;
  priceKg: number;
  vetFor: Schorzenie | null;
}

/** Oferta sklepu dla danej karmy (odpowiada tabeli `offers` w Supabase) */
export interface Oferta {
  foodId: string;
  shop: string;
  price: number;
  delivery: number;
  inStock: boolean;
  fast: boolean;
  affiliateUrl: string;
}

/** Wynik dopasowania karmy do profilu pupila */
export interface DopasowanaKarma {
  karma: Karma;
  score: number;
  powody: string[];
  porcjaGDzien: number;
  kgMiesiac: number;
  najtanszaOferta: Oferta | null;
  kosztMiesiac: number | null;
  dniStarcza: number | null;
}

export type TypUslugodawcy = "weterynarz" | "fryzjer";

/** Pojedyncza opinia o weterynarzu/fryzjerze (odpowiada tabeli `reviews` w Supabase) */
export interface Opinia {
  autor: string;
  ocena: number; // 1-5
  tresc: string;
  data: string; // ISO
}

/** Weterynarz lub fryzjer w danym mieście (odpowiada tabeli `providers` w Supabase) */
export interface Uslugodawca {
  id: string;
  typ: TypUslugodawcy;
  nazwa: string;
  miasto: string;
  adres: string;
  telefon?: string;
  specjalizacje: string[];
  ocenaSrednia: number; // 1-5, wyliczona z opinii
  liczbaOpinii: number;
  opinie: Opinia[];
}
