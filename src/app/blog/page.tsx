import type { Metadata } from "next";
import { Nawigacja } from "@/components/Nawigacja";
import { Stopka } from "@/components/Stopka";
import { ListaBloga } from "@/components/ListaBloga";
import { ARTYKULY } from "@/data/blog";

export const metadata: Metadata = {
  title: "Blog — poradniki dla rodziców",
  description: "Poradniki o ubrankach dziecięcych: jak dobrać rozmiar, wyprawka dla noworodka, ubieranie niemowlęcia, pranie i pielęgnacja.",
  alternates: { canonical: "/blog" },
};

export default function Blog() {
  // Do listy tylko dane karty — bez treści artykułów (mniejsza strona).
  const wpisy = [...ARTYKULY]
    .sort((a, b) => b.data.localeCompare(a.data))
    .map(({ slug, tytul, opis, data, czasCzytania, kategoria, hue, zdjecie }) => ({ slug, tytul, opis, data, czasCzytania, kategoria, hue, zdjecie }));

  return (
    <div className="overflow-x-clip">
      <Nawigacja />
      <div className="mx-auto max-w-content px-5 py-10 sm:px-6 md:px-12 md:py-14">
        <h1 className="mb-2 text-[30px] font-extrabold tracking-tight md:text-[38px]">Blog</h1>
        <p className="mb-6 max-w-2xl text-[16px] text-ink-2">
          Poradniki dla rodziców — rozmiary, wyprawka, pielęgnacja i ubieranie na każdą porę roku. W każdym wpisie podpowiadamy też, co z naszego sklepu się sprawdzi.
        </p>
        <ListaBloga wpisy={wpisy} />
      </div>
      <Stopka />
    </div>
  );
}
