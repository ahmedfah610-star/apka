"use client";

import { useState } from "react";

export interface Paczkomat {
  kod: string;
  opis: string;
  miasto: string;
}

// Dane demonstracyjne. W wersji produkcyjnej podłącza się oficjalny
// InPost Geowidget / API ShipX (wymaga tokenu z konta InPost).
const PACZKOMATY: Paczkomat[] = [
  { kod: "WAW01A", opis: "ul. Marszałkowska 84, przy sklepie Żabka", miasto: "Warszawa" },
  { kod: "WAW250", opis: "al. Jerozolimskie 142, parking Galerii", miasto: "Warszawa" },
  { kod: "KRA010", opis: "ul. Floriańska 3, obok apteki", miasto: "Kraków" },
  { kod: "KRA118", opis: "ul. Wielicka 44, stacja Orlen", miasto: "Kraków" },
  { kod: "WRO044", opis: "ul. Świdnicka 12, przy przystanku", miasto: "Wrocław" },
  { kod: "POZ021", opis: "ul. Półwiejska 30, wejście od podwórza", miasto: "Poznań" },
  { kod: "GDA073", opis: "ul. Długa 5, obok kwiaciarni", miasto: "Gdańsk" },
  { kod: "LOD055", opis: "ul. Piotrkowska 100, dziedziniec", miasto: "Łódź" },
];

export function WyborPaczkomatu({
  wybrany,
  onWybierz,
}: {
  wybrany: Paczkomat | null;
  onWybierz: (p: Paczkomat) => void;
}) {
  const [otwarte, setOtwarte] = useState(false);
  const [szukaj, setSzukaj] = useState("");

  const wyniki = PACZKOMATY.filter(
    (p) =>
      p.miasto.toLowerCase().includes(szukaj.toLowerCase()) ||
      p.kod.toLowerCase().includes(szukaj.toLowerCase()),
  );

  return (
    <div className="mt-3">
      {wybrany ? (
        <div className="flex items-center justify-between border border-ink bg-white px-4 py-3">
          <div>
            <p className="text-[14px] font-semibold">Paczkomat {wybrany.kod}</p>
            <p className="text-[13px] text-ink-2">
              {wybrany.miasto}, {wybrany.opis}
            </p>
          </div>
          <button onClick={() => setOtwarte(true)} className="text-[13px] underline underline-offset-2 hover:text-akcent">
            Zmień
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOtwarte(true)}
          className="w-full border border-dashed border-ink-2 px-4 py-3 text-[14px] font-medium text-ink transition-colors hover:border-ink"
        >
          📍 Wybierz paczkomat
        </button>
      )}

      {otwarte ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="flex max-h-[80vh] w-full max-w-lg flex-col bg-tlo">
            <div className="flex items-center justify-between border-b border-linia px-5 py-4">
              <h3 className="text-[16px] font-bold">Wybierz paczkomat</h3>
              <button onClick={() => setOtwarte(false)} aria-label="Zamknij" className="text-ink-2 hover:text-ink">
                ✕
              </button>
            </div>
            <div className="border-b border-linia p-4">
              <input
                value={szukaj}
                onChange={(e) => setSzukaj(e.target.value)}
                placeholder="Miasto lub kod paczkomatu…"
                className="w-full border border-linia-2 bg-white px-3.5 py-2.5 text-[14px] outline-none focus:border-ink"
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              {wyniki.length === 0 ? (
                <p className="p-6 text-center text-[14px] text-ink-2">Brak paczkomatów dla „{szukaj}".</p>
              ) : (
                wyniki.map((p) => (
                  <button
                    key={p.kod}
                    onClick={() => {
                      onWybierz(p);
                      setOtwarte(false);
                    }}
                    className="flex w-full items-start gap-3 border-b border-linia px-5 py-3.5 text-left transition-colors hover:bg-szary"
                  >
                    <span className="mt-0.5 bg-[oklch(85%_0.16_95)] px-2 py-1 text-[11px] font-bold tracking-wide text-ink">
                      {p.kod}
                    </span>
                    <span>
                      <span className="block text-[14px] font-medium">{p.miasto}</span>
                      <span className="block text-[13px] text-ink-2">{p.opis}</span>
                    </span>
                  </button>
                ))
              )}
            </div>
            <p className="border-t border-linia px-5 py-3 text-[11px] text-ink-2">
              Lista demonstracyjna. Docelowo mapa paczkomatów InPost (Geowidget) z pełną bazą punktów.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
