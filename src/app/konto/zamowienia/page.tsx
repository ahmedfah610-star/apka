import type { Metadata } from "next";
import { StronaInfo } from "@/components/StronaInfo";
import { HistoriaZamowien } from "@/components/konto/HistoriaZamowien";

export const metadata: Metadata = { title: "Moje zamówienia", robots: { index: false, follow: true } };

export default function StronaZamowienKonta() {
  return (
    <StronaInfo tytul="Moje zamówienia" wstep="Historia i status Twoich zamówień.">
      <HistoriaZamowien />
    </StronaInfo>
  );
}
