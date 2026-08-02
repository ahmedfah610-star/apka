"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * Kafel kategorii ze zdjęciem lifestyle (public/img/kat-<klucz>.jpg).
 * Gdy zdjęcia nie ma — automatycznie wraca do zdjęcia produktu (fallback).
 */
export function KafelKategorii({
  kluczKat,
  label,
  fallbackSrc,
}: {
  kluczKat: string;
  label: string;
  fallbackSrc?: string | null;
}) {
  const [src, setSrc] = useState<string | null>(`/img/kat-${kluczKat}.jpg`);
  const [lifestyle, setLifestyle] = useState(true);

  function blad() {
    if (lifestyle && fallbackSrc) {
      setSrc(fallbackSrc);
      setLifestyle(false);
    } else {
      setSrc(null);
    }
  }

  return (
    <Link href={`/produkty?kategoria=${kluczKat}`} className="group block text-inherit no-underline">
      <div
        className="relative flex h-[380px] items-center justify-center overflow-hidden md:h-[460px]"
        style={{ background: "linear-gradient(165deg, oklch(97% 0.008 60), oklch(94% 0.02 45))" }}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={label}
            onError={blad}
            className={`h-full w-full transition-transform duration-500 group-hover:scale-105 ${
              lifestyle ? "object-cover" : "object-contain p-8"
            }`}
          />
        ) : null}
        {lifestyle && src ? (
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/45 to-transparent" />
        ) : null}
        {lifestyle && src ? (
          <span className="absolute bottom-5 left-6 text-[24px] font-bold tracking-tight text-white">{label}</span>
        ) : null}
      </div>
      {!(lifestyle && src) ? (
        <div className="flex items-center justify-between py-4">
          <span className="text-[17px] font-semibold">{label}</span>
          <span className="text-sm text-ink-2 transition-colors group-hover:text-akcent">Zobacz →</span>
        </div>
      ) : (
        <div className="flex items-center justify-end py-3">
          <span className="text-sm text-ink-2 transition-colors group-hover:text-akcent">Zobacz →</span>
        </div>
      )}
    </Link>
  );
}
