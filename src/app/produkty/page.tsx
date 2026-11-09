import type { Metadata } from "next";
import ListingProduktow from "@/components/ListingProduktow";
import { katalogWidoczny } from "@/lib/produktyDb";
import type { Produkt } from "@/data/produkty";

// Unikalne metadane dla stron kategorii (ważne dla SEO — to główne strony docelowe).
const META_KATEGORII: Record<string, { title: string; description: string }> = {
  dziewczynki: {
    title: "Ubranka dla dziewczynek 0–12 lat",
    description:
      "Ubranka dla dziewczynek 0–12 lat — sukienki, legginsy, bluzy, komplety i body. Miękkie, bezpieczne tkaniny i wygodne fasony. Wysyłka InPost, 14 dni na zwrot.",
  },
  chlopcy: {
    title: "Ubranka dla chłopców 0–12 lat",
    description:
      "Ubranka dla chłopców 0–12 lat — dresy, spodnie, bluzy, komplety i koszulki. Wytrzymałe i wygodne, gotowe na zabawę. Wysyłka InPost, 14 dni na zwrot.",
  },
  niemowleta: {
    title: "Ubranka dla niemowląt i noworodków",
    description:
      "Ubranka dla niemowląt i noworodków — body, pajacyki, śpiochy, komplety i czapeczki. Delikatna bawełna i łatwe przewijanie. Wysyłka InPost, 14 dni na zwrot.",
  },
  dorosli: {
    title: "Odzież męska — swetry, bluzy i spodnie dresowe do 7XL",
    description:
      "Odzież męska: swetry rozpinane i z półgolfem, bluzy z kapturem, spodnie dresowe cienkie i ocieplane. Rozmiary od M do 7XL, wymiary w cm. Wysyłka InPost, 14 dni na zwrot.",
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
      "Pełna oferta ubranek dla dzieci 0–12 lat: dziewczynki, chłopcy i niemowlęta. Miękkie, bezpieczne i wygodne. Wysyłka InPost, 14 dni na zwrot.",
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
