"use client";

import { useEffect, useMemo, useState } from "react";
import { DodajDoKoszyka } from "@/components/DodajDoKoszyka";
import { Galeria } from "@/components/Galeria";
import { TerminDostawy } from "@/components/TerminDostawy";
import { KATEGORIE_LABEL, type Produkt } from "@/data/produkty";
import { formatCena } from "@/lib/filtrowanie";
import { etykietaStanu } from "@/lib/dostepnosc";
import { wariantyKoloru } from "@/lib/warianty";

const CECHY: Record<string, string[]> = {
  dziewczynki: ["Miękka, przyjazna skórze tkanina", "Wygodny krój na co dzień", "Łatwe pranie w 30°C"],
  chlopcy: ["Wytrzymały materiał na zabawę", "Wygodny, swobodny krój", "Łatwe pranie w 30°C"],
  niemowleta: ["Delikatna bawełna dla niemowląt", "Łatwe zakładanie i zmiana pieluszki", "Bez uciskających szwów"],
};

/**
 * Galeria + panel zakupu z przełączaniem koloru W MIEJSCU (bez przeładowania
 * strony). Klik w kolor natychmiast zmienia zdjęcia/cenę/stan/rozmiary wybranego
 * wariantu i aktualizuje adres — koniec z „miga poprzedni kolor" na wolnym łączu.
 */
export function PanelZakupu({ warianty, startId }: { warianty: Produkt[]; startId: string }) {
  const [aktywnyId, setAktywnyId] = useState(startId);
  const p = warianty.find((x) => x.id === aktywnyId) ?? warianty[0];

  // Adres w pasku zgodny z wybranym kolorem (bez przeładowania) — do udostępnienia/odświeżenia.
  useEffect(() => {
    if (typeof window !== "undefined" && aktywnyId !== startId) {
      window.history.replaceState(null, "", `/produkty/${aktywnyId}`);
    }
  }, [aktywnyId, startId]);

  const kolory = useMemo(() => wariantyKoloru(warianty, p), [warianty, p]);
  const zdjecia = p.zdjecia?.length ? p.zdjecia : p.zdjecie ? [p.zdjecie] : [];
  const placeholder = {
    background: `repeating-linear-gradient(115deg, oklch(90% 0.02 ${p.hue}) 0 18px, oklch(95% 0.01 ${p.hue}) 18px 36px)`,
  };
  const et = etykietaStanu(p.stan);
  const kolorStanu = et?.ton === "brak" ? "text-ink-2" : et?.ton === "malo" ? "text-akcent" : "text-[oklch(52%_0.13_150)]";

  return (
    <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
      {/* key = remount galerii przy zmianie koloru → reset do 1. zdjęcia wybranego wariantu */}
      <Galeria key={p.id} zdjecia={zdjecia} alt={p.nazwa} placeholder={placeholder} />

      <div className="flex flex-col">
        <p className="mb-2 text-[13px] uppercase tracking-wide text-ink-2">
          {KATEGORIE_LABEL[p.kategoria]} · {p.wiekLabel}
          {p.kolor ? <span> · {p.kolor}</span> : null}
        </p>
        <h1 className="mb-3 text-[30px] font-bold leading-tight tracking-tight md:text-[36px]">{p.nazwa}</h1>
        <p className="mb-2 text-[26px] font-bold text-ink">{formatCena(p.cena)} zł</p>
        {et ? (
          <p className={`mb-3 flex items-center gap-1.5 text-[13.5px] font-semibold ${kolorStanu}`}>
            {et.ton === "malo" ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M13 2 4.5 12.8c-.4.5 0 1.2.6 1.2H11l-1 8 8.5-10.8c.4-.5 0-1.2-.6-1.2H12l1-8Z" />
              </svg>
            ) : et.ton === "ok" ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                <path d="m5 13 4 4L19 7" />
              </svg>
            ) : null}
            {et.tekst}
          </p>
        ) : (
          <div className="mb-3" />
        )}

        {p.stan !== 0 ? <TerminDostawy klasa="mb-6 flex items-center gap-2 text-[13.5px] text-ink-2" /> : <div className="mb-6" />}

        {kolory.length > 1 ? (
          <div className="mb-6">
            <p className="mb-2.5 text-[13.5px] font-semibold text-ink">
              Kolor: <span className="font-normal text-ink-2">{p.kolor ?? "—"}</span>
              <span className="ml-1 text-ink-2">({kolory.length} do wyboru)</span>
            </p>
            <div className="flex flex-wrap gap-2.5">
              {kolory.map((w) => (
                <button
                  key={w.id}
                  onClick={() => setAktywnyId(w.id)}
                  title={`${w.kolor ?? "kolor"}${w.dostepny ? "" : " — brak"}`}
                  aria-label={w.kolor ?? "kolor"}
                  className={`relative block h-14 w-14 overflow-hidden rounded-xl border-2 bg-white transition-all ${
                    w.aktywny ? "border-ink ring-2 ring-ink ring-offset-2" : "border-linia hover:border-ink"
                  }`}
                >
                  {w.zdjecie ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={w.zdjecie} alt={w.kolor ?? ""} className={`h-full w-full object-contain p-0.5 ${w.dostepny ? "" : "opacity-40"}`} loading="lazy" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-[10px] text-ink-2">{w.kolor?.slice(0, 6)}</span>
                  )}
                  {!w.dostepny ? <span className="absolute inset-x-0 bottom-0 bg-white/85 text-center text-[8px] font-semibold text-ink-2">brak</span> : null}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* key = świeży stan wyboru rozmiaru przy zmianie koloru */}
        <DodajDoKoszyka key={p.id} produkt={p} />

        <ul className="mt-6 flex flex-col gap-2 border-t border-linia pt-6">
          {(CECHY[p.kategoria] ?? []).map((c) => (
            <li key={c} className="flex items-start gap-2 text-[14px] text-ink-2">
              <span className="mt-2 h-1 w-1 shrink-0 bg-akcent" />
              {c}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
