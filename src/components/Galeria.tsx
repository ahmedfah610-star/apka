"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties } from "react";
import { zdjecie, zestawZdjec } from "@/lib/zdjecia";

// Galeria jak w poście: zdjęcia przesuwa się palcem, myszką (przeciągnij) albo strzałkami;
// kropki, licznik i miniatury pokazują, gdzie jesteś. Klik w zdjęcie → pełny ekran.

function useSuwak(liczba: number, start = 0) {
  const tasma = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(start);

  const idz = useCallback(
    (i: number, plynnie = true) => {
      const el = tasma.current;
      const cel = Math.max(0, Math.min(liczba - 1, i));
      setIdx(cel);
      if (el && el.clientWidth) el.scrollTo({ left: cel * el.clientWidth, behavior: plynnie ? "smooth" : "auto" });
    },
    [liczba],
  );

  // Pozycja z przewinięcia (palec, gładzik).
  const przewinieto = () => {
    const el = tasma.current;
    if (!el || !el.clientWidth) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== idx) setIdx(i);
  };

  // Przeciąganie myszką (na komputerze taśmy nie da się „złapać" jak palcem).
  const ciag = useRef<{ x: number; left: number; przesuniecie: number } | null>(null);
  const ostatniPrzesuw = useRef(0); // ile przeciągnięto przy ostatnim puszczeniu (klik ≠ przeciągnięcie)
  const [ciagnie, setCiagnie] = useState(false);
  const zdarzenia = {
    onScroll: przewinieto,
    onPointerDown: (e: React.PointerEvent) => {
      ostatniPrzesuw.current = 0;
      if (e.pointerType !== "mouse" || e.button !== 0 || !tasma.current) return;
      ciag.current = { x: e.clientX, left: tasma.current.scrollLeft, przesuniecie: 0 };
      setCiagnie(true);
    },
    onPointerMove: (e: React.PointerEvent) => {
      const c = ciag.current;
      if (!c || !tasma.current) return;
      c.przesuniecie = e.clientX - c.x;
      tasma.current.scrollLeft = c.left - c.przesuniecie;
    },
    onPointerUp: () => {
      const c = ciag.current;
      const el = tasma.current;
      ciag.current = null;
      setCiagnie(false);
      ostatniPrzesuw.current = Math.abs(c?.przesuniecie ?? 0);
      if (!c || !el || !el.clientWidth) return;
      // Wystarczy krótki ruch, żeby przejść do następnego zdjęcia.
      const prog = el.clientWidth * 0.12;
      idz(c.przesuniecie < -prog ? idx + 1 : c.przesuniecie > prog ? idx - 1 : idx);
    },
    onPointerLeave: () => {
      if (ciag.current) zdarzenia.onPointerUp();
    },
  };
  const bylPrzesuw = () => ostatniPrzesuw.current > 5;

  return { tasma, idx, idz, zdarzenia, ciagnie, bylPrzesuw };
}

