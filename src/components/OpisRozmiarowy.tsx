"use client";

import { useEffect, useMemo, useState } from "react";

// Zdarzenie wysyłane przez DodajDoKoszyka przy wyborze rozmiaru — opis przełącza się
// na wymiary tego rozmiaru bez przeładowania strony.
export const ZDARZENIE_ROZMIARU = "bobas:rozmiar";

/**
 * Opis produktu z wymiarami WYBRANEGO rozmiaru. Na Allegro każdy rozmiar to osobna
 * oferta z własnym opisem („WZROST 92 CM, szerokość 24 cm…"), więc po połączeniu
 * rozmiarów w jeden produkt pokazujemy opis tego rozmiaru, który klient wybrał.
 * Gdy wszystkie rozmiary mają ten sam opis — zwykły opis, bez przełącznika.
 */
export function OpisRozmiarowy({
  opisy,
  rozmiary,
  domyslny,
  klasa,
}: {
  opisy: Record<string, string>;
  rozmiary: string[];
  domyslny: string | null;
  klasa: string;
}) {
  // Kolejność jak w wyborze rozmiaru; tylko rozmiary, które mają własny opis.
  const zOpisem = useMemo(() => {
    const znane = rozmiary.filter((r) => opisy[r]);
    const reszta = Object.keys(opisy).filter((r) => !znane.includes(r) && opisy[r]);
    return [...znane, ...reszta];
  }, [opisy, rozmiary]);
  const rozne = useMemo(() => new Set(zOpisem.map((r) => opisy[r])).size > 1, [zOpisem, opisy]);
  const [wybrany, setWybrany] = useState<string | undefined>(zOpisem[0]);

  useEffect(() => {
    const nasluch = (e: Event) => {
      const r = (e as CustomEvent<{ rozmiar?: string }>).detail?.rozmiar;
      if (r && opisy[r]) setWybrany(r);
    };
    window.addEventListener(ZDARZENIE_ROZMIARU, nasluch);
    return () => window.removeEventListener(ZDARZENIE_ROZMIARU, nasluch);
  }, [opisy]);

  const html = (wybrany && opisy[wybrany]) || domyslny || (zOpisem[0] ? opisy[zOpisem[0]] : "");

  return (
    <div>
      {rozne ? (
        <div className="mb-6 rounded-xl border border-linia bg-white p-4">
          <p className="mb-2.5 text-[13.5px] font-semibold text-ink">Wymiary i opis dla rozmiaru:</p>
          <div className="flex flex-wrap gap-2">
            {zOpisem.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setWybrany(r)}
                className={`min-w-[52px] rounded-lg border px-3 py-1.5 text-[13.5px] font-medium transition-colors ${
                  r === wybrany ? "border-ink bg-ink text-tlo" : "border-linia-2 text-ink hover:border-ink"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <div className={klasa} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
