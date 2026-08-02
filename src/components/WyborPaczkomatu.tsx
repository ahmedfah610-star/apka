"use client";

import { useEffect, useRef, useState } from "react";

export interface Paczkomat {
  kod: string;
  opis: string;
  miasto: string;
}

export function WyborPaczkomatu({
  wybrany,
  onWybierz,
}: {
  wybrany: Paczkomat | null;
  onWybierz: (p: Paczkomat) => void;
}) {
  const [otwarte, setOtwarte] = useState(false);
  const [q, setQ] = useState("");
  const [wyniki, setWyniki] = useState<Paczkomat[]>([]);
  const [ladowanie, setLadowanie] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!otwarte) return;
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
  }, [q, otwarte]);

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
          📍 Wybierz paczkomat InPost
        </button>
      )}

      {otwarte ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="flex h-[80vh] w-full max-w-lg flex-col bg-tlo">
            <div className="flex items-center justify-between border-b border-linia px-5 py-4">
              <h3 className="text-[16px] font-bold">Wybierz paczkomat InPost</h3>
              <button onClick={() => setOtwarte(false)} aria-label="Zamknij" className="text-ink-2 hover:text-ink">
                ✕
              </button>
            </div>

            <div className="border-b border-linia p-4">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                autoFocus
                placeholder="Wpisz miasto, np. Warszawa"
                className="w-full border border-linia-2 bg-white px-3.5 py-2.5 text-[14px] outline-none focus:border-ink"
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              {q.trim().length < 2 ? (
                <p className="p-6 text-center text-[14px] text-ink-2">Wpisz miasto, aby zobaczyć dostępne paczkomaty.</p>
              ) : ladowanie ? (
                <p className="p-6 text-center text-[14px] text-ink-2">Szukam paczkomatów…</p>
              ) : wyniki.length === 0 ? (
                <p className="p-6 text-center text-[14px] text-ink-2">Brak paczkomatów dla „{q.trim()}". Sprawdź pisownię miasta.</p>
              ) : (
                wyniki.map((p) => (
                  <button
                    key={p.kod}
                    onClick={() => wybierz(p)}
                    className="flex w-full items-start gap-3 border-b border-linia px-5 py-3.5 text-left transition-colors hover:bg-szary"
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

            <p className="border-t border-linia px-5 py-3 text-[11px] text-ink-2">
              Dane paczkomatów pobierane na żywo z InPost. Wybierz punkt, aby go przypisać do zamówienia.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
