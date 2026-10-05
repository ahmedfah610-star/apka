"use client";

import { zdjecie, zestawZdjec } from "@/lib/zdjecia";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Nawigacja } from "@/components/Nawigacja";
import { Stopka } from "@/components/Stopka";
import { useKoszyk } from "@/components/KoszykContext";
import { PRODUKTY, znajdzProdukt, type Produkt } from "@/data/produkty";
import { formatCena } from "@/lib/filtrowanie";
import { useDostawa } from "@/lib/dostawaKlient";
import { EdycjaDostaw } from "@/components/EdycjaDostaw";
import { ZAMOWIENIA_WYLACZONE } from "@/lib/sklep";
import { PrzerwaTechniczna } from "@/components/PrzerwaTechniczna";
import { pobierzKatalog } from "@/lib/katalogKlient";
import { pomiarKoszyka } from "@/lib/analityka";
import { pozycjaPomiaru } from "@/components/DodajDoKoszyka";

const ZAUFANIE = [
  { t: "Wysyłka InPost", o: "Paczkomaty i kurier" },
  { t: "14 dni na zwrot", o: "Bez podawania przyczyny" },
  { t: "Bezpieczne płatności", o: "BLIK, karta, Przelewy24" },
];

export default function StronaKoszyka() {
  const { pozycje, usun, ustawIlosc, usunieteNiedostepne } = useKoszyk();
  const [katalog, setKatalog] = useState<Produkt[]>(PRODUKTY);
  const [katalogGotowy, setKatalogGotowy] = useState(false);

  useEffect(() => {
    pobierzKatalog().then((k) => {
      if (k) {
        setKatalog(k);
      }
      setKatalogGotowy(true);
    });
  }, []);

  const znajdz = useMemo(() => {
    const mapa = new Map(katalog.map((p) => [p.id, p]));
    return (id: string): Produkt | null => mapa.get(id) ?? znajdzProdukt(id) ?? null;
  }, [katalog]);

  const pozycjeZDanymi = pozycje.map((poz) => ({ poz, produkt: znajdz(poz.id) })).filter((x) => x.produkt);
  const suma = pozycjeZDanymi.reduce((s, { poz, produkt }) => s + produkt!.cena * poz.ilosc, 0);
  // Liczone z tego, co widać na liście (nie z surowego zapisu koszyka).
  const sztuk = pozycjeZDanymi.reduce((s, { poz }) => s + poz.ilosc, 0);

  // GA4: obejrzenie koszyka — raz, po wczytaniu aktualnych cen z katalogu.
  const zgloszonyKoszyk = useRef(false);
  useEffect(() => {
    if (!katalogGotowy || zgloszonyKoszyk.current || pozycjeZDanymi.length === 0) return;
    zgloszonyKoszyk.current = true;
    pomiarKoszyka("view_cart", pozycjeZDanymi.map(({ poz, produkt }) => ({ ...pozycjaPomiaru(produkt!, poz.ilosc), rozmiar: poz.rozmiar })));
  }, [katalogGotowy, pozycjeZDanymi]);

  const { darmowaOd } = useDostawa();
  const doDarmowej = Math.max(0, darmowaOd - suma);
  const procent = darmowaOd > 0 ? Math.min(100, (suma / darmowaOd) * 100) : 100;

  return (
    <div className="overflow-x-clip bg-szary/30">
      <Nawigacja />

      <div className="mx-auto max-w-content px-4 py-8 sm:px-6 md:px-12 md:py-12">
        <nav className="mb-3 text-[12.5px] text-ink-2">
          <Link href="/produkty" className="no-underline hover:text-akcent">
            Produkty
          </Link>{" "}
          / <span className="text-ink">Koszyk</span>
        </nav>
        <h1 className="mb-8 text-[28px] font-extrabold tracking-tight md:text-[34px]">
          Twój koszyk {pozycjeZDanymi.length > 0 ? <span className="font-medium text-ink-2">· {sztuk} szt.</span> : null}
        </h1>
        {usunieteNiedostepne > 0 ? (
          <p className="-mt-5 mb-6 rounded-lg bg-akcent-2 px-4 py-3 text-[14px] text-ink">
            {usunieteNiedostepne === 1
              ? "Jeden produkt nie jest już dostępny w sklepie — usunęliśmy go z koszyka."
              : `${usunieteNiedostepne} produkty nie są już dostępne w sklepie — usunęliśmy je z koszyka.`}
          </p>
        ) : null}

        {pozycjeZDanymi.length === 0 ? (
          <div className="mx-auto max-w-md rounded-2xl border border-linia bg-white px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-szary">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-2">
                <path d="M6 7h12l-1 13H7L6 7Z" />
                <path d="M9 7a3 3 0 0 1 6 0" />
              </svg>
            </div>
            <p className="mb-2 text-[18px] font-semibold">Twój koszyk jest pusty</p>
            <p className="mb-6 text-sm text-ink-2">Dodaj coś z naszej kolekcji — poczekają tu na Ciebie.</p>
            <Link href="/produkty" className="rounded-lg inline-block bg-ink px-8 py-3.5 text-[14.5px] font-bold text-white no-underline transition-colors hover:bg-akcent">
              Przeglądaj produkty
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px] lg:gap-10">
            {/* Lista pozycji */}
            <div>
              {/* Pasek darmowej dostawy */}
              <EdycjaDostaw klasa="mb-3" />
              <div className="mb-4 rounded-2xl border border-linia bg-white p-4 sm:p-5">
                {doDarmowej > 0 ? (
                  <p className="mb-2.5 text-[13.5px] text-ink-2">
                    Dodaj jeszcze <strong className="text-ink">{formatCena(doDarmowej)} zł</strong>, aby mieć{" "}
                    <strong className="text-ink">darmową dostawę</strong> 🚚
                  </p>
                ) : (
                  <p className="mb-2.5 flex items-center gap-2 text-[13.5px] font-semibold text-[oklch(52%_0.13_150)]">
                    ✓ Masz darmową dostawę!
                  </p>
                )}
                <div className="h-2 w-full overflow-hidden rounded-full bg-szary">
                  <div className="h-full rounded-full bg-akcent transition-all duration-500" style={{ width: `${procent}%` }} />
                </div>
              </div>

              <div className="divide-y divide-linia overflow-hidden rounded-2xl border border-linia bg-white">
                {pozycjeZDanymi.map(({ poz, produkt }) => (
                  <div key={`${poz.id}-${poz.rozmiar ?? ""}`} className="flex gap-4 p-4 sm:p-5">
                    <Link href={`/produkty/${produkt!.id}`} className="flex h-28 w-24 shrink-0 items-center justify-center rounded-lg border border-linia bg-szary/40">
                      {produkt!.zdjecie ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={zdjecie(produkt!.zdjecie, "s360")} alt={produkt!.nazwa} className="h-full w-full object-contain p-1.5" />
                      ) : null}
                    </Link>

                    <div className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link href={`/produkty/${produkt!.id}`} className="block text-[15px] font-semibold leading-snug no-underline text-ink hover:text-akcent">
                            {produkt!.nazwa}
                          </Link>
                          {produkt!.kolor ? (
                            <span className="mr-1.5 mt-1.5 inline-block rounded-md border border-linia-2 px-2 py-0.5 text-[12px] text-ink-2">kolor: {produkt!.kolor}</span>
                          ) : null}
                          {poz.rozmiar ? (
                            <span className="mt-1.5 inline-block rounded-md border border-linia-2 px-2 py-0.5 text-[12px] text-ink-2">rozmiar {poz.rozmiar}</span>
                          ) : null}
                          <p className="mt-1.5 text-[13px] text-ink-2">{formatCena(produkt!.cena)} zł / szt.</p>
                        </div>
                        <p className="whitespace-nowrap text-[16px] font-bold">{formatCena(produkt!.cena * poz.ilosc)} zł</p>
                      </div>

                      <div className="mt-auto flex items-center justify-between pt-4">
                        <div className="flex items-center overflow-hidden rounded-lg border border-linia-2">
                          <button
                            onClick={() => ustawIlosc(poz.id, poz.rozmiar, poz.ilosc - 1)}
                            className="px-3 py-2 text-[15px] text-ink-2 transition-colors hover:bg-szary hover:text-ink"
                            aria-label="Zmniejsz"
                          >
                            −
                          </button>
                          <span className="min-w-[40px] text-center text-[14px] font-semibold">{poz.ilosc}</span>
                          <button
                            onClick={() => ustawIlosc(poz.id, poz.rozmiar, poz.ilosc + 1)}
                            className="px-3 py-2 text-[15px] text-ink-2 transition-colors hover:bg-szary hover:text-ink"
                            aria-label="Zwiększ"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => usun(poz.id, poz.rozmiar)}
                          className="-mr-2 flex min-h-10 min-w-10 items-center justify-center gap-1.5 rounded-lg px-2 text-[13px] text-ink-2 transition-colors hover:text-akcent"
                          aria-label="Usuń z koszyka"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                            <path d="M4 7h16M9 7V5h6v2m-8 0 1 13h8l1-13" />
                          </svg>
                          <span className="hidden sm:inline">Usuń</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Link href="/produkty" className="mt-4 inline-flex items-center gap-1.5 text-[13.5px] text-ink-2 no-underline hover:text-akcent">
                ← Kontynuuj zakupy
              </Link>
            </div>

            {/* Podsumowanie */}
            <aside className="h-fit rounded-2xl border border-linia bg-white p-6 shadow-[0_2px_24px_-18px_rgba(0,0,0,0.35)] lg:sticky lg:top-24">
              <h2 className="mb-5 text-[17px] font-bold">Podsumowanie</h2>

              <div className="flex items-center justify-between text-[14.5px]">
                <span className="text-ink-2">Wartość produktów</span>
                <span className="font-semibold">{formatCena(suma)} zł</span>
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[14.5px]">
                <span className="text-ink-2">Dostawa</span>
                <span className="text-ink-2">{doDarmowej > 0 ? "od 0 zł" : "gratis"}</span>
              </div>
              <p className="mt-1 text-[12px] text-ink-2">Dokładny koszt dostawy w następnym kroku.</p>

              <div className="mt-4 flex items-center justify-between border-t border-linia pt-4">
                <span className="text-[15px] font-semibold">Razem</span>
                <span className="text-[22px] font-bold">{formatCena(suma)} zł</span>
              </div>

              {ZAMOWIENIA_WYLACZONE ? (
                <>
                  <PrzerwaTechniczna className="mt-5" />
                  <button
                    disabled
                    className="mt-3 block w-full cursor-not-allowed rounded-lg bg-szary px-8 py-4 text-center text-[14.5px] font-bold text-ink-2"
                  >
                    Zamówienia chwilowo wyłączone
                  </button>
                </>
              ) : (
                <Link
                  href="/zamowienie/konto"
                  className="mt-5 block rounded-lg bg-ink px-8 py-4 text-center text-[14.5px] font-bold text-white no-underline transition-colors hover:bg-akcent"
                >
                  Przejdź do zamówienia →
                </Link>
              )}
              <p className="mt-3 text-center text-[11.5px] leading-relaxed text-ink-2">
                Składając zamówienie akceptujesz{" "}
                <Link href="/regulamin" className="underline underline-offset-2 hover:text-akcent">Regulamin</Link>{" "}
                i{" "}
                <Link href="/polityka-prywatnosci" className="underline underline-offset-2 hover:text-akcent">Politykę prywatności</Link>.
              </p>

              <ul className="mt-6 flex flex-col gap-3 border-t border-linia pt-5">
                {ZAUFANIE.map((z) => (
                  <li key={z.t} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[oklch(92%_0.05_150)] text-[10px] text-[oklch(45%_0.13_150)]">
                      ✓
                    </span>
                    <span>
                      <span className="block text-[13px] font-medium leading-tight">{z.t}</span>
                      <span className="block text-[12px] text-ink-2">{z.o}</span>
                    </span>
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
