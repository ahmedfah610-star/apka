"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useKoszyk } from "@/components/KoszykContext";
import type { Produkt } from "@/data/produkty";

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
        <button disabled className="mb-8 w-full cursor-not-allowed bg-szary px-8 py-4 text-[13px] font-semibold tracking-wide text-ink-2 sm:w-auto sm:min-w-[280px]">
          PRODUKT NIEDOSTĘPNY
        </button>
      </div>
    );
  }

  return (
    <div>
      {malyStan ? (
        <p className="mb-3 text-[13px] font-medium text-akcent">
          {rozmiar ? `Rozmiar ${rozmiar}: zostały ${dostepneTeraz} szt.!` : `Zostały już tylko ${dostepneTeraz} szt.!`}
        </p>
      ) : null}
      {maRozmiary ? (
        <div className="mb-7">
          <h3 className="mb-3 text-[13px] font-semibold tracking-wide text-ink-2">
            WYBIERZ ROZMIAR
            {blad ? <span className="ml-2 font-normal text-akcent">— wybierz rozmiar</span> : null}
          </h3>
          <div className="flex flex-wrap gap-2">
            {produkt.rozmiary!.map((s) => {
              const on = rozmiar === s;
              const st = stanDla(s);
              const brak = st !== null && st <= 0;
              return (
                <button
                  key={s}
                  disabled={brak}
                  title={brak ? "Wyprzedany" : st !== null ? `${st} szt.` : undefined}
                  onClick={() => {
                    setRozmiar(s);
                    setBlad(false);
                  }}
                  className={`relative border px-3.5 py-2 text-[13px] font-medium transition-colors ${
                    brak
                      ? "cursor-not-allowed border-linia bg-szary/50 text-ink-2 line-through"
                      : on
                        ? "border-ink bg-ink text-tlo"
                        : "border-linia-2 hover:border-ink"
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

      <button
        onClick={handleDodaj}
        disabled={typeof dostepneTeraz === "number" && dostepneTeraz <= 0}
        className="mb-3 w-full bg-ink px-8 py-4 text-[13px] font-semibold tracking-wide text-tlo transition-colors hover:bg-akcent disabled:cursor-not-allowed disabled:bg-szary disabled:text-ink-2 sm:w-auto sm:min-w-[280px]"
      >
        DODAJ DO KOSZYKA
      </button>

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
    </div>
  );
}
