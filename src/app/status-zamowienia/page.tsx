import type { Metadata } from "next";
import { StronaInfo } from "@/components/StronaInfo";
import { SledzenieZamowienia } from "@/components/SledzenieZamowienia";

export const metadata: Metadata = {
  title: "Sprawdź status zamówienia",
  description: "Sprawdź status swojego zamówienia w bobas-shopping — podaj numer zamówienia i e-mail.",
  alternates: { canonical: "/status-zamowienia" },
  robots: { index: false, follow: true },
};

export default function StronaStatusu() {
  return (
    <StronaInfo tytul="Status zamówienia" wstep="Podaj numer zamówienia i e-mail, którego użyłeś przy zakupie, aby sprawdzić, na jakim etapie jest Twoja paczka.">
      <SledzenieZamowienia />
    </StronaInfo>
  );
}
