import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Nawigacja } from "@/components/Nawigacja";
import { Stopka } from "@/components/Stopka";
import { UdostepnijWpis } from "@/components/UdostepnijWpis";
import { KartaProduktu } from "@/components/KartaProduktu";
import { ARTYKULY, znajdzArtykul, polecaneDlaArtykulu, type Blok } from "@/data/blog";
import { pasyDlaArtykulu, wybierzProdukty, type PasProduktow } from "@/lib/blogProdukty";
import { katalogWidoczny } from "@/lib/produktyDb";
import { kluczWariantu, type Zwiniety } from "@/lib/warianty";
import { BAZA_URL, NAZWA_SKLEPU, jsonLd } from "@/lib/seo";

// Produkty w treści pochodzą z katalogu — odświeżane co 10 minut (wyprzedane znikają same).
export const revalidate = 600;

// Kotwica nagłówka (spis treści): „Kiedy lepszy pajacyk" → „kiedy-lepszy-pajacyk".
function kotwica(t: string): string {
  return t
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

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
  if (b.typ === "h2")
    return (
      <h2 id={kotwica(b.tekst)} className="mt-6 scroll-mt-24 text-[22px] font-extrabold leading-snug tracking-tight md:text-[25px]">
        {b.tekst}
      </h2>
    );
  if (b.typ === "ul")
    return (
      <ul className="flex flex-col gap-2.5 text-[16px] leading-[1.7] text-ink md:text-[17px]">
        {b.punkty.map((p, i) => (
          <li key={i} className="relative pl-6 before:absolute before:left-1 before:top-[0.7em] before:h-2 before:w-2 before:rounded-full before:bg-akcent">
            {tekstZLinkami(p)}
          </li>
        ))}
      </ul>
    );
  return <p className="text-[16px] leading-[1.75] text-ink md:text-[17px]">{tekstZLinkami(b.tekst)}</p>;
}

// Pas produktów w treści artykułu: na telefonie przewijany palcem, na komputerze 4 kafelki.
function PasWTresci({ pas, produkty }: { pas: PasProduktow; produkty: Zwiniety[] }) {
  return (
    <aside className="my-4 rounded-2xl bg-szary/60 p-4 md:p-5" aria-label={`Produkty: ${pas.tytul}`}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div>
          <p className="text-[11.5px] font-bold uppercase tracking-wide text-akcent">Z naszego sklepu</p>
          <h3 className="text-[17px] font-extrabold tracking-tight md:text-[18px]">{pas.tytul}</h3>
        </div>
        <Link href={pas.link} className="-my-2 shrink-0 py-2 text-[13.5px] font-bold text-ink no-underline hover:text-akcent">
          {pas.linkTekst ?? "Zobacz wszystkie"} →
        </Link>
      </div>
      <div className="-mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
        {produkty.map(({ produkt, kolory, cenaMin, cenyRozne }, i) => (
          <div key={produkt.id} className={`w-[42%] shrink-0 snap-start sm:w-auto ${i >= 4 ? "sm:hidden" : ""}`}>
            <KartaProduktu produkt={produkt} liczbaKolorow={kolory} cenaOd={cenyRozne ? cenaMin : undefined} />
          </div>
        ))}
      </div>
    </aside>
  );
}

export default async function Artykul({ params }: { params: { slug: string } }) {
  const a = znajdzArtykul(params.slug);
  if (!a) notFound();

  // Produkty do wplecenia w treść — po sekcji o danym nagłówku; bez powtórek modeli w artykule.
  const katalog = await katalogWidoczny();
  const pokazane = new Set<string>();
  const pasyPoSekcji = new Map<string, { pas: PasProduktow; produkty: Zwiniety[] }[]>();
  for (const pas of pasyDlaArtykulu(a.slug)) {
    const produkty = wybierzProdukty(katalog, pas.wybor, pokazane);
    if (!produkty.length) continue;
    produkty.forEach((z) => pokazane.add(kluczWariantu(z.produkt)));
    pasyPoSekcji.set(pas.po, [...(pasyPoSekcji.get(pas.po) ?? []), { pas, produkty }]);
  }

  // Treść w sekcjach (od nagłówka do nagłówka) — pas produktów zamyka swoją sekcję.
  const sekcje: { h2: string | null; bloki: Blok[] }[] = [{ h2: null, bloki: [] }];
  for (const b of a.tresc) {
    if (b.typ === "h2") sekcje.push({ h2: b.tekst, bloki: [b] });
    else sekcje[sekcje.length - 1].bloki.push(b);
  }
  const naglowki = a.tresc.filter((b): b is Extract<Blok, { typ: "h2" }> => b.typ === "h2").map((b) => b.tekst);

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
    <div className="overflow-x-clip">
      <Nawigacja />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />

      <article className="mx-auto max-w-[720px] px-5 py-12 sm:px-6 md:py-16">
        <nav className="mb-4 text-[12.5px] text-ink-2">
          <Link href="/blog" className="no-underline hover:text-akcent">Blog</Link> / <span className="text-ink">{a.kategoria}</span>
        </nav>
        <h1 className="mb-3 text-[30px] font-extrabold leading-tight tracking-tight md:text-[40px]">{a.tytul}</h1>
        <p className="mb-6 text-[13px] text-ink-2">
          {DATA_PL(a.data)} · {a.czasCzytania} min czytania
        </p>

        {a.zdjecie ? (
          <div className="relative mb-8 aspect-[16/9] w-full overflow-hidden rounded-xl">
            <Image src={a.zdjecie} alt={a.tytul} fill priority sizes="(max-width: 768px) 100vw, 720px" className="object-cover" />
          </div>
        ) : null}

        {naglowki.length >= 3 ? (
          <nav aria-label="Spis treści" className="mb-8 rounded-2xl border border-linia bg-white p-5">
            <p className="mb-2.5 text-[13px] font-bold uppercase tracking-wide text-ink-2">W tym artykule</p>
            <ol className="flex flex-col gap-1.5 text-[15px]">
              {naglowki.map((h, i) => (
                <li key={h} className="flex gap-2.5">
                  <span className="w-5 shrink-0 text-right font-bold text-ink-2">{i + 1}.</span>
                  <a href={`#${kotwica(h)}`} className="text-ink no-underline hover:text-akcent hover:underline">
                    {h}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        ) : null}

        <div className="flex flex-col gap-4">
          {sekcje.map((s, si) => (
            <section key={si} className="flex flex-col gap-4">
              {s.bloki.map((b, i) => (
                <Blok key={i} b={b} />
              ))}
              {s.h2 ? (pasyPoSekcji.get(s.h2) ?? []).map(({ pas, produkty }) => <PasWTresci key={pas.tytul} pas={pas} produkty={produkty} />) : null}
            </section>
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
          <Link href="/produkty" className="inline-block rounded-lg bg-ink px-8 py-3.5 text-[14.5px] font-bold text-white no-underline transition-colors hover:bg-akcent">
            Przeglądaj ubranka
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
