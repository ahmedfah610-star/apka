import type { Metadata } from "next";
import { UkladKonta } from "@/components/konto/UkladKonta";
import { ZakladkiKonta } from "@/components/konto/ZakladkiKonta";
import { SzczegolyZamowienia } from "@/components/konto/SzczegolyZamowienia";

export const metadata: Metadata = { title: "Szczegóły zamówienia", robots: { index: false, follow: false } };

export default function StronaSzczegolowZamowienia({ params }: { params: { id: string } }) {
  return (
    <UkladKonta>
      <ZakladkiKonta />
      <SzczegolyZamowienia id={params.id} />
    </UkladKonta>
  );
}
