import type { MetadataRoute } from "next";
import { BAZA_URL } from "@/lib/seo";
import { katalogWidoczny, datyDodania } from "@/lib/produktyDb";
import { ARTYKULY } from "@/data/blog";
import { KOLEKCJE, produktyKolekcji } from "@/data/kolekcje";
import { urlProduktu } from "@/lib/adresProduktu";
import type { Produkt } from "@/data/produkty";

export const revalidate = 3600; // wcześniej liczona od nowa przy każdym pobraniu przez roboty

const KATEGORIE = ["niemowleta", "dziewczynki", "chlopcy", "dorosli"] as const;

/** Najświeższa data z listy (albo nic — wtedy wpis nie dostaje daty, zamiast udawanej „dzisiaj"). */
function najnowsza(daty: (string | undefined)[]): Date | undefined {
  const t = daty.map((d) => (d ? new Date(d).getTime() : NaN)).filter((n) => Number.isFinite(n));
  return t.length ? new Date(Math.max(...t)) : undefined;
}

// Daty w mapie są PRAWDZIWE: produkt = kiedy trafił do sklepu, kategoria/kolekcja = kiedy doszedł
// do niej ostatni produkt. Wcześniej wszystko miało datę „teraz", więc Google ignorował te daty.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let katalog: Produkt[] = [];
  let daty: Record<string, string> = {};
  try {
    [katalog, daty] = await Promise.all([katalogWidoczny(), datyDodania()]);
  } catch {
    /* brak bazy — sam szkielet stron */
  }
  const data = (lista: Produkt[]) => najnowsza(lista.map((p) => daty[p.id]));
  const ostatniProdukt = data(katalog);

  const statyczne: MetadataRoute.Sitemap = [
    { url: `${BAZA_URL}/`, lastModified: ostatniProdukt, changeFrequency: "daily", priority: 1 },
    { url: `${BAZA_URL}/produkty`, lastModified: ostatniProdukt, changeFrequency: "daily", priority: 0.9 },
    ...KATEGORIE.map((k) => ({
      url: `${BAZA_URL}/produkty?kategoria=${k}`,
      lastModified: data(katalog.filter((p) => p.kategoria === k)),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    { url: `${BAZA_URL}/blog`, lastModified: najnowsza(ARTYKULY.map((a) => a.data)), changeFrequency: "weekly", priority: 0.6 },
    { url: `${BAZA_URL}/rozmiary`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BAZA_URL}/o-nas`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BAZA_URL}/kontakt`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BAZA_URL}/faq`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BAZA_URL}/dostawa-i-zwroty`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BAZA_URL}/regulamin`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BAZA_URL}/polityka-prywatnosci`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BAZA_URL}/cookies`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const produkty: MetadataRoute.Sitemap = katalog.map((p) => ({
    url: `${BAZA_URL}${urlProduktu(p)}`,
    lastModified: daty[p.id] ? new Date(daty[p.id]) : undefined,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const blog: MetadataRoute.Sitemap = ARTYKULY.map((a) => ({
    url: `${BAZA_URL}/blog/${a.slug}`,
    lastModified: new Date(a.data),
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  // Strony docelowe pod frazy (landing pages) — wysoki priorytet SEO.
  const kolekcje: MetadataRoute.Sitemap = KOLEKCJE.map((k) => ({
    url: `${BAZA_URL}/kolekcje/${k.slug}`,
    lastModified: data(produktyKolekcji(katalog, k)),
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  return [...statyczne, ...kolekcje, ...produkty, ...blog];
}
