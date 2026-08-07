"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { sbBrowser } from "@/lib/supabaseBrowser";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface Zamowienie {
  id: string;
  created_at: string;
  status: string;
  razem: number;
  metoda: string | null;
  pozycje: any[];
}

const ETYKIETY: Record<string, string> = {
  nowe: "Przyjęte",
  oczekuje_na_platnosc: "Oczekuje na płatność",
  oplacone: "Opłacone",
  wyslane: "Wysłane",
  anulowane: "Anulowane",
};
const KOLOR: Record<string, string> = {
  oplacone: "bg-[oklch(90%_0.07_150)] text-[oklch(42%_0.13_150)]",
  wyslane: "bg-[oklch(88%_0.02_250)] text-ink",
  anulowane: "bg-szary text-ink-2",
  oczekuje_na_platnosc: "bg-[oklch(92%_0.07_85)] text-[oklch(45%_0.12_75)]",
  nowe: "bg-[oklch(90%_0.05_250)] text-[oklch(40%_0.13_250)]",
};

const zl = (n: number) => `${Number(n).toFixed(2).replace(".", ",")} zł`;
const DATA_PL = (iso: string) => new Date(iso).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });

export function HistoriaZamowien() {
  const router = useRouter();
  const { user, zaladowano, wlaczone } = useAuth();
  const [lista, setLista] = useState<Zamowienie[] | null>(null);

  useEffect(() => {
    if (zaladowano && wlaczone && !user) router.replace("/konto/logowanie");
  }, [zaladowano, wlaczone, user, router]);

  useEffect(() => {
    const sb = sbBrowser();
    if (!user || !sb) return;
    sb.from("zamowienia")
      .select("id, created_at, status, razem, metoda, pozycje")
      .order("created_at", { ascending: false })
      .then(({ data }) => setLista((data as Zamowienie[]) ?? []));
  }, [user]);

  if (!wlaczone) return <p className="text-[15px] text-ink-2">Konto jest chwilowo niedostępne.</p>;
  if (!zaladowano || !user || lista === null) return <p className="text-[15px] text-ink-2">Ładowanie zamówień…</p>;

  if (lista.length === 0) {
    return (
      <div className="text-ink-2">
        <p className="mb-4 text-[15px]">Nie masz jeszcze żadnych zamówień na tym koncie.</p>
        <Link href="/produkty" className="inline-block bg-ink px-6 py-3 text-[13px] font-semibold tracking-wide text-tlo no-underline hover:bg-akcent">
          PRZEGLĄDAJ PRODUKTY
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {lista.map((z) => (
        <div key={z.id} className="border border-linia bg-white p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[15px] font-bold">#{z.id.slice(0, 8)}</span>
              <span className="ml-2 text-[13px] text-ink-2">{DATA_PL(z.created_at)}</span>
            </div>
            <span className={`px-2.5 py-1 text-[11.5px] font-semibold ${KOLOR[z.status] ?? KOLOR.nowe}`}>{ETYKIETY[z.status] ?? z.status}</span>
          </div>
          <ul className="mb-3 flex flex-col gap-1 text-[13.5px] text-ink-2">
            {(z.pozycje ?? []).map((p: any, i: number) => (
              <li key={i}>
                {p.nazwa}
                {p.rozmiar ? ` · rozm. ${p.rozmiar}` : ""} × {p.ilosc}
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t border-linia pt-3">
            <span className="text-[13px] text-ink-2">{z.metoda || ""}</span>
            <span className="text-[15px] font-bold">{zl(z.razem)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
