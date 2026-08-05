import type { Metadata } from "next";
import Link from "next/link";
import { Nawigacja } from "@/components/Nawigacja";
import { Stopka } from "@/components/Stopka";
import { WidokProduktu } from "@/components/WidokProduktu";
import { KATEGORIE_LABEL, opisProduktu, type Produkt } from "@/data/produkty";
import { katalogWidoczny, znajdzProduktDb } from "@/lib/produktyDb";
import { BAZA_URL, NAZWA_SKLEPU, jsonLd } from "@/lib/seo";

// Strona produktu czytana z bazy przy żądaniu (świeże ceny/stany, także dla
// pozycji dodanych w panelu). Bez bazy — fallback do katalogu z kodu.
// ISR: karta produktu cache'owana i odświeżana co 5 minut.
export const revalidate = 300;

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const p = await znajdzProduktDb(params.id);
  if (!p) return { title: "Produkt niedostępny" };
  const zdjecia = (p.zdjecia?.length ? p.zdjecia : p.zdjecie ? [p.zdjecie] : []).slice(0, 4);
  const opis = opisProduktu(p);
  return {
    title: `${p.nazwa} — ${KATEGORIE_LABEL[p.kategoria]}`,
    description: opis,
    alternates: { canonical: `/produkty/${p.id}` },
    openGraph: {
      type: "website",
      title: p.nazwa,
      description: opis,
      url: `${BAZA_URL}/produkty/${p.id}`,
      images: zdjecia.map((u) => ({ url: u })),
    },
    twitter: { card: "summary_large_image", title: p.nazwa, description: opis, images: zdjecia },
  };
}

function daneProduktu(p: Produkt) {
  const zdjecia = p.zdjecia?.length ? p.zdjecia : p.zdjecie ? [p.zdjecie] : [];
  const dostepny = p.stan === undefined || p.stan === null || p.stan > 0;
  return [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: p.nazwa,
      image: zdjecia,
      description: opisProduktu(p),
      brand: { "@type": "Brand", name: NAZWA_SKLEPU },
      category: KATEGORIE_LABEL[p.kategoria],
      offers: {
        "@type": "Offer",
        priceCurrency: "PLN",
        price: p.cena.toFixed(2),
        availability: dostepny ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        url: `${BAZA_URL}/produkty/${p.id}`,
        seller: { "@type": "Organization", name: NAZWA_SKLEPU },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Produkty", item: `${BAZA_URL}/produkty` },
        { "@type": "ListItem", position: 2, name: KATEGORIE_LABEL[p.kategoria], item: `${BAZA_URL}/produkty?kategoria=${p.kategoria}` },
        { "@type": "ListItem", position: 3, name: p.nazwa, item: `${BAZA_URL}/produkty/${p.id}` },
      ],
    },
  ];
}

export default async function StronaProduktu({ params }: { params: { id: string } }) {
  const [p, wszystkie] = await Promise.all([znajdzProduktDb(params.id), katalogWidoczny()]);

  if (!p) {
    return (
      <div className="overflow-x-hidden">
        <Nawigacja aktywna="produkty" />
        <div className="mx-auto max-w-content px-6 py-24 text-center md:px-12">
          <p className="mb-2 text-[17px] font-semibold">Nie znaleziono produktu</p>
          <p className="mb-6 text-sm text-ink-2">Ten produkt nie istnieje lub został usunięty.</p>
          <Link href="/produkty" className="inline-block bg-ink px-8 py-3.5 text-[13px] font-semibold tracking-wide text-tlo no-underline hover:bg-akcent">
            WRÓĆ DO PRODUKTÓW
          </Link>
        </div>
        <Stopka />
      </div>
    );
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(daneProduktu(p))} />
      <WidokProduktu produkt={p} wszystkie={wszystkie} />
    </>
  );
}
