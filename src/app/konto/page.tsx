import type { Metadata } from "next";
import { StronaInfo } from "@/components/StronaInfo";
import { PanelKonta } from "@/components/konto/PanelKonta";

export const metadata: Metadata = { title: "Moje konto", robots: { index: false, follow: true } };

export default function StronaKonta() {
  return (
    <StronaInfo tytul="Moje konto">
      <PanelKonta />
    </StronaInfo>
  );
}
