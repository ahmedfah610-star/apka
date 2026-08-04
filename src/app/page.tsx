import Link from "next/link";
import { Nawigacja } from "@/components/Nawigacja";
import { Hero } from "@/components/Hero";
import { KartaProduktu } from "@/components/KartaProduktu";
import { KafelKategorii } from "@/components/KafelKategorii";
import { Newsletter } from "@/components/Newsletter";
import { Reveal } from "@/components/Reveal";
import { Stopka } from "@/components/Stopka";
import { type Kategoria, type Produkt } from "@/data/produkty";
import { katalogWidoczny } from "@/lib/produktyDb";

export const dynamic = "force-dynamic";

const KATEGORIE: { key: Kategoria; label: string; hue: number }[] = [
  { key: "dziewczynki", label: "Dziewczynki", hue: 30 },
  { key: "chlopcy", label: "Chłopcy", hue: 250 },
  { key: "niemowleta", label: "Niemowlęta", hue: 140 },
];

function reprKategorii(lista: Produkt[], kat: Kategoria): Produkt | null {
  return lista.find((p) => p.kategoria === kat && (p.zdjecia?.length || p.zdjecie)) ?? lista.find((p) => p.kategoria === kat) ?? null;
}

export default async function StronaGlowna() {
  const katalog = await katalogWidoczny();
  const wyrozniona = katalog.filter((p) => p.badge).slice(0, 4);

  return (
    <div className="overflow-x-hidden">
      {/* Pasek informacyjny */}
      <div className="bg-ink px-4 py-[9px] text-center text-[13px] text-tlo">
        Darmowa dostawa od 150 zł
      </div>

      <Nawigacja aktywna="home" />

      <Hero />

      {/* Kategorie */}
      <section className="px-6 py-20 md:px-12">
        <Reveal className="mx-auto max-w-content">
          <h2 className="mb-8 text-[26px] font-bold tracking-tight">Kupuj według kategorii</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {KATEGORIE.map((k, i) => (
              <Reveal key={k.key} delay={i * 120}>
                <KafelKategorii kluczKat={k.key} label={k.label} fallbackSrc={reprKategorii(katalog, k.key)?.zdjecie ?? null} />
              </Reveal>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Bestsellery */}
      <section className="px-6 pb-20 md:px-12">
        <Reveal className="mx-auto max-w-content">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="text-[26px] font-bold tracking-tight">Bestsellery i nowości</h2>
            <Link href="/produkty" className="text-sm text-ink-2 no-underline hover:text-akcent">
              Zobacz wszystkie →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
            {wyrozniona.map((p, i) => (
              <Reveal key={p.id} delay={i * 90}>
                <KartaProduktu produkt={p} />
              </Reveal>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Kontakt / pomoc */}
      <Reveal>
        <section className="bg-ink px-6 py-16 md:px-12">
          <div className="mx-auto flex max-w-content flex-col items-start justify-between gap-7 md:flex-row md:items-center">
            <div className="text-tlo">
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.2em] text-akcent">Pomoc i kontakt</p>
              <h2 className="text-[28px] font-bold tracking-tight md:text-[32px]">Masz pytanie? Chętnie pomożemy</h2>
              <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-tlo/75">
                Doradzimy w doborze rozmiaru, pomożemy z zamówieniem lub zwrotem. Napisz do nas — odpisujemy
                zwykle tego samego dnia roboczego.
              </p>
              <a
                href="mailto:kontakt@bobas-shopping.pl"
                className="mt-3 inline-block text-[15px] font-medium text-tlo underline decoration-akcent underline-offset-4 transition-colors hover:text-akcent"
              >
                kontakt@bobas-shopping.pl
              </a>
            </div>
            <Link
              href="/kontakt"
              className="shrink-0 bg-tlo px-8 py-3.5 text-[13px] font-semibold tracking-wide text-ink no-underline transition-colors hover:bg-akcent hover:text-tlo"
            >
              NAPISZ DO NAS
            </Link>
          </div>
        </section>
      </Reveal>

      {/* O marce */}
      <section className="px-6 py-20 md:px-12">
        <Reveal className="mx-auto grid max-w-content grid-cols-1 gap-10 sm:grid-cols-3">
          {[
            { t: "Miękkie i oddychające", o: "Tkaniny przyjazne skórze — nie drapią i nie krępują ruchów." },
            { t: "Bezpieczne materiały", o: "Certyfikowane bawełny, bez szkodliwych barwników." },
            { t: "Gotowe do zabawy", o: "Wytrzymałe szwy i pranie, które wybaczają każdą przygodę." },
          ].map((c) => (
            <div key={c.t}>
              <div className="mb-4 h-8 w-8 border-[1.5px] border-ink" />
              <h3 className="mb-2 text-[17px] font-semibold">{c.t}</h3>
              <p className="text-sm text-ink-2">{c.o}</p>
            </div>
          ))}
        </Reveal>
      </section>

      <Newsletter />
      <Stopka />
    </div>
  );
}
