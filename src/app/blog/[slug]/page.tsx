import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Nawigacja } from "@/components/Nawigacja";
import { Stopka } from "@/components/Stopka";
import { UdostepnijWpis } from "@/components/UdostepnijWpis";
import { ARTYKULY, znajdzArtykul, polecaneDlaArtykulu, type Blok } from "@/data/blog";
import { BAZA_URL, NAZWA_SKLEPU, jsonLd } from "@/lib/seo";

// Zamienia znaczniki [tekst](/url) w treści na wewnętrzne odnośniki (tylko ścieżki /…).
function tekstZLinkami(tekst: string): React.ReactNode {
  const re = /\[([^\]]+)\]\((\/[^)]+)\)/g;
  const czesci: React.ReactNode[] = [];
  let ostatni = 0;
  let klucz = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tekst)) !== null) {
    if (m.index > ostatni) czesci.push(tekst.slice(ostatni, m.index));
    czesci.push(
      <Link key={klucz++} href={m[2]} className="font-medium text-akcent underline underline-offset-2 hover:text-ink">
        {m[1]}
      </Link>,
    );
    ostatni = m.index + m[0].length;
  }
  if (ostatni < tekst.length) czesci.push(tekst.slice(ostatni));
  return czesci.length ? czesci : tekst;
}

export function generateStaticParams() {
  return ARTYKULY.map((a) => ({ slug: a.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const a = znajdzArtykul(params.slug);
  if (!a) return { title: "Artykuł" };
  return {
    title: a.tytul,
    description: a.opis,
    alternates: { canonical: `/blog/${a.slug}` },
    openGraph: {
      type: "article",
      title: a.tytul,
      description: a.opis,
      url: `${BAZA_URL}/blog/${a.slug}`,
      publishedTime: a.data,
    },
  };
}

const DATA_PL = (iso: string) => new Date(iso).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });

function Blok({ b }: { b: Blok }) {
  if (b.typ === "h2") return <h2 className="mt-8 text-[22px] font-bold tracking-tight">{b.tekst}</h2>;
  if (b.typ === "ul")
    return (
      <ul className="flex list-disc flex-col gap-2 pl-5 text-ink-2">
        {b.punkty.map((p, i) => (
          <li key={i}>{tekstZLinkami(p)}</li>
        ))}
      </ul>
    );
  return <p className="text-[16px] leading-[1.75] text-ink">{tekstZLinkami(b.tekst)}</p>;
}

export default function Artykul({ params }: { params: { slug: string } }) {
  const a = znajdzArtykul(params.slug);
  if (!a) notFound();

  const inne = ARTYKULY.filter((x) => x.slug !== a.slug).slice(0, 3);

  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: a.tytul,
      description: a.opis,
      image: a.zdjecie ? [`${BAZA_URL}${a.zdjecie}`] : undefined,
      datePublished: a.data,
      dateModified: a.data,
      inLanguage: "pl-PL",
      author: { "@type": "Organization", name: NAZWA_SKLEPU },
      publisher: { "@type": "Organization", name: NAZWA_SKLEPU, logo: { "@type": "ImageObject", url: `${BAZA_URL}/opengraph-image` } },
      mainEntityOfPage: `${BAZA_URL}/blog/${a.slug}`,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Blog", item: `${BAZA_URL}/blog` },
        { "@type": "ListItem", position: 2, name: a.tytul, item: `${BAZA_URL}/blog/${a.slug}` },
      ],
    },
  ];

  return (
    <div className="overflow-x-hidden">
      <Nawigacja />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />

      <article className="mx-auto max-w-[720px] px-5 py-12 sm:px-6 md:py-16">
        <nav className="mb-4 text-[12.5px] text-ink-2">
          <Link href="/blog" className="no-underline hover:text-akcent">Blog</Link> / <span className="text-ink">{a.kategoria}</span>
        </nav>
        <h1 className="mb-3 text-[30px] font-bold leading-tight tracking-tight md:text-[40px]">{a.tytul}</h1>
        <p className="mb-6 text-[13px] text-ink-2">
          {DATA_PL(a.data)} · {a.czasCzytania} min czytania
        </p>

        {a.zdjecie ? (
          <div className="relative mb-8 aspect-[16/9] w-full overflow-hidden rounded-xl">
            <Image src={a.zdjecie} alt={a.tytul} fill priority sizes="(max-width: 768px) 100vw, 720px" className="object-cover" />
          </div>
        ) : null}

        <div className="flex flex-col gap-4">
          {a.tresc.map((b, i) => (
            <Blok key={i} b={b} />
          ))}
        </div>

        {/* Polecane w sklepie — kontekstowe linki do kategorii/kolekcji */}
        {(() => {
          const polecane = polecaneDlaArtykulu(a.slug);
          if (polecane.length === 0) return null;
          return (
            <aside className="mt-10 rounded-2xl border border-linia bg-szary/30 p-5 sm:p-6">
              <h2 className="mb-1 text-[16px] font-bold tracking-tight">Polecane w sklepie</h2>
              <p className="mb-4 text-[13.5px] text-ink-2">Ubranka, które pasują do tego poradnika:</p>
              <div className="flex flex-wrap gap-2.5">
                {polecane.map((l) => (
                  <Link
                    key={l.url}
                    href={l.url}
                    className="rounded-full border border-linia-2 bg-white px-4 py-2 text-[13.5px] font-medium text-ink no-underline transition-colors hover:border-ink hover:bg-ink hover:text-tlo"
                  >
                    {l.tekst} →
                  </Link>
                ))}
              </div>
            </aside>
          );
        })()}

        <UdostepnijWpis url={`${BAZA_URL}/blog/${a.slug}`} tytul={a.tytul} />

        <div className="mt-8 border-t border-linia pt-8">
          <Link href="/produkty" className="inline-block rounded-lg bg-ink px-8 py-3.5 text-[13px] font-semibold tracking-wide text-tlo no-underline transition-colors hover:bg-akcent">
            PRZEGLĄDAJ UBRANKA
          </Link>
        </div>
      </article>

      {inne.length > 0 ? (
        <section className="px-5 pb-20 sm:px-6 md:px-12">
          <div className="mx-auto max-w-content">
            <h2 className="mb-6 text-[20px] font-bold tracking-tight">Zobacz też</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {inne.map((x) => (
                <Link key={x.slug} href={`/blog/${x.slug}`} className="group text-inherit no-underline">
                  <div
                    className="relative mb-2.5 aspect-[16/9] overflow-hidden rounded-lg"
                    style={{ background: `linear-gradient(135deg, oklch(94% 0.04 ${x.hue}) 0%, oklch(88% 0.07 ${x.hue}) 100%)` }}
                  >
                    {x.zdjecie ? (
                      <Image
                        src={x.zdjecie}
                        alt={x.tytul}
                        fill
                        sizes="(max-width: 640px) 100vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : null}
                  </div>
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-2">{x.kategoria}</span>
                  <span className="block text-[16px] font-semibold leading-snug group-hover:text-akcent">{x.tytul}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <Stopka />
    </div>
  );
}
