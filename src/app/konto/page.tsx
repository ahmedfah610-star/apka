import type { Metadata } from "next";
import { UkladKonta } from "@/components/konto/UkladKonta";
import { PanelKonta } from "@/components/konto/PanelKonta";

export const metadata: Metadata = { title: "Moje konto", robots: { index: false, follow: true } };

export default function StronaKonta() {
  return (
    <UkladKonta>
      <PanelKonta />
    </UkladKonta>
  );
}
