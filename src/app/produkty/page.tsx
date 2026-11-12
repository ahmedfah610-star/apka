import type { Metadata } from "next";
import ListingProduktow from "@/components/ListingProduktow";
import { katalogWidoczny } from "@/lib/produktyDb";
import type { Produkt } from "@/data/produkty";

// Unikalne metadane dla stron kategorii (ważne dla SEO — to główne strony docelowe).
const META_KATEGORII: Record<string, { title: string; description: string }> = {
  dziewczynki: {
    title: "Ubranka dla dziewczynek 0–12 lat",
    description:
      "Sukienki, legginsy, bluzki i komplety dla dziewczynek 0–12 lat. Miękkie tkaniny, śliczne wzory i wymiary w cm. Wysyłka w 1–2 dni — wybierz coś dla niej!",
  },
  chlopcy: {
    title: "Ubranka dla chłopców 0–12 lat",
    description:
      "Dresy, bluzy i komplety dla chłopców 0–12 lat — wygodne i gotowe na każdą zabawę. Wymiary w cm przy każdym rozmiarze, wysyłka w 1–2 dni. Sprawdź!",
  },
  niemowleta: {
    title: "Ubranka dla niemowląt i noworodków",
    description:
      "Body, pajacyki i komplety dla niemowląt z miękkiej bawełny — łatwe przewijanie, wymiary w cm. Wysyłka w 1–2 dni, 14 dni na zwrot. Skompletuj wyprawkę!",
  },
  dorosli: {
    title: "Odzież męska — swetry, bluzy i spodnie dresowe do 7XL",
    description:
      "Męskie swetry, bluzy i dresy od M do 7XL — ciepłe na zimę, z wymiarami w cm przy każdym rozmiarze. Wysyłka w 1–2 dni, 14 dni na zwrot. Zamów swój rozmiar!",
  },
};

export function generateMetadata({
  searchParams,
}: {
  searchParams: { kategoria?: string; szukaj?: string };
}): Metadata {
  const szukaj = searchParams.szukaj?.trim();
  if (szukaj) {
    // Strony wyników wyszukiwania nie powinny być indeksowane.
    return {
      title: `Wyniki wyszukiwania: „${szukaj}"`,
      robots: { index: false, follow: true },
      alternates: { canonical: "/produkty" },
    };
  }

  const kat = searchParams.kategoria;
  if (kat && META_KATEGORII[kat]) {
    const m = META_KATEGORII[kat];
    return {
      title: m.title,
      description: m.description,
      alternates: { canonical: `/produkty?kategoria=${kat}` },
      openGraph: { title: `${m.title} — bobas-shopping`, description: m.description },
    };
  }

  return {
    title: "Wszystkie produkty — ubranka dziecięce 0–12 lat",
    description:
      "Wszystkie ubranka dla dzieci 0–12 lat w jednym miejscu: komplety, dresy, body i sukienki. Wymiary w cm, wysyłka w 1–2 dni. Znajdź idealny rozmiar!",
    alternates: { canonical: "/produkty" },
  };
}

// Lista produktów trafia do kodu strony już z serwera (wcześniej strona kategorii wysyłała
// Google samo „Ładowanie…", a produkty dociągała przeglądarka). Wersja „lekka": bez opisów
// i galerii — tyle, ile potrzeba kafelkom i filtrom; liczba zdjęć zostaje (wybór koloru na kafelku).
function lekkiKatalog(katalog: Produkt[]): Produkt[] {
  return katalog.map((p) => ({
    ...p,
    opis: undefined,
    opisHtml: undefined,
    opisRozmiary: undefined,
    zdjecia: p.zdjecia?.length ? new Array(p.zdjecia.length).fill("") : undefined,
  })) as Produkt[];
}

export default async function Page() {
  let poczatkowe: Produkt[] | undefined;
  try {
    poczatkowe = lekkiKatalog(await katalogWidoczny());
  } catch {
    /* brak bazy — lista dociągnie się w przeglądarce jak dawniej */
  }
  return <ListingProduktow poczatkowe={poczatkowe} />;
}
