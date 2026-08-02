"use client";

import { useEffect, useRef, useState } from "react";
import { GeowidgetInpost, geowidgetDostepny } from "@/components/GeowidgetInpost";
import { MapaPaczkomatow } from "@/components/MapaPaczkomatow";

export interface Paczkomat {
  kod: string;
  opis: string;
  miasto: string;
  lat?: number;
  lng?: number;
}

export function WyborPaczkomatu({
  wybrany,
  onWybierz,
}: {
  wybrany: Paczkomat | null;
  onWybierz: (p: Paczkomat) => void;
}) {
  const [otwarte, setOtwarte] = useState(false);
  const [trybListy, setTrybListy] = useState(false);
  const [q, setQ] = useState("");
  const [wyniki, setWyniki] = useState<Paczkomat[]>([]);
  const [ladowanie, setLadowanie] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const geowidget = geowidgetDostepny() && !trybListy;

  useEffect(() => {
    if (!otwarte || geowidget) return;
    const fraza = q.trim();
    if (timer.current) clearTimeout(timer.current);
    if (fraza.length < 2) {
      setWyniki([]);
      setLadowanie(false);
      return;
    }
    setLadowanie(true);
    timer.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/paczkomaty?q=${encodeURIComponent(fraza)}`);
        const d = (await r.json()) as { items: Paczkomat[] };
        setWyniki(d.items ?? []);
      } catch {
        setWyniki([]);
      }
      setLadowanie(false);
    }, 350);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [q, otwarte, geowidget]);

  const wybierz = (p: Paczkomat) => {
    onWybierz(p);
    setOtwarte(false);
  };

  return (
    <div className="mt-3">
      {wybrany ? (
        <div className="flex items-center justify-between border border-ink bg-white px-4 py-3">
          <div className="min-w-0">
            <p className="text-[14px] font-semibold">Paczkomat {wybrany.kod}</p>
            <p className="truncate text-[13px] text-ink-2">{[wybrany.miasto, wybrany.opis].filter(Boolean).join(", ")}</p>
          </div>
          <button onClick={() => setOtwarte(true)} className="shrink-0 text-[13px] underline underline-offset-2 hover:text-akcent">
            Zmień
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOtwarte(true)}
          className="w-full border border-dashed border-ink-2 px-4 py-3 text-[14px] font-medium text-ink transition-colors hover:border-ink"
        >
          📍 Wybierz paczkomat na mapie
        </button>
      )}

      {otwarte ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="flex h-[85vh] w-full max-w-2xl flex-col bg-tlo">
            <div className="flex items-center justify-between border-b border-linia px-5 py-4">
              <h3 className="text-[16px] font-bold">Wybierz paczkomat InPost</h3>
              <button onClick={() => setOtwarte(false)} aria-label="Zamknij" className="text-ink-2 hover:text-ink">
                ✕
              </button>
            </div>

            {geowidget ? (
              <>
                <div className="min-h-0 flex-1">
                  <GeowidgetInpost onWybierz={wybierz} />
                </div>
                <button
                  onClick={() => setTrybListy(true)}
                  className="border-t border-linia px-5 py-2.5 text-left text-[12px] text-ink-2 hover:text-akcent"
                >
                  Mapa się nie ładuje? Wybierz z listy →
                </button>
              </>
            ) : (
              <>
                <div className="border-b border-linia p-4">
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    autoFocus
                    placeholder="Wpisz miasto, np. Warszawa"
                    className="w-full border border-linia-2 bg-white px-3.5 py-2.5 text-[14px] outline-none focus:border-ink"
                  />
                </div>
                {/* Mapa */}
                <div className="h-[42%] min-h-[200px] border-b border-linia">
                  <MapaPaczkomatow punkty={wyniki} onWybierz={wybierz} />
                </div>
                {/* Lista */}
                <div className="flex-1 overflow-y-auto">
                  {q.trim().length < 2 ? (
                    <p className="p-5 text-center text-[13px] text-ink-2">Wpisz miasto, aby zobaczyć paczkomaty na mapie i liście.</p>
                  ) : ladowanie ? (
                    <p className="p-5 text-center text-[13px] text-ink-2">Szukam paczkomatów…</p>
                  ) : wyniki.length === 0 ? (
                    <p className="p-5 text-center text-[13px] text-ink-2">Brak paczkomatów dla „{q.trim()}".</p>
                  ) : (
                    wyniki.map((p) => (
                      <button
                        key={p.kod}
                        onClick={() => wybierz(p)}
                        className="flex w-full items-start gap-3 border-b border-linia px-5 py-3 text-left transition-colors hover:bg-szary"
                      >
                        <span className="mt-0.5 shrink-0 bg-[oklch(85%_0.16_95)] px-2 py-1 text-[11px] font-bold tracking-wide text-ink">
                          {p.kod}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[14px] font-medium">{p.miasto}</span>
                          <span className="block text-[13px] text-ink-2">{p.opis}</span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
