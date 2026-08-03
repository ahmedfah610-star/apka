"use client";

import { useState } from "react";

// Standardowa tabela rozmiarów dziecięcych (wzrost w cm).
const WIERSZE: { rozmiar: string; wiek: string; wzrost: string }[] = [
  { rozmiar: "56", wiek: "0–1 mies.", wzrost: "50–56" },
  { rozmiar: "62", wiek: "1–3 mies.", wzrost: "56–62" },
  { rozmiar: "68", wiek: "3–6 mies.", wzrost: "62–68" },
  { rozmiar: "74", wiek: "6–9 mies.", wzrost: "68–74" },
  { rozmiar: "80", wiek: "9–12 mies.", wzrost: "74–80" },
  { rozmiar: "86", wiek: "12–18 mies.", wzrost: "80–86" },
  { rozmiar: "92", wiek: "1,5–2 lata", wzrost: "86–92" },
  { rozmiar: "98", wiek: "2–3 lata", wzrost: "92–98" },
  { rozmiar: "104", wiek: "3–4 lata", wzrost: "98–104" },
  { rozmiar: "110", wiek: "4–5 lat", wzrost: "104–110" },
  { rozmiar: "116", wiek: "5–6 lat", wzrost: "110–116" },
  { rozmiar: "122", wiek: "6–7 lat", wzrost: "116–122" },
  { rozmiar: "128", wiek: "7–8 lat", wzrost: "122–128" },
  { rozmiar: "134", wiek: "8–9 lat", wzrost: "128–134" },
  { rozmiar: "140", wiek: "9–10 lat", wzrost: "134–140" },
  { rozmiar: "146", wiek: "10–11 lat", wzrost: "140–146" },
  { rozmiar: "152", wiek: "11–12 lat", wzrost: "146–152" },
  { rozmiar: "158", wiek: "12–13 lat", wzrost: "152–158" },
  { rozmiar: "164", wiek: "13–14 lat", wzrost: "158–164" },
  { rozmiar: "170", wiek: "14–15 lat", wzrost: "164–170" },
];

export function TabelaRozmiarow() {
  const [otwarte, setOtwarte] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOtwarte(true)}
        className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink-2 underline underline-offset-2 hover:text-akcent"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
        Tabela rozmiarów
      </button>

      {otwarte ? (
        <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8" onClick={() => setOtwarte(false)}>
          <div className="w-full max-w-md border border-linia bg-tlo shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-linia px-5 py-3.5">
              <h2 className="text-[16px] font-bold">Tabela rozmiarów</h2>
              <button onClick={() => setOtwarte(false)} aria-label="Zamknij" className="text-ink-2 hover:text-ink">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto">
              <table className="w-full text-left text-[13.5px]">
                <thead className="sticky top-0 bg-szary text-[12px] uppercase tracking-wide text-ink-2">
                  <tr>
                    <th className="px-5 py-2.5 font-semibold">Rozmiar</th>
                    <th className="px-5 py-2.5 font-semibold">Wiek</th>
                    <th className="px-5 py-2.5 font-semibold">Wzrost (cm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-linia">
                  {WIERSZE.map((w) => (
                    <tr key={w.rozmiar} className="bg-white">
                      <td className="px-5 py-2.5 font-semibold">{w.rozmiar}</td>
                      <td className="px-5 py-2.5 text-ink-2">{w.wiek}</td>
                      <td className="px-5 py-2.5 text-ink-2">{w.wzrost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="border-t border-linia px-5 py-3 text-[11.5px] leading-relaxed text-ink-2">
              Rozmiar odpowiada wzrostowi dziecka w centymetrach. Jeśli dziecko jest pomiędzy rozmiarami, wybierz większy.
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
