"use client";

import Link from "next/link";
import { Nawigacja } from "@/components/Nawigacja";
import { Stopka } from "@/components/Stopka";
import { useKoszyk } from "@/components/KoszykContext";
import { znajdzProdukt } from "@/data/produkty";
import { formatCena } from "@/lib/filtrowanie";
import { DARMOWA_DOSTAWA_OD } from "@/lib/dostawa";

const ZAUFANIE = ["Darmowa dostawa od 150 zł", "30 dni na zwrot", "Bezpieczne płatności", "Wysyłka InPost"];

export default function StronaKoszyka() {
  const { pozycje, usun, ustawIlosc, suma, liczbaSztuk } = useKoszyk();

  const pozycjeZDanymi = pozycje
    .map((poz) => ({ poz, produkt: znajdzProdukt(poz.id) }))
    .filter((x) => x.produkt);

  const doDarmowej = Math.max(0, DARMOWA_DOSTAWA_OD - suma);
  const procent = Math.min(100, (suma / DARMOWA_DOSTAWA_OD) * 100);

  return (
    <div className="overflow-x-hidden">
      <Nawigacja />

      <div className="mx-auto max-w-content px-6 py-10 md:px-12">
        <h1 className="mb-8 text-[32px] font-bold tracking-tight">
          Koszyk {pozycjeZDanymi.length > 0 ? <span className="text-ink-2">({liczbaSztuk})</span> : null}
        </h1>

        {pozycjeZDanymi.length === 0 ? (
          <div className="mx-auto max-w-md border border-linia bg-white px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-szary">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-2">
                <path d="M6 7h12l-1 13H7L6 7Z" />
                <path d="M9 7a3 3 0 0 1 6 0" />
              </svg>
            </div>
            <p className="mb-2 text-[17px] font-semibold">Twój koszyk jest pusty</p>
            <p className="mb-6 text-sm text-ink-2">Dodaj coś z naszej kolekcji — poczekają tu na Ciebie.</p>
            <Link href="/produkty" className="inline-block bg-ink px-8 py-3.5 text-[13px] font-semibold tracking-wide text-tlo no-underline transition-colors hover:bg-akcent">
              PRZEGLĄDAJ PRODUKTY
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">
            {/* Lista pozycji */}
            <div className="border border-linia bg-white">
              {pozycjeZDanymi.map(({ poz, produkt }, i) => (
                <div
                  key={`${poz.id}-${poz.rozmiar ?? ""}`}
                  className={`flex gap-4 p-4 sm:p-5 ${i > 0 ? "border-t border-linia" : ""}`}
                >
                  <Link href={`/produkty/${produkt!.id}`} className="flex h-28 w-24 shrink-0 items-center justify-center border border-linia bg-white">
                    {produkt!.zdjecie ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={produkt!.zdjecie} alt={produkt!.nazwa} className="h-full w-full object-contain p-1.5" />
                    ) : null}
                  </Link>

                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <Link href={`/produkty/${produkt!.id}`} className="block text-[15px] font-semibold leading-snug no-underline text-ink hover:text-akcent">
                          {produkt!.nazwa}
                        </Link>
                        {poz.rozmiar ? <p className="mt-0.5 text-[13px] text-ink-2">Rozmiar: {poz.rozmiar}</p> : null}
                        <p className="mt-0.5 text-[13px] text-ink-2">{formatCena(produkt!.cena)} zł / szt.</p>
                      </div>
                      <p className="whitespace-nowrap text-[16px] font-semibold">{formatCena(produkt!.cena * poz.ilosc)} zł</p>
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-4">
                      <div className="flex items-center border border-linia-2">
                        <button
                          onClick={() => ustawIlosc(poz.id, poz.rozmiar, poz.ilosc - 1)}
                          className="px-3 py-1.5 text-ink-2 transition-colors hover:bg-szary hover:text-ink"
                          aria-label="Zmniejsz"
                        >
                          −
                        </button>
                        <span className="min-w-[36px] text-center text-[14px] font-medium">{poz.ilosc}</span>
                        <button
                          onClick={() => ustawIlosc(poz.id, poz.rozmiar, poz.ilosc + 1)}
                          className="px-3 py-1.5 text-ink-2 transition-colors hover:bg-szary hover:text-ink"
                          aria-label="Zwiększ"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => usun(poz.id, poz.rozmiar)}
                        className="flex items-center gap-1.5 text-[13px] text-ink-2 transition-colors hover:text-akcent"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                          <path d="M4 7h16M9 7V5h6v2m-8 0 1 13h8l1-13" />
                        </svg>
                        Usuń
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Podsumowanie */}
            <aside className="h-fit border border-linia bg-white p-6 lg:sticky lg:top-24">
              <h2 className="mb-4 text-[18px] font-bold">Podsumowanie</h2>

              {doDarmowej > 0 ? (
                <div className="mb-5">
                  <p className="mb-2 text-[13px] text-ink-2">
                    Do <strong className="text-ink">darmowej dostawy</strong> brakuje {formatCena(doDarmowej)} zł
                  </p>
                  <div className="h-2 w-full bg-szary">
                    <div className="h-full bg-akcent transition-all" style={{ width: `${procent}%` }} />
                  </div>
                </div>
              ) : (
                <p className="mb-5 flex items-center gap-2 text-[13px] font-medium text-[oklch(55%_0.12_150)]">✓ Masz darmową dostawę!</p>
              )}

              <div className="flex items-center justify-between border-t border-linia pt-4 text-[15px]">
                <span className="text-ink-2">Wartość produktów</span>
                <span className="font-semibold">{formatCena(suma)} zł</span>
              </div>
              <p className="mt-1 text-[12px] text-ink-2">Koszt dostawy policzymy w następnym kroku.</p>

              <Link
                href="/zamowienie"
                className="mt-6 block bg-ink px-8 py-4 text-center text-[13px] font-semibold tracking-wide text-tlo no-underline transition-colors hover:bg-akcent"
              >
                PRZEJDŹ DO DOSTAWY
              </Link>
              <Link href="/produkty" className="mt-3 block text-center text-[13px] text-ink-2 no-underline hover:text-akcent">
                Kontynuuj zakupy
              </Link>

              <ul className="mt-6 flex flex-col gap-2 border-t border-linia pt-5">
                {ZAUFANIE.map((z) => (
                  <li key={z} className="flex items-center gap-2 text-[12.5px] text-ink-2">
                    <span className="text-[oklch(55%_0.12_150)]">✓</span>
                    {z}
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        )}
      </div>

      <Stopka />
    </div>
  );
}
