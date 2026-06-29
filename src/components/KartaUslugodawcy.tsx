"use client";

import { useState } from "react";
import type { Uslugodawca } from "@/types/domain";

interface Props {
  uslugodawca: Uslugodawca;
  miejsce: number;
}

export function KartaUslugodawcy({ uslugodawca, miejsce }: Props) {
  const [rozwinieta, setRozwinieta] = useState(false);

  return (
    <div className="mb-4 rounded-2xl border border-linia bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-akcent/20 text-sm font-bold text-primary">
            #{miejsce}
          </div>
          <div>
            <p className="text-base font-semibold text-primary">{uslugodawca.nazwa}</p>
            <p className="text-xs text-primary/50">{uslugodawca.adres}</p>
          </div>
        </div>
        <div className="flex-none text-right">
          <p className="text-sm font-bold text-primary">⭐ {uslugodawca.ocenaSrednia.toFixed(1)}</p>
          <p className="text-[11px] text-primary/50">{uslugodawca.liczbaOpinii} opinii</p>
        </div>
      </div>

      {uslugodawca.specjalizacje.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {uslugodawca.specjalizacje.map((s) => (
            <span key={s} className="rounded-full bg-szalwia/20 px-2.5 py-1 text-xs text-primary">
              {s}
            </span>
          ))}
        </div>
      )}

      {uslugodawca.telefon && (
        <p className="mt-2 text-sm text-primary/70">📞 {uslugodawca.telefon}</p>
      )}

      <button
        type="button"
        onClick={() => setRozwinieta(!rozwinieta)}
        className="mt-3 w-full rounded-xl border border-linia py-2 text-sm font-medium text-primary hover:bg-linia/30"
      >
        {rozwinieta ? "Zwiń opinie" : `Pokaż opinie (${uslugodawca.opinie.length})`}
      </button>

      {rozwinieta && (
        <div className="mt-3 flex flex-col gap-2">
          {uslugodawca.opinie.length === 0 && (
            <p className="text-sm text-primary/50">Brak treści opinii w demo.</p>
          )}
          {uslugodawca.opinie.map((o, i) => (
            <div key={i} className="rounded-xl border border-linia px-3 py-2">
              <p className="text-sm font-medium text-primary">
                {o.autor} — {"⭐".repeat(o.ocena)}
              </p>
              <p className="text-sm text-primary/70">{o.tresc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
