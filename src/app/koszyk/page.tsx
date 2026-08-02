"use client";

import Link from "next/link";
import { Nawigacja } from "@/components/Nawigacja";
import { Stopka } from "@/components/Stopka";
import { useKoszyk } from "@/components/KoszykContext";
import { znajdzProdukt } from "@/data/produkty";
import { formatCena } from "@/lib/filtrowanie";
import { DARMOWA_DOSTAWA_OD } from "@/lib/dostawa";

export default function StronaKoszyka() {
  const { pozycje, usun, ustawIlosc, suma } = useKoszyk();

  const pozycjeZDanymi = pozycje
    .map((poz) => ({ poz, produkt: znajdzProdukt(poz.id) }))
    .filter((x) => x.produkt);

  const doDarmowej = Math.max(0, DARMOWA_DOSTAWA_OD - suma);
  const procent = Math.min(100, (suma / DARMOWA_DOSTAWA_OD) * 100);

  return (
    <div className="overflow-x-hidden">
      <Nawigacja />

      <div className="mx-auto max-w-content px-6 py-10 md:px-12">
        <h1 className="mb-8 text-[32px] font-bold tracking-tight">Koszyk</h1>

        {pozycjeZDanymi.length === 0 ? (
          <div className="py-16 text-center">
            <p className="mb-2 text-[17px] font-semibold">Twój koszyk jest pusty</p>
            <p className="mb-6 text-sm text-ink-2">Dodaj coś z naszej kolekcji — poczekają tu na Ciebie.</p>
            <Link
              href="/produkty"
              className="inline-block bg-ink px-8 py-3.5 text-[13px] font-semibold tracking-wide text-tlo no-underline transition-colors hover:bg-akcent"
            >
              PRZEGLĄDAJ PRODUKTY
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_360px]">
            {/* Lista pozycji */}
            <div>
              {pozycjeZDanymi.map(({ poz, produkt }) => (
                <div
                  key={`${poz.id}-${poz.rozmiar ?? ""}`}
                  className="flex gap-4 border-b border-linia py-5"
                >
                  <Link
                    href={`/produkty/${produkt!.id}`}
                    className="flex h-24 w-24 shrink-0 items-center justify-center bg-white"
                  >
                    {produkt!.zdjecie ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={produkt!.zdjecie} alt={produkt!.nazwa} className="h-full w-full object-contain p-1.5" />
                    ) : null}
                  </Link>

                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Link href={`/produkty/${produkt!.id}`} className="text-[15px] font-semibold no-underline text-ink hover:text-akcent">
                          {produkt!.nazwa}
                        </Link>
                        {poz.rozmiar ? <p className="mt-0.5 text-[13px] text-ink-2">Rozmiar: {poz.rozmiar}</p> : null}
                      </div>
                      <p className="whitespace-nowrap text-[15px]">{formatCena(produkt!.cena * poz.ilosc)} zł</p>
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center border border-linia-2">
                        <button
                          onClick={() => ustawIlosc(poz.id, poz.rozmiar, poz.ilosc - 1)}
                          className="px-3 py-1.5 text-ink-2 transition-colors hover:text-ink"
                          aria-label="Zmniejsz"
                        >
                          −
                        </button>
                        <span className="min-w-[32px] text-center text-[14px]">{poz.ilosc}</span>
                        <button
                          onClick={() => ustawIlosc(poz.id, poz.rozmiar, poz.ilosc + 1)}
                          className="px-3 py-1.5 text-ink-2 transition-colors hover:text-ink"
                          aria-label="Zwiększ"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => usun(poz.id, poz.rozmiar)}
                        className="text-[13px] text-ink-2 underline underline-offset-2 hover:text-akcent"
                      >
                        Usuń
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Podsumowanie */}
            <aside className="h-fit bg-szary p-6">
              <h2 className="mb-4 text-[18px] font-bold">Podsumowanie</h2>

              {doDarmowej > 0 ? (
                <div className="mb-5">
                  <p className="mb-2 text-[13px] text-ink-2">
                    Do <strong className="text-ink">darmowej dostawy</strong> brakuje {formatCena(doDarmowej)} zł
                  </p>
                  <div className="h-1.5 w-full bg-linia">
                    <div className="h-full bg-akcent transition-all" style={{ width: `${procent}%` }} />
                  </div>
                </div>
              ) : (
                <p className="mb-5 text-[13px] font-medium text-ink">✓ Masz darmową dostawę!</p>
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
              <Link
                href="/produkty"
                className="mt-3 block text-center text-[13px] text-ink-2 no-underline hover:text-akcent"
              >
                Kontynuuj zakupy
              </Link>
            </aside>
          </div>
        )}
      </div>

      <Stopka />
    </div>
  );
}
