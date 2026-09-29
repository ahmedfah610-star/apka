"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ZDARZENIE_ROZMIARU } from "@/components/OpisRozmiarowy";
import { useKoszyk } from "@/components/KoszykContext";
import { PowiadomODostepnosci } from "@/components/PowiadomODostepnosci";
import { TabelaRozmiarow } from "@/components/TabelaRozmiarow";
import { PrzyciskUlubione } from "@/components/PrzyciskUlubione";
import type { Produkt } from "@/data/produkty";
import { formatCena } from "@/lib/filtrowanie";

export function DodajDoKoszyka({ produkt }: { produkt: Produkt }) {
  const { dodaj } = useKoszyk();
  const maRozmiary = !!produkt.rozmiary && produkt.rozmiary.length > 0;
  const sr = produkt.stanRozmiary ?? null;

  // Dostępność per rozmiar (gdy jest podział) — 0 = wyprzedany.
  const stanDla = (s: string): number | null => (sr ? sr[s] ?? 0 : null);

  // Produkt niedostępny, gdy: brak podziału i stan 0, albo podział i wszystkie rozmiary 0.
  const wszystkoZero = sr && maRozmiary ? produkt.rozmiary!.every((s) => (sr[s] ?? 0) === 0) : false;
  const niedostepny = produkt.stan === 0 || wszystkoZero;

  const [rozmiar, setRozmiar] = useState<string | undefined>(undefined);
  const [dodano, setDodano] = useState(false);
  const [blad, setBlad] = useState(false);

  // Telefon: gdy główny przycisk jest poza ekranem, na dole wisi pasek z ceną i „Dodaj do koszyka".
  const przyciski = useRef<HTMLDivElement>(null);
  const sekcjaRozmiarow = useRef<HTMLDivElement>(null);
  const [pasekWidoczny, setPasekWidoczny] = useState(false);
  useEffect(() => {
    const el = przyciski.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(([w]) => setPasekWidoczny(!w.isIntersecting), { threshold: 0 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Dostępna ilość dla aktualnego wyboru.
  const dostepneTeraz = useMemo(() => {
    if (maRozmiary && rozmiar && sr) return sr[rozmiar] ?? 0;
    if (!maRozmiary && typeof produkt.stan === "number") return produkt.stan;
    return null;
  }, [maRozmiary, rozmiar, sr, produkt.stan]);

  const malyStan = typeof dostepneTeraz === "number" && dostepneTeraz > 0 && dostepneTeraz <= 5;

  function handleDodaj() {
    if (maRozmiary && !rozmiar) {
      setBlad(true);
      sekcjaRozmiarow.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (typeof dostepneTeraz === "number" && dostepneTeraz <= 0) return;
    dodaj(produkt.id, rozmiar, 1);
    setDodano(true);
    setBlad(false);
    setTimeout(() => setDodano(false), 2500);
  }

  if (niedostepny) {
    return (
      <div>
        <button disabled className="mb-4 w-full cursor-not-allowed rounded-xl bg-szary px-8 py-4 text-[14px] font-bold text-ink-2 sm:w-auto sm:min-w-[280px]">
          Produkt niedostępny
        </button>
        <PowiadomODostepnosci produktId={produkt.id} rozmiar={null} />
      </div>
    );
  }

  // Wybrany rozmiar wyprzedany (0 szt.) — pokaż formularz powiadomienia zamiast koszyka.
  const wybranyWyprzedany = maRozmiary && rozmiar != null && sr != null && (sr[rozmiar] ?? 0) <= 0;

  return (
    <div>
      {malyStan ? (
        <p className="mb-3 text-[13px] font-medium text-akcent">
          {rozmiar ? `Rozmiar ${rozmiar}: zostały ${dostepneTeraz} szt.!` : `Zostały już tylko ${dostepneTeraz} szt.!`}
        </p>
      ) : null}
      {maRozmiary ? (
        <div ref={sekcjaRozmiarow} className="mb-6 scroll-mt-40 md:mb-7">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className={`text-[14px] font-bold ${blad ? "text-cena" : "text-ink"}`}>
              {blad ? "Najpierw wybierz rozmiar" : "Rozmiar"}
            </h3>
            <TabelaRozmiarow />
          </div>
          <div className="flex flex-wrap gap-2">
            {produkt.rozmiary!.map((s) => {
              const on = rozmiar === s;
              const st = stanDla(s);
              const brak = st !== null && st <= 0;
              return (
                <button
                  key={s}
                  title={brak ? "Wyprzedany — powiadomimy o dostępności" : st !== null ? `${st} szt.` : undefined}
                  onClick={() => {
                    setRozmiar(s);
                    setBlad(false);
                    // Opis produktu pokazuje wymiary wybranego rozmiaru.
                    window.dispatchEvent(new CustomEvent(ZDARZENIE_ROZMIARU, { detail: { rozmiar: s } }));
                  }}
                  className={`relative min-w-[52px] rounded-lg border px-3.5 py-2.5 text-center text-[14px] font-bold transition-colors ${
                    brak
                      ? on
                        ? "border-ink bg-szary text-ink-2 line-through"
                        : "border-linia bg-szary/50 text-ink-2 line-through hover:border-ink-2"
                      : on
                        ? "border-ink bg-ink text-tlo"
                        : `${blad ? "border-cena" : "border-linia-2"} bg-white hover:border-ink`
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
          {rozmiar && typeof dostepneTeraz === "number" ? (
            <p className="mt-2.5 text-[12.5px] text-ink-2">
              {dostepneTeraz > 0 ? `Rozmiar ${rozmiar} — na stanie: ${dostepneTeraz} szt.` : `Rozmiar ${rozmiar} — wyprzedany`}
            </p>
          ) : null}
        </div>
      ) : null}

      <div ref={przyciski}>
      {wybranyWyprzedany ? (
        <PowiadomODostepnosci key={rozmiar} produktId={produkt.id} rozmiar={rozmiar} />
      ) : (
        <div className="mb-3 flex gap-2.5">
          <button
            onClick={handleDodaj}
            className="flex-1 rounded-xl bg-ink px-6 py-3.5 text-[15px] font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-akcent hover:shadow-lg sm:min-w-[280px] sm:flex-none sm:px-8"
          >
            Dodaj do koszyka
          </button>
          <PrzyciskUlubione id={produkt.id} wariant="produkt" />
        </div>
      )}
      </div>

      {dodano ? (
        <p className="mb-8 text-[14px] text-ink-2">
          ✓ Dodano do koszyka.{" "}
          <Link href="/koszyk" className="text-ink underline underline-offset-2 hover:text-akcent">
            Przejdź do koszyka →
          </Link>
        </p>
      ) : (
        <div className="mb-8" />
      )}

      {/* Pasek zakupu na telefonie */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-linia bg-white px-4 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-8px_24px_-16px_rgba(0,0,0,0.35)] transition-transform duration-200 md:hidden ${
          pasekWidoczny ? "translate-y-0" : "pointer-events-none translate-y-full"
        }`}
        aria-hidden={!pasekWidoczny}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[18px] font-extrabold leading-tight text-ink">{formatCena(produkt.cena)} zł</p>
            <p className="truncate text-[12px] text-ink-2">
              {dodano ? "✓ Dodano do koszyka" : maRozmiary ? (rozmiar ? `Rozmiar ${rozmiar}` : "Wybierz rozmiar") : produkt.wiekLabel}
            </p>
          </div>
          {dodano ? (
            <Link href="/koszyk" tabIndex={pasekWidoczny ? 0 : -1} className="rounded-xl bg-akcent px-5 py-3 text-[14.5px] font-bold text-white no-underline">
              Przejdź do koszyka
            </Link>
          ) : (
            <button
              onClick={wybranyWyprzedany ? () => sekcjaRozmiarow.current?.scrollIntoView({ behavior: "smooth", block: "center" }) : handleDodaj}
              tabIndex={pasekWidoczny ? 0 : -1}
              className="rounded-xl bg-ink px-5 py-3 text-[14.5px] font-bold text-white"
            >
              {wybranyWyprzedany ? "Powiadom mnie" : maRozmiary && !rozmiar ? "Wybierz rozmiar" : "Dodaj do koszyka"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