function Strzalka({ kierunek, onClick, ciemna = false }: { kierunek: "lewo" | "prawo"; onClick: () => void; ciemna?: boolean }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={kierunek === "lewo" ? "Poprzednie zdjęcie" : "Następne zdjęcie"}
      className={`absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full shadow-md transition-transform hover:scale-105 ${
        kierunek === "lewo" ? "left-3" : "right-3"
      } ${ciemna ? "bg-white/15 text-white hover:bg-white/25" : "bg-white/95 text-ink"}`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
        <path d={kierunek === "lewo" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
      </svg>
    </button>
  );
}

function Kropki({ liczba, idx, idz, jasne = false }: { liczba: number; idx: number; idz: (i: number) => void; jasne?: boolean }) {
  return (
    <div className="flex justify-center">
      {Array.from({ length: liczba }, (_, i) => (
        <button key={i} type="button" onClick={() => idz(i)} aria-label={`Zdjęcie ${i + 1}`} className="flex h-6 items-center px-1">
          <span
            className={`block h-2 rounded-full transition-all ${
              i === idx ? `w-5 ${jasne ? "bg-white" : "bg-ink"}` : `w-2 ${jasne ? "bg-white/35" : "bg-black/20"}`
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function PelnyEkran({ zdjecia, alt, start, onZamknij }: { zdjecia: string[]; alt: string; start: number; onZamknij: () => void }) {
  const { tasma, idx, idz, zdarzenia, ciagnie } = useSuwak(zdjecia.length, start);

  useEffect(() => {
    idz(start, false);
    const poprzedni = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = poprzedni;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const klawisz = (e: KeyboardEvent) => {
      if (e.key === "Escape") onZamknij();
      if (e.key === "ArrowRight") idz(idx + 1);
      if (e.key === "ArrowLeft") idz(idx - 1);
    };
    window.addEventListener("keydown", klawisz);
    return () => window.removeEventListener("keydown", klawisz);
  }, [idx, idz, onZamknij]);

  return createPortal(
    <div className="fixed inset-0 z-[95] flex flex-col bg-[#0d0d0d]" role="dialog" aria-modal="true" aria-label="Zdjęcia produktu">
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <span className="text-[14px] font-bold">
          {idx + 1} / {zdjecia.length}
        </span>
        <button type="button" onClick={onZamknij} aria-label="Zamknij" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
      <div className="relative min-h-0 flex-1">
        <div
          ref={tasma}
          {...zdarzenia}
          className={`flex h-full snap-x snap-mandatory overflow-x-auto overscroll-contain [&::-webkit-scrollbar]:hidden ${ciagnie ? "cursor-grabbing snap-none" : "cursor-grab"}`}
        >
          {zdjecia.map((z, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={zdjecie(z, "s1024")}
              alt={`${alt} — zdjęcie ${i + 1}`}
              loading={Math.abs(i - idx) <= 1 ? "eager" : "lazy"}
              draggable={false}
              className="h-full w-full shrink-0 snap-center select-none object-contain px-2 md:px-16"
            />
          ))}
        </div>
        {zdjecia.length > 1 ? (
          <div className="hidden md:block">
            {idx > 0 ? <Strzalka kierunek="lewo" ciemna onClick={() => idz(idx - 1)} /> : null}
            {idx < zdjecia.length - 1 ? <Strzalka kierunek="prawo" ciemna onClick={() => idz(idx + 1)} /> : null}
          </div>
        ) : null}
      </div>
      {zdjecia.length > 1 ? (
        <div className="py-3">
          <Kropki liczba={zdjecia.length} idx={idx} idz={idz} jasne />
        </div>
      ) : null}
    </div>,
    document.body,
  );
}

export function Galeria({
  zdjecia,
  alt,
  placeholder,
}: {
  zdjecia: string[];
  alt: string;
  placeholder?: CSSProperties;
}) {
  const { tasma, idx, idz, zdarzenia, ciagnie, bylPrzesuw } = useSuwak(zdjecia.length);
  const [pelny, setPelny] = useState<number | null>(null);

  if (!zdjecia.length) {
    return (
      <div className="flex aspect-square items-center justify-center bg-white md:rounded-2xl" style={placeholder}>
        <span className="font-mono text-[12px] text-ink-2">zdjęcie produktu</span>
      </div>
    );
  }

  const wiele = zdjecia.length > 1;

  return (
    <div>
      <div
        className="group relative overflow-hidden bg-white md:rounded-2xl"
        tabIndex={0}
        aria-roledescription="karuzela"
        aria-label="Zdjęcia produktu — przesuń, żeby zobaczyć kolejne"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") idz(idx + 1);
          if (e.key === "ArrowLeft") idz(idx - 1);
        }}
      >
        <div
          ref={tasma}
          {...zdarzenia}
          className={`flex aspect-square snap-x snap-mandatory overflow-x-auto overscroll-x-contain [&::-webkit-scrollbar]:hidden ${
            ciagnie ? "cursor-grabbing snap-none" : "md:cursor-grab"
          }`}
        >
          {zdjecia.map((z, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={zdjecie(z, "s720")}
              srcSet={zestawZdjec(z, ["s512", "s720", "s1024"])}
              sizes="(max-width: 768px) 100vw, 600px"
              alt={i === 0 ? alt : `${alt} — zdjęcie ${i + 1}`}
              loading={i === 0 ? "eager" : "lazy"}
              draggable={false}
              onClick={() => {
                if (!bylPrzesuw()) setPelny(i); // klik (nie przeciągnięcie) → pełny ekran
              }}
              className="h-full w-full shrink-0 cursor-zoom-in snap-center select-none object-contain p-3 md:p-6"
            />
          ))}
        </div>

        {wiele ? (
          <>
            <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[12px] font-bold text-white">
              {idx + 1} / {zdjecia.length}
            </span>
            {/* Strzałki: na komputerze po najechaniu, na telefonie wystarcza palec */}
            <div className="hidden opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 md:block">
              {idx > 0 ? <Strzalka kierunek="lewo" onClick={() => idz(idx - 1)} /> : null}
              {idx < zdjecia.length - 1 ? <Strzalka kierunek="prawo" onClick={() => idz(idx + 1)} /> : null}
            </div>
            <div className="absolute inset-x-0 bottom-1">
              <Kropki liczba={zdjecia.length} idx={idx} idz={idz} />
            </div>
          </>
        ) : null}

        <button
          type="button"
          onClick={() => setPelny(idx)}
          aria-label="Powiększ zdjęcie"
          className="absolute bottom-3 right-3 hidden h-9 w-9 items-center justify-center rounded-full bg-white/95 text-ink shadow-md md:flex"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="11" cy="11" r="6.5" />
            <path d="m20 20-4.2-4.2M11 8.5v5M8.5 11h5" />
          </svg>
        </button>
      </div>

      {wiele ? (
        <div className="mt-3 flex gap-2 overflow-x-auto px-4 pb-1 md:px-0 [&::-webkit-scrollbar]:hidden">
          {zdjecia.map((z, i) => (
            <button
              key={i}
              type="button"
              onClick={() => idz(i)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-white transition-colors ${
                i === idx ? "border-ink" : "border-transparent opacity-70 hover:opacity-100"
              }`}
              aria-label={`Zdjęcie ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={zdjecie(z, "s128")} alt="" loading="lazy" className="h-full w-full object-contain p-1" />
            </button>
          ))}
        </div>
      ) : null}

      {pelny !== null ? <PelnyEkran zdjecia={zdjecia} alt={alt} start={pelny} onZamknij={() => setPelny(null)} /> : null}
    </div>
  );
}
