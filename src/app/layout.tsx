import type { Metadata } from "next";
import "./globals.css";
import { ProfilProvider } from "@/components/ProfilProvider";

export const metadata: Metadata = {
  title: "mojaŁapa — dobierz karmę dla swojego pupila",
  description:
    "Porównywarka karmy dla psów i kotów: dopasowanie do profilu pupila, kalkulator porcji i kosztu, oferty z różnych sklepów.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className="min-h-screen bg-tlo font-sans antialiased">
        <ProfilProvider>
          <div className="mx-auto max-w-md min-h-screen px-4 pb-10">{children}</div>
        </ProfilProvider>
      </body>
    </html>
  );
}
