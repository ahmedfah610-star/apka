"use client";

import { useRef, useState } from "react";
import type { CSSProperties } from "react";

export function Galeria({
  zdjecia,
  alt,
  placeholder,
}: {
  zdjecia: string[];
  alt: string;
  placeholder?: CSSProperties;
}) {
  const [idx, setIdx] = useState(0);
  const glowne = zdjecia[idx];
  const tasma = useRef<HTMLDivElement>(null);

  // Telefon: numer zdjęcia z pozycji przewinięcia taśmy.
  function przewinieto() {
    const el = tasma.current;
    if (!el || !el.clientWidth) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== idx) setIdx(i);
  }

  function pokaz(i: number) {
    setIdx(i);
    const el = tasma.current;
    if (el && el.clientWidth) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }

  if (!zdjecia.length) {
    return (
      <div className="flex aspect-square items-center justify-center bg-white md:rounded-2xl" style={placeholder}>
        <span className="font-mono text-[12px] text-ink-2">zdjęcie produktu</span>
      </div>
    );
  }

  return (
    <div>
      {/* Telefon: przesuwane palcem */}
      <div className="relative bg-white md:hidden">
        <div
          ref={tasma}
          onScroll={przewinieto}
          className="flex aspect-square snap-x snap-mandatory overflow-x-auto overscroll-x-contain [&::-webkit-scrollbar]:hidden"
        >
          {zdjecia.map((z, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={z}
              alt={i === 0 ? alt : `${alt} — zdjęcie ${i + 1}`}
              loading={i === 0 ? "eager" : "lazy"}
              className="h-full w-full shrink-0 snap-center object-contain p-3"
            />
          ))}
        </div>
        {zdjecia.length > 1 ? (
          <>
            <span className="absolute right-3 top-3 rounded-full bg-ink/75 px-2.5 py-1 text-[12px] font-bold text-white">
              {idx + 1} / {zdjecia.length}
            </span>
            <div className="absolute inset-x-0 bottom-2.5 flex justify-center gap-1.5">
              {zdjecia.map((_, i) => (
                <button
                  key={i}
                  onClick={() => pokaz(i)}
                  aria-label={`Zdjęcie ${i + 1}`}
                  className={`h-2 rounded-full transition-all ${i === idx ? "w-5 bg-ink" : "w-2 bg-ink/25"}`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      {/* Komputer: duże zdjęcie + miniatury */}
      <div className="hidden md:block">
        <div className="flex aspect-square items-center justify-center overflow-hidden bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={glowne} alt={alt} className="h-full w-full object-contain p-6" />
        </div>

        {zdjecia.length > 1 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {zdjecia.map((z, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`h-16 w-16 overflow-hidden border bg-white ${i === idx ? "border-ink" : "border-linia-2 hover:border-ink"}`}
                aria-label={`Zdjęcie ${i + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={z} alt="" className="h-full w-full object-contain p-1" />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
