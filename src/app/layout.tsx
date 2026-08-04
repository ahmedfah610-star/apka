import type { Metadata } from "next";
import "./globals.css";
import { KoszykProvider } from "@/components/KoszykContext";
import { UlubioneProvider } from "@/components/UlubioneContext";
import { BannerCookies } from "@/components/BannerCookies";
import { BAZA_URL, NAZWA_SKLEPU, OPIS_SKLEPU, jsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(BAZA_URL),
  title: {
    default: "bobas-shopping — ubrania dziecięce 0-12 lat | dziewczynki, chłopcy, niemowlęta",
    template: "%s — bobas-shopping",
  },
  description: OPIS_SKLEPU,
  keywords: [
    "ubrania dziecięce",
    "ubranka dla dzieci",
    "odzież dziecięca",
    "ubrania dla niemowląt",
    "ubranka dla dziewczynek",
    "ubranka dla chłopców",
    "sklep z odzieżą dziecięcą",
    "legginsy dziecięce",
    "dres dziecięcy",
    "body niemowlęce",
  ],
  applicationName: NAZWA_SKLEPU,
  authors: [{ name: NAZWA_SKLEPU }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pl_PL",
    url: BAZA_URL,
    siteName: NAZWA_SKLEPU,
    title: "bobas-shopping — ubrania dziecięce 0-12 lat",
    description: OPIS_SKLEPU,
  },
  twitter: {
    card: "summary_large_image",
    title: "bobas-shopping — ubrania dziecięce 0-12 lat",
    description: OPIS_SKLEPU,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  category: "shopping",
};

const daneStrukturalne = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: NAZWA_SKLEPU,
    url: BAZA_URL,
    description: OPIS_SKLEPU,
    logo: `${BAZA_URL}/opengraph-image`,
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: NAZWA_SKLEPU,
    url: BAZA_URL,
    inLanguage: "pl-PL",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${BAZA_URL}/produkty?szukaj={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-tlo font-sans text-ink antialiased">
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(daneStrukturalne)} />
        <UlubioneProvider>
          <KoszykProvider>{children}</KoszykProvider>
        </UlubioneProvider>
        <BannerCookies />
      </body>
    </html>
  );
}
