import type { MetadataRoute } from "next";
import { BAZA_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/koszyk", "/zamowienie"],
      },
    ],
    sitemap: `${BAZA_URL}/sitemap.xml`,
    host: BAZA_URL,
  };
}
