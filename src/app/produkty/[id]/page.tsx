import type { Metadata } from "next";
import { WidokProduktu } from "@/components/WidokProduktu";
import { ProduktLokalny } from "@/components/ProduktLokalny";
import { PRODUKTY, opisProduktu, znajdzProdukt } from "@/data/produkty";

export function generateStaticParams() {
  return PRODUKTY.map((p) => ({ id: p.id }));
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const p = znajdzProdukt(params.id);
  if (!p) return { title: "Produkt — Fasolka" };
  return { title: `${p.nazwa} — Fasolka`, description: opisProduktu(p) };
}

export default function StronaProduktu({ params }: { params: { id: string } }) {
  const p = znajdzProdukt(params.id);
  // Produkt z kodu → statyczna strona; nieznany id (np. dodany w panelu) → wariant kliencki.
  if (!p) return <ProduktLokalny id={params.id} />;
  return <WidokProduktu produkt={p} wszystkie={PRODUKTY} />;
}
