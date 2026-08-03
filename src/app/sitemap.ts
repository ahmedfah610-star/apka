import type { MetadataRoute } from "next";
import { BAZA_URL } from "@/lib/seo";
import { katalogWidoczny } from "@/lib/produktyDb";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const teraz = new Date();

  const statyczne: MetadataRoute.Sitemap = [
    { url: `${BAZA_URL}/`, lastModified: teraz, changeFrequency: "daily", priority: 1 },
    { url: `${BAZA_URL}/produkty`, lastModified: teraz, changeFrequency: "daily", priority: 0.9 },
    { url: `${BAZA_URL}/produkty?kategoria=dziewczynki`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BAZA_URL}/produkty?kategoria=chlopcy`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BAZA_URL}/produkty?kategoria=niemowleta`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BAZA_URL}/o-nas`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BAZA_URL}/kontakt`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BAZA_URL}/faq`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BAZA_URL}/dostawa-i-zwroty`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BAZA_URL}/regulamin`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BAZA_URL}/polityka-prywatnosci`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BAZA_URL}/cookies`, changeFrequency: "yearly", priority: 0.2 },
  ];

  let produkty: MetadataRoute.Sitemap = [];
  try {
    const katalog = await katalogWidoczny();
    produkty = katalog.map((p) => ({
      url: `${BAZA_URL}/produkty/${p.id}`,
      lastModified: teraz,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch {
    /* brak bazy — sam szkielet stron */
  }

  return [...statyczne, ...produkty];
}
