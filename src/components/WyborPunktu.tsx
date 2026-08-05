"use client";

import { useState } from "react";
import { BliskaPaczkaWidget } from "@/components/BliskaPaczkaWidget";

export interface PunktOdbioru {
  kod: string;
  opis: string;
  miasto: string;
}

/** Wybór punktu odbioru ORLEN Paczka na mapie (widget Bliska Paczka). */
export function WyborPunktu({
  wybrany,
  onWybierz,
}: {
  wybrany: PunktOdbioru | null;
  onWybierz: (p: PunktOdbioru) => void;
}) {
  const [otwarte, setOtwarte] = useState(false);
  const wybierz = (p: PunktOdbioru) => {
    onWybierz(p);
    setOtwarte(false);
  };

  return (
    <div className="mt-3">
      {wybrany ? (
        <div className="flex items-center justify-between border border-ink bg-white px-4 py-3">
          <div className="min-w-0">
            <p className="text-[14px] font-semibold">Punkt {wybrany.kod}</p>
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
          📍 Wybierz punkt ORLEN Paczka na mapie
        </button>
      )}

      {otwarte ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="flex h-[85vh] w-full max-w-2xl flex-col bg-tlo">
            <div className="flex items-center justify-between border-b border-linia px-5 py-4">
              <h3 className="text-[16px] font-bold">Wybierz punkt ORLEN Paczka</h3>
              <button onClick={() => setOtwarte(false)} aria-label="Zamknij" className="text-ink-2 hover:text-ink">
                ✕
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <BliskaPaczkaWidget onWybierz={wybierz} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
