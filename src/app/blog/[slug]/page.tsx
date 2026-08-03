import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Nawigacja } from "@/components/Nawigacja";
import { Stopka } from "@/components/Stopka";
import { ARTYKULY, znajdzArtykul, type Blok } from "@/data/blog";
import { BAZA_URL, NAZWA_SKLEPU, jsonLd } from "@/lib/seo";

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
          <li key={i}>{p}</li>
        ))}
      </ul>
    );
  return <p className="text-[16px] leading-[1.75] text-ink">{b.tekst}</p>;
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
        <p className="mb-8 text-[13px] text-ink-2">
          {DATA_PL(a.data)} · {a.czasCzytania} min czytania
        </p>

        <div className="flex flex-col gap-4">
          {a.tresc.map((b, i) => (
            <Blok key={i} b={b} />
          ))}
        </div>

        <div className="mt-12 border-t border-linia pt-8">
          <Link href="/produkty" className="inline-block bg-ink px-8 py-3.5 text-[13px] font-semibold tracking-wide text-tlo no-underline transition-colors hover:bg-akcent">
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
                <Link key={x.slug} href={`/blog/${x.slug}`} className="text-inherit no-underline">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-2">{x.kategoria}</span>
                  <span className="block text-[16px] font-semibold leading-snug hover:text-akcent">{x.tytul}</span>
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
