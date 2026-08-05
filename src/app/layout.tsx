import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { KoszykProvider } from "@/components/KoszykContext";
import { UlubioneProvider } from "@/components/UlubioneContext";
import { BannerCookies } from "@/components/BannerCookies";
import { BAZA_URL, NAZWA_SKLEPU, OPIS_SKLEPU, jsonLd } from "@/lib/seo";

// Self-hosting fontu przez next/font — bez blokującego zapytania do Google
// i bez przesunięć układu (CLS). latin-ext obejmuje polskie znaki.
const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-dm-sans",
});

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
  verification: {
    // Weryfikacja Google Search Console (metoda „znacznik HTML" / usługa typu „Prefiks URL").
    // Token można nadpisać zmienną NEXT_PUBLIC_GOOGLE_VERIFICATION.
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || "O6bHjQAk8ppz3H1qghd6jf-h039XwR-aRImryDw8lk4",
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
    <html lang="pl" className={dmSans.variable}>
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
