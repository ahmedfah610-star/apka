import type { Metadata } from "next";
import ListingProduktow from "@/components/ListingProduktow";

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

export default function Page() {
  return <ListingProduktow />;
}
