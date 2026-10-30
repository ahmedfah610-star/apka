"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PrzyciskPlatnosci } from "@/components/PrzyciskPlatnosci";
import { linkSledzenia } from "@/lib/przewoznicy";
import { ETYKIETY, KOLOR, dataPl, numer, pobierzZamowienia, zl, type ZamowienieKlienta } from "@/lib/zamowieniaKlienta";

const OPIS: Record<string, string> = {
  oczekuje_na_platnosc: "Czekamy na płatność — po jej zaksięgowaniu przygotujemy paczkę.",
  oplacone: "Płatność przyjęta. Kompletujemy paczkę — damy znać e-mailem, gdy ruszy w drogę.",
  nowe: "Zamówienie przyjęte. Kompletujemy paczkę.",
  wyslane: "Paczka jest w drodze.",
  anulowane: "To zamówienie zostało anulowane.",
};

/** Przegląd konta: ostatnie zamówienie ze statusem i najważniejszą akcją (płatność / śledzenie). */
export function OstatnieZamowienie() {
  const [z, setZ] = useState<ZamowienieKlienta | null | undefined>(undefined);
  useEffect(() => {
    pobierzZamowienia(1).then((l) => setZ(l[0] ?? null));
  }, []);

  if (z === undefined) return <div className="mb-6 h-40 animate-pulse rounded-2xl border border-linia bg-white" />;

  if (z === null) {
    return (
      <div className="mb-6 flex flex-col items-center rounded-2xl border border-linia bg-white px-6 py-9 text-center">
        <p className="text-[17px] font-bold tracking-tight">Nie masz jeszcze zamówień</p>
        <p className="mt-1.5 max-w-sm text-[13.5px] leading-relaxed text-ink-2">
          Tutaj pojawi się status Twojego zamówienia i numer przesyłki do śledzenia.
        </p>
        <Link href="/produkty" className="mt-5 rounded-lg bg-ink px-6 py-3 text-[14.5px] font-bold text-white no-underline transition-colors hover:bg-akcent">
          Przeglądaj produkty
        </Link>
      </div>
    );
  }

  const sztuk = z.pozycje.reduce((s, p) => s + (Number(p.ilosc) || 1), 0);
  const pierwszy = z.pozycje[0]?.nazwa ?? "";
  const sledzenie = z.status === "wyslane" ? linkSledzenia(z.przewoznik, z.numer_przesylki) : null;

  return (
    <div className="mb-6 rounded-2xl border border-linia bg-white p-5 md:p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12.5px] font-semibold uppercase tracking-wide text-ink-2">Ostatnie zamówienie</p>
        <span className={`rounded px-2.5 py-1 text-[11.5px] font-semibold ${KOLOR[z.status] ?? KOLOR.nowe}`}>{ETYKIETY[z.status] ?? z.status}</span>
      </div>
      <p className="text-[17px] font-bold tracking-tight">
        #{numer(z.id)} <span className="text-[13.5px] font-normal text-ink-2">· {dataPl(z.created_at)}</span>
      </p>
      <p className="mt-1 text-[13.5px] text-ink-2">
        {pierwszy}
        {z.pozycje.length > 1 ? ` i ${z.pozycje.length - 1} ${z.pozycje.length - 1 === 1 ? "inny produkt" : "inne produkty"}` : ""} · {sztuk} szt. ·{" "}
        <strong className="text-ink">{zl(z.razem)}</strong>
      </p>
      <p className="mt-3 text-[14px] text-ink">{OPIS[z.status] ?? ""}</p>
      <div className="mt-4 flex flex-wrap items-start gap-2.5">
        {z.status === "oczekuje_na_platnosc" ? <PrzyciskPlatnosci id={z.id} /> : null}
        {sledzenie ? (
          <a href={sledzenie} target="_blank" rel="noopener" className="rounded-lg bg-ink px-5 py-3 text-[14.5px] font-bold text-white no-underline transition-colors hover:bg-akcent">
            Śledź przesyłkę
          </a>
        ) : null}
        <Link
          href={`/konto/zamowienia/${z.id}`}
          className="rounded-lg border border-ink px-5 py-3 text-[14.5px] font-bold text-ink no-underline transition-colors hover:bg-ink hover:text-white"
        >
          Szczegóły
        </Link>
        <Link href="/konto/zamowienia" className="self-center px-1 text-[13.5px] text-ink-2 underline underline-offset-2 hover:text-akcent">
          Wszystkie zamówienia
        </Link>
      </div>
    </div>
  );
}
