"use client";

import Link from "next/link";
import { useState } from "react";
import { useKoszyk } from "@/components/KoszykContext";
import type { Produkt } from "@/data/produkty";

export function DodajDoKoszyka({ produkt }: { produkt: Produkt }) {
  const { dodaj } = useKoszyk();
  const maRozmiary = !!produkt.rozmiary && produkt.rozmiary.length > 0;
  const niedostepny = produkt.stan === 0;
  const malyStan = typeof produkt.stan === "number" && produkt.stan > 0 && produkt.stan <= 5;
  const [rozmiar, setRozmiar] = useState<string | undefined>(undefined);
  const [dodano, setDodano] = useState(false);
  const [blad, setBlad] = useState(false);

  function handleDodaj() {
    if (maRozmiary && !rozmiar) {
      setBlad(true);
      return;
    }
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
        <p className="mb-3 text-[13px] font-medium text-akcent">Zostały już tylko {produkt.stan} szt.!</p>
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
              return (
                <button
                  key={s}
                  onClick={() => {
                    setRozmiar(s);
                    setBlad(false);
                  }}
                  className={`border px-3.5 py-2 text-[13px] font-medium transition-colors ${
                    on ? "border-ink bg-ink text-tlo" : "border-linia-2 hover:border-ink"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <button
        onClick={handleDodaj}
        className="mb-3 w-full bg-ink px-8 py-4 text-[13px] font-semibold tracking-wide text-tlo transition-colors hover:bg-akcent sm:w-auto sm:min-w-[280px]"
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
