import Link from "next/link";
import { StronaInfo } from "@/components/StronaInfo";
import { OpinieAllegroSekcja } from "@/components/OpinieAllegro";
import { opinieAllegro } from "@/lib/opinieAllegro";

export const metadata = {
  alternates: { canonical: "/opinie" },
  title: "Opinie klientów",
  description: "Co mówią o nas kupujący: opinie z naszego konta sprzedawcy na Allegro — wszystkie, także negatywne, z naszymi odpowiedziami.",
};

// Opinie przychodzą z Allegro raz dziennie (lib/opinieAllegro) — strona odświeża się razem z nimi.
export const revalidate = 3600;

export default async function StronaOpinii() {
  const dane = await opinieAllegro().catch(() => null);
  return (
    <StronaInfo
      tytul="Opinie klientów"
      wstep="Sprzedajemy też na Allegro — tam kupujący oceniają nas po każdym zamówieniu. Poniżej ich opinie, bez wybierania tylko tych dobrych."
    >
      {dane ? (
        <OpinieAllegroSekcja podsumowanie={dane.podsumowanie} opinie={dane.opinie} pelna />
      ) : (
        <p>
          Opinie wczytujemy z Allegro — zajrzyj tu wkrótce. Masz pytanie? <Link href="/kontakt">Napisz do nas</Link>.
        </p>
      )}
    </StronaInfo>
  );
}
