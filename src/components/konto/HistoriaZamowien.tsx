"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { useKoszyk } from "@/components/KoszykContext";
import { PrzyciskPlatnosci } from "@/components/PrzyciskPlatnosci";
import { linkSledzenia } from "@/lib/przewoznicy";
import { ETYKIETY, KOLOR, dataPl, numer, pobierzZamowienia, zl, type ZamowienieKlienta } from "@/lib/zamowieniaKlienta";

export function HistoriaZamowien() {
  const router = useRouter();
  const { user, zaladowano, wlaczone } = useAuth();
  const { dodaj } = useKoszyk();
  const [lista, setLista] = useState<ZamowienieKlienta[] | null>(null);

  // „Zamów ponownie" — dokłada pozycje z zamówienia do koszyka i przenosi do niego.
  function zamowPonownie(z: ZamowienieKlienta) {
    for (const p of z.pozycje ?? []) {
      if (p?.id) dodaj(String(p.id), p.rozmiar || undefined, Math.max(1, Number(p.ilosc) || 1));
    }
    router.push("/koszyk");
  }

  useEffect(() => {
    if (zaladowano && wlaczone && !user) router.replace("/konto/logowanie");
  }, [zaladowano, wlaczone, user, router]);

  useEffect(() => {
    if (!user) return;
    pobierzZamowienia().then(setLista);
  }, [user]);

  if (!wlaczone) return <p className="text-[15px] text-ink-2">Konto jest chwilowo niedostępne.</p>;
  if (!zaladowano || !user || lista === null) return <p className="text-[15px] text-ink-2">Ładowanie zamówień…</p>;

  if (lista.length === 0) {
    return (
      <div className="text-ink-2">
        <p className="mb-4 text-[15px]">Nie masz jeszcze żadnych zamówień na tym koncie.</p>
        <Link href="/produkty" className="rounded-lg inline-block bg-ink px-6 py-3 text-[14.5px] font-bold text-white no-underline hover:bg-akcent">
          Przeglądaj produkty
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {lista.map((z) => {
        const sledzenie = z.status === "wyslane" ? linkSledzenia(z.przewoznik, z.numer_przesylki) : null;
        return (
          <div key={z.id} className="border border-linia bg-white p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <Link href={`/konto/zamowienia/${z.id}`} className="text-ink no-underline hover:text-akcent">
                <span className="text-[15px] font-bold">#{numer(z.id)}</span>
                <span className="ml-2 text-[13px] text-ink-2">{dataPl(z.created_at)}</span>
              </Link>
              <span className={`px-2.5 py-1 text-[11.5px] font-semibold ${KOLOR[z.status] ?? KOLOR.nowe}`}>{ETYKIETY[z.status] ?? z.status}</span>
            </div>
            <ul className="mb-3 flex flex-col gap-1 text-[13.5px] text-ink-2">
              {(z.pozycje ?? []).map((p, i) => (
                <li key={i}>
                  {p.nazwa}
                  {p.kolor ? ` · ${p.kolor}` : ""}
                  {p.rozmiar ? ` · rozm. ${p.rozmiar}` : ""} × {p.ilosc}
                </li>
              ))}
            </ul>
            {z.status === "oczekuje_na_platnosc" ? (
              <div className="mb-3">
                <PrzyciskPlatnosci
                  id={z.id}
                  klasa="rounded-lg bg-ink px-4 py-2.5 text-[13.5px] font-bold text-white transition-colors hover:bg-akcent disabled:opacity-60"
                />
              </div>
            ) : null}
            {sledzenie ? (
              <p className="mb-3 text-[13.5px]">
                Przesyłka <span className="font-mono text-ink">{z.numer_przesylki}</span> ·{" "}
                <a href={sledzenie} target="_blank" rel="noopener" className="font-semibold text-ink underline underline-offset-2 hover:text-akcent">
                  śledź paczkę
                </a>
              </p>
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-linia pt-3">
              <span className="text-[13px] text-ink-2">{z.metoda || ""}</span>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => zamowPonownie(z)}
                  className="rounded-lg border border-linia-2 px-3.5 py-2 text-[12.5px] font-semibold text-ink transition-colors hover:border-ink hover:bg-szary/30"
                >
                  Zamów ponownie
                </button>
                <Link
                  href={`/konto/zamowienia/${z.id}`}
                  className="rounded-lg border border-ink px-3.5 py-2 text-[12.5px] font-semibold text-ink no-underline transition-colors hover:bg-ink hover:text-white"
                >
                  Szczegóły
                </Link>
                <span className="text-[15px] font-bold">{zl(z.razem)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
