import type { Metadata } from "next";
import Link from "next/link";
import { Nawigacja } from "@/components/Nawigacja";
import { Stopka } from "@/components/Stopka";
import { ARTYKULY } from "@/data/blog";

export const metadata: Metadata = {
  title: "Blog — poradniki dla rodziców",
  description: "Poradniki o ubrankach dziecięcych: jak dobrać rozmiar, wyprawka dla noworodka, ubieranie niemowlęcia, pranie i pielęgnacja.",
  alternates: { canonical: "/blog" },
};

const DATA_PL = (iso: string) => new Date(iso).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });

export default function Blog() {
  return (
    <div className="overflow-x-hidden">
      <Nawigacja />
      <div className="mx-auto max-w-content px-5 py-12 sm:px-6 md:px-12 md:py-16">
        <h1 className="mb-2 text-[30px] font-bold tracking-tight md:text-[38px]">Blog</h1>
        <p className="mb-10 text-[16px] text-ink-2">Poradniki dla rodziców — rozmiary, wyprawka, pielęgnacja i więcej.</p>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {ARTYKULY.map((a) => (
            <Link key={a.slug} href={`/blog/${a.slug}`} className="group flex flex-col text-inherit no-underline">
              <div
                className="mb-4 flex h-[180px] items-end p-5"
                style={{ background: `linear-gradient(135deg, oklch(94% 0.04 ${a.hue}) 0%, oklch(88% 0.07 ${a.hue}) 100%)` }}
              >
                <span className="bg-white/85 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink">{a.kategoria}</span>
              </div>
              <h2 className="mb-1.5 text-[18px] font-bold leading-snug transition-colors group-hover:text-akcent">{a.tytul}</h2>
              <p className="mb-3 text-[14px] leading-relaxed text-ink-2">{a.opis}</p>
              <span className="mt-auto text-[12.5px] text-ink-2">
                {DATA_PL(a.data)} · {a.czasCzytania} min czytania
              </span>
            </Link>
          ))}
        </div>
      </div>
      <Stopka />
    </div>
  );
}
