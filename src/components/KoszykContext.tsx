"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { znajdzProdukt } from "@/data/produkty";

export interface PozycjaKoszyka {
  id: string;
  rozmiar?: string;
  ilosc: number;
}

interface KoszykCtx {
  pozycje: PozycjaKoszyka[];
  dodaj: (id: string, rozmiar?: string, ilosc?: number) => void;
  usun: (id: string, rozmiar?: string) => void;
  ustawIlosc: (id: string, rozmiar: string | undefined, ilosc: number) => void;
  wyczysc: () => void;
  liczbaSztuk: number;
  suma: number;
}

const Kontekst = createContext<KoszykCtx | null>(null);
const KLUCZ = "fasolka-koszyk";

const tenSam = (a: PozycjaKoszyka, id: string, rozmiar?: string) =>
  a.id === id && (a.rozmiar ?? "") === (rozmiar ?? "");

export function KoszykProvider({ children }: { children: React.ReactNode }) {
  const [pozycje, setPozycje] = useState<PozycjaKoszyka[]>([]);
  const [gotowe, setGotowe] = useState(false);

  // Wczytanie z localStorage po zamontowaniu (unikamy niezgodności SSR).
  useEffect(() => {
    try {
      const zapis = localStorage.getItem(KLUCZ);
      if (zapis) setPozycje(JSON.parse(zapis));
    } catch {
      /* ignoruj */
    }
    setGotowe(true);
  }, []);

  useEffect(() => {
    if (gotowe) localStorage.setItem(KLUCZ, JSON.stringify(pozycje));
  }, [pozycje, gotowe]);

  const dodaj = useCallback((id: string, rozmiar?: string, ilosc = 1) => {
    setPozycje((prev) => {
      const istnieje = prev.find((p) => tenSam(p, id, rozmiar));
      if (istnieje) {
        return prev.map((p) => (tenSam(p, id, rozmiar) ? { ...p, ilosc: p.ilosc + ilosc } : p));
      }
      return [...prev, { id, rozmiar, ilosc }];
    });
  }, []);

  const usun = useCallback((id: string, rozmiar?: string) => {
    setPozycje((prev) => prev.filter((p) => !tenSam(p, id, rozmiar)));
  }, []);

  const ustawIlosc = useCallback((id: string, rozmiar: string | undefined, ilosc: number) => {
    setPozycje((prev) =>
      ilosc <= 0
        ? prev.filter((p) => !tenSam(p, id, rozmiar))
        : prev.map((p) => (tenSam(p, id, rozmiar) ? { ...p, ilosc } : p)),
    );
  }, []);

  const wyczysc = useCallback(() => setPozycje([]), []);

  const { liczbaSztuk, suma } = useMemo(() => {
    let szt = 0;
    let s = 0;
    for (const poz of pozycje) {
      szt += poz.ilosc;
      const prod = znajdzProdukt(poz.id);
      if (prod) s += prod.cena * poz.ilosc;
    }
    return { liczbaSztuk: szt, suma: s };
  }, [pozycje]);

  const wartosc: KoszykCtx = { pozycje, dodaj, usun, ustawIlosc, wyczysc, liczbaSztuk, suma };
  return <Kontekst.Provider value={wartosc}>{children}</Kontekst.Provider>;
}

export function useKoszyk() {
  const ctx = useContext(Kontekst);
  if (!ctx) throw new Error("useKoszyk musi być użyte wewnątrz KoszykProvider");
  return ctx;
}
