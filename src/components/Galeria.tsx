"use client";

import { useState } from "react";
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

  return (
    <div>
      <div
        className="flex aspect-square items-center justify-center overflow-hidden bg-white"
        style={glowne ? undefined : placeholder}
      >
        {glowne ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={glowne} alt={alt} className="h-full w-full object-contain p-6" />
        ) : (
          <span className="font-mono text-[12px] text-ink-2">zdjęcie produktu</span>
        )}
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
  );
}
