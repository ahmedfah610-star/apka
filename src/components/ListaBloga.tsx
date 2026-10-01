"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export interface WpisListy {
  slug: string;
  tytul: string;
  opis: string;
  data: string;
  czasCzytania: number;
  kategoria: string;
  hue: number;
  zdjecie?: string;
}

const DATA_PL = (iso: string) => new Date(iso).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });

function Okladka({ w, sizes, priority = false, klasa }: { w: WpisListy; sizes: string; priority?: boolean; klasa: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl ${klasa}`}
      style={{ background: `linear-gradient(135deg, oklch(94% 0.04 ${w.hue}) 0%, oklch(88% 0.07 ${w.hue}) 100%)` }}
    >
      {w.zdjecie ? (
        <Image src={w.zdjecie} alt={w.tytul} fill priority={priority} sizes={sizes} className="object-cover transition-transform duration-500 group-hover:scale-105" />
      ) : null}
      <span className="absolute bottom-3 left-3 z-10 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-ink shadow-sm">
        {w.kategoria}
      </span>
    </div>
  );
}

// Lista wpisów: wyróżniony najnowszy + siatka, filtr kategorii (wszystko jest w HTML — filtr tylko ukrywa).
export function ListaBloga({ wpisy }: { wpisy: WpisListy[] }) {
  const [kat, setKat] = useState<string | null>(null);
  const kategorie = [...new Set(wpisy.map((w) => w.kategoria))].map((k) => ({ k, n: wpisy.filter((w) => w.kategoria === k).length }));
  const widoczne = kat ? wpisy.filter((w) => w.kategoria === kat) : wpisy;
  const [glowny, ...reszta] = widoczne;

  const chip = (aktywny: boolean) =>
    `shrink-0 rounded-full border px-3.5 py-2 text-[13.5px] font-semibold transition-colors ${
      aktywny ? "border-ink bg-ink text-white" : "border-linia-2 bg-white text-ink hover:border-ink"
    }`;

  return (
    <>
      <div className="-mx-5 mb-7 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
        <button type="button" onClick={() => setKat(null)} className={chip(kat === null)}>
          Wszystkie <span className="opacity-60">{wpisy.length}</span>
        </button>
        {kategorie.map(({ k, n }) => (
          <button key={k} type="button" onClick={() => setKat(k)} className={chip(kat === k)}>
            {k} <span className="opacity-60">{n}</span>
          </button>
        ))}
      </div>

      {glowny ? (
        <Link href={`/blog/${glowny.slug}`} className="group mb-10 grid items-center gap-5 text-inherit no-underline md:grid-cols-[1.35fr_1fr] md:gap-9">
          <Okladka w={glowny} priority sizes="(max-width: 768px) 100vw, 58vw" klasa="aspect-[16/9]" />
          <div>
            <p className="mb-2 text-[12.5px] font-bold uppercase tracking-wide text-akcent">{kat ? "Poradnik" : "Najnowszy poradnik"}</p>
            <h2 className="mb-3 text-[24px] font-extrabold leading-tight tracking-tight transition-colors group-hover:text-akcent md:text-[30px]">{glowny.tytul}</h2>
            <p className="mb-4 text-[15px] leading-relaxed text-ink-2 md:text-[16px]">{glowny.opis}</p>
            <p className="text-[13px] text-ink-2">
              {DATA_PL(glowny.data)} · {glowny.czasCzytania} min czytania
            </p>
            <span className="mt-5 inline-block rounded-lg bg-ink px-5 py-3 text-[14px] font-bold text-white transition-colors group-hover:bg-akcent">Czytaj poradnik</span>
          </div>
        </Link>
      ) : null}

      {reszta.length ? (
        <div className="grid grid-cols-1 gap-x-7 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {reszta.map((w) => (
            <Link key={w.slug} href={`/blog/${w.slug}`} className="group flex flex-col text-inherit no-underline">
              <Okladka w={w} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" klasa="mb-4 aspect-[16/9]" />
              <h3 className="mb-1.5 text-[18px] font-bold leading-snug transition-colors group-hover:text-akcent">{w.tytul}</h3>
              <p className="mb-3 line-clamp-3 text-[14px] leading-relaxed text-ink-2">{w.opis}</p>
              <span className="mt-auto text-[12.5px] text-ink-2">
                {DATA_PL(w.data)} · {w.czasCzytania} min czytania
              </span>
            </Link>
          ))}
        </div>
      ) : null}
    </>
  );
}
