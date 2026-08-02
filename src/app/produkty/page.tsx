"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Nawigacja } from "@/components/Nawigacja";
import { KartaProduktu } from "@/components/KartaProduktu";
import { Stopka } from "@/components/Stopka";
import { KATEGORIE_LABEL, PRODUKTY, WSZYSTKIE_ROZMIARY } from "@/data/produkty";
import {
  filtrujProdukty,
  type FiltrKategoria,
  type FiltrWiek,
  type Sortowanie,
} from "@/lib/filtrowanie";

const KATEGORIE: { key: FiltrKategoria; label: string }[] = [
  { key: "wszystkie", label: "Wszystkie" },
  { key: "dziewczynki", label: "Dziewczynki" },
  { key: "chlopcy", label: "Chłopcy" },
  { key: "niemowleta", label: "Niemowlęta" },
];

const WIEKI: { key: FiltrWiek; label: string }[] = [
  { key: "0-2", label: "0-2 lata" },
  { key: "2-6", label: "2-6 lat" },
  { key: "6-12", label: "6-12 lat" },
];

function Listing() {
  const params = useSearchParams();
  const startKat = params.get("kategoria");
  const poczatkowa: FiltrKategoria =
    startKat && startKat !== "wyprzedaz" && startKat in KATEGORIE_LABEL
      ? (startKat as FiltrKategoria)
      : "wszystkie";

  const [kategoria, setKategoria] = useState<FiltrKategoria>(poczatkowa);
  const [wiek, setWiek] = useState<FiltrWiek>("wszystkie");
  const [sortBy, setSortBy] = useState<Sortowanie>("domyslnie");

  const produkty = useMemo(
    () => filtrujProdukty(PRODUKTY, { kategoria, wiek, sortBy }),
    [kategoria, wiek, sortBy],
  );

  const toggleKat = (k: FiltrKategoria) => setKategoria((c) => (c === k ? "wszystkie" : k));
  const toggleWiek = (w: FiltrWiek) => setWiek((c) => (c === w ? "wszystkie" : w));
  const reset = () => {
    setKategoria("wszystkie");
    setWiek("wszystkie");
    setSortBy("domyslnie");
  };

  return (
    <div className="overflow-x-hidden">
      <Nawigacja aktywna="produkty" />

      <div className="mx-auto max-w-content px-6 pb-2 pt-11 md:px-12">
        <h1 className="mb-1.5 text-[32px] font-bold tracking-tight">
          {KATEGORIE_LABEL[kategoria]}
        </h1>
        <p className="mb-7 text-[15px] text-ink-2">{produkty.length} produktów</p>
      </div>

      <div className="mx-auto grid max-w-content grid-cols-1 gap-11 px-6 pb-24 md:grid-cols-[240px_1fr] md:px-12">
        {/* Filtry */}
        <aside className="flex flex-col gap-8">
          <div>
            <h3 className="mb-4 text-[13px] font-semibold tracking-wide text-ink-2">KATEGORIA</h3>
            <div className="flex flex-col gap-3">
              {KATEGORIE.map((c) => {
                const on = kategoria === c.key;
                return (
                  <button key={c.key} onClick={() => toggleKat(c.key)} className="flex items-center gap-2.5 text-left">
                    <span
                      className="h-3.5 w-3.5 shrink-0 border-[1.5px]"
                      style={{ borderColor: on ? "var(--ink)" : "oklch(80% 0.005 90)", background: on ? "var(--ink)" : "transparent" }}
                    />
                    <span className={`text-sm ${on ? "font-bold text-ink" : "font-medium text-ink-2"}`}>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-[13px] font-semibold tracking-wide text-ink-2">WIEK</h3>
            <div className="flex flex-col gap-3">
              {WIEKI.map((a) => {
                const on = wiek === a.key;
                return (
                  <button key={a.key} onClick={() => toggleWiek(a.key)} className="flex items-center gap-2.5 text-left">
                    <span
                      className="h-3.5 w-3.5 shrink-0 rounded-full border-[1.5px]"
                      style={{ borderColor: on ? "var(--ink)" : "oklch(80% 0.005 90)", background: on ? "var(--ink)" : "transparent" }}
                    />
                    <span className={`text-sm ${on ? "font-bold text-ink" : "font-medium text-ink-2"}`}>{a.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-[13px] font-semibold tracking-wide text-ink-2">ROZMIAR</h3>
            <div className="flex flex-wrap gap-2">
              {WSZYSTKIE_ROZMIARY.map((s) => (
                <span
                  key={s}
                  className="cursor-pointer border border-linia-2 px-[11px] py-1.5 text-[12.5px] font-medium hover:border-ink"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          <button onClick={reset} className="self-start text-[13.5px] text-ink underline underline-offset-[3px]">
            Wyczyść filtry
          </button>
        </aside>

        {/* Grid produktów */}
        <div>
          <div className="mb-6 flex justify-end">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as Sortowanie)}
              className="border border-linia-2 bg-white px-3.5 py-2.5 text-[13.5px] text-ink"
            >
              <option value="domyslnie">Sortuj: polecane</option>
              <option value="cena-rosnaco">Cena: od najniższej</option>
              <option value="cena-malejaco">Cena: od najwyższej</option>
            </select>
          </div>

          {produkty.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-3">
              {produkty.map((p) => (
                <KartaProduktu key={p.id} produkt={p} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-ink-2">
              <p className="mb-2 text-[17px] font-semibold">Brak produktów dla tych filtrów</p>
              <p className="text-sm">Spróbuj wyczyścić filtry powyżej.</p>
            </div>
          )}
        </div>
      </div>

      <Stopka />
    </div>
  );
}

export default function StronaProduktow() {
  return (
    <Suspense fallback={<div className="p-12 text-ink-2">Ładowanie…</div>}>
      <Listing />
    </Suspense>
  );
}
