import type { Metadata } from "next";
import "./globals.css";
import { KoszykProvider } from "@/components/KoszykContext";

export const metadata: Metadata = {
  title: "Fasolka — ubrania dziecięce",
  description:
    "Fasolka — sklep z ubraniami dla dzieci 0-12 lat. Miękkie, bezpieczne i gotowe do zabawy. Dziewczynki, chłopcy, niemowlęta.",
};

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
        <KoszykProvider>{children}</KoszykProvider>
      </body>
    </html>
  );
}
