"use client";

import { useState } from "react";
import type { DopasowanaKarma, Oferta } from "@/types/domain";
import { withTrackingParams } from "@/lib/links";

interface Props {
  wynik: DopasowanaKarma;
  oferty: Oferta[];
}

export function KartaKarmy({ wynik, oferty }: Props) {
  const [rozwinieta, setRozwinieta] = useState(false);
  const { karma, score, powody, porcjaGDzien, kosztMiesiac, dniStarcza } = wynik;

  return (
    <div className="mb-4 rounded-2xl border border-linia bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-primary/50">{karma.brand}</p>
          <p className="text-base font-semibold text-primary">{karma.name}</p>
        </div>
        <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-szalwia/20 text-sm font-bold text-primary">
          {score}%
        </div>
      </div>

      {powody.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {powody.map((p) => (
            <span key={p} className="rounded-full bg-akcent/20 px-2.5 py-1 text-xs text-primary">
              {p}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Statystyka etykieta="porcja/dzień" wartosc={`${Math.round(porcjaGDzien)} g`} />
        <Statystyka etykieta="koszt/mies." wartosc={kosztMiesiac != null ? `~${kosztMiesiac} zł` : "—"} />
        <Statystyka etykieta="opakowanie" wartosc={dniStarcza != null ? `${dniStarcza} dni` : "—"} />
      </div>

      <button
        type="button"
        onClick={() => setRozwinieta(!rozwinieta)}
        className="mt-3 w-full rounded-xl border border-linia py-2 text-sm font-medium text-primary hover:bg-linia/30"
      >
        {rozwinieta ? "Zwiń oferty" : `Pokaż oferty sklepów (${oferty.length})`}
      </button>

      {rozwinieta && (
        <div className="mt-3 flex flex-col gap-2">
          {oferty.length === 0 && (
            <p className="text-sm text-primary/50">Brak ofert spełniających filtry.</p>
          )}
          {oferty.map((o) => (
            <div
              key={`${o.shop}-${o.price}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-linia px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium text-primary">{o.shop}</p>
                <p className="text-xs text-primary/50">
                  {o.price} zł {o.delivery > 0 ? `+ ${o.delivery} zł dostawa` : "• dostawa 0 zł"}
                  {o.fast ? " • 24h" : ""}
                  {!o.inStock ? " • niedostępne" : ""}
                </p>
              </div>
              <a
                href={withTrackingParams(o.affiliateUrl)}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex-none rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-tlo"
              >
                Do sklepu
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Statystyka({ etykieta, wartosc }: { etykieta: string; wartosc: string }) {
  return (
    <div className="rounded-xl bg-tlo px-2 py-2">
      <p className="text-sm font-semibold text-primary">{wartosc}</p>
      <p className="text-[11px] text-primary/50">{etykieta}</p>
    </div>
  );
}
