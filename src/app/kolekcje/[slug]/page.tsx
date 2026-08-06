import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Nawigacja } from "@/components/Nawigacja";
import { Stopka } from "@/components/Stopka";
import { KartaProduktu } from "@/components/KartaProduktu";
import { KOLEKCJE, znajdzKolekcje, produktyKolekcji } from "@/data/kolekcje";
import { katalogWidoczny } from "@/lib/produktyDb";
import { BAZA_URL, jsonLd } from "@/lib/seo";

// ISR — treść statyczna, produkty odświeżane co 5 minut.
export const revalidate = 300;

export function generateStaticParams() {
  return KOLEKCJE.map((k) => ({ slug: k.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const k = znajdzKolekcje(params.slug);
  if (!k) return { title: "Kolekcja" };
  return {
    title: k.tytul,
    description: k.opis,
    alternates: { canonical: `/kolekcje/${k.slug}` },
    openGraph: { title: `${k.tytul} — bobas-shopping`, description: k.opis, url: `${BAZA_URL}/kolekcje/${k.slug}` },
  };
}

export default async function StronaKolekcji({ params }: { params: { slug: string } }) {
  const kol = znajdzKolekcje(params.slug);
  if (!kol) notFound();

  const katalog = await katalogWidoczny();
  const produkty = produktyKolekcji(katalog, kol);

  // Pozostałe kolekcje do linkowania wewnętrznego.
  const inne = KOLEKCJE.filter((k) => k.slug !== kol.slug).slice(0, 8);

  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Produkty", item: `${BAZA_URL}/produkty` },
        { "@type": "ListItem", position: 2, name: kol.h1, item: `${BAZA_URL}/kolekcje/${kol.slug}` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: kol.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];

  return (
    <div className="overflow-x-hidden">
      <Nawigacja aktywna="produkty" />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />

      <div className="mx-auto max-w-content px-6 pb-4 pt-11 md:px-12">
        <nav className="mb-3 text-[12.5px] text-ink-2">
          <Link href="/produkty" className="no-underline hover:text-akcent">Produkty</Link> / <span className="text-ink">{kol.h1}</span>
        </nav>
        <h1 className="mb-3 text-[32px] font-bold tracking-tight md:text-[40px]">{kol.h1}</h1>
        <p className="mb-2 max-w-3xl text-[15.5px] leading-relaxed text-ink-2">{kol.wstep}</p>
        <p className="mb-7 text-[14px] text-ink-2">{produkty.length} {produkty.length === 1 ? "produkt" : "produktów"}</p>
      </div>

      <div className="mx-auto max-w-content px-6 pb-16 md:px-12">
        {produkty.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
            {produkty.map((p) => (
              <KartaProduktu key={p.id} produkt={p} />
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-ink-2">
            <p className="mb-4 text-[15px]">Chwilowo brak produktów w tej kolekcji.</p>
            <Link href="/produkty" className="inline-block bg-ink px-6 py-3 text-[13px] font-semibold tracking-wide text-tlo no-underline hover:bg-akcent">
              ZOBACZ WSZYSTKIE PRODUKTY
            </Link>
          </div>
        )}
      </div>

      {/* FAQ — także jako dane strukturalne (rich results) */}
      <section className="px-6 pb-16 md:px-12">
        <div className="mx-auto max-w-content border-t border-linia pt-10">
          <h2 className="mb-5 text-[20px] font-bold tracking-tight">Najczęstsze pytania</h2>
          <div className="flex flex-col divide-y divide-linia border-y border-linia">
            {kol.faq.map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-semibold">
                  {f.q}
                  <span className="text-ink-2 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2.5 text-[15px] leading-relaxed text-ink-2">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Linkowanie wewnętrzne — inne kolekcje */}
      <section className="px-6 pb-20 md:px-12">
        <div className="mx-auto max-w-content border-t border-linia pt-10">
          <h2 className="mb-5 text-[20px] font-bold tracking-tight">Zobacz też</h2>
          <div className="flex flex-wrap gap-2.5">
            {inne.map((k) => (
              <Link
                key={k.slug}
                href={`/kolekcje/${k.slug}`}
                className="rounded-full border border-linia-2 px-4 py-2 text-[13.5px] font-medium text-ink no-underline transition-colors hover:border-ink hover:bg-szary"
              >
                {k.h1}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Stopka />
    </div>
  );
}
