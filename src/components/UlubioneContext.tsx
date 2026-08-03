"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

interface UlubioneCtx {
  ids: string[];
  przelacz: (id: string) => void;
  czy: (id: string) => boolean;
  liczba: number;
}

const Kontekst = createContext<UlubioneCtx | null>(null);
const KLUCZ = "fasolka-ulubione";

export function UlubioneProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [gotowe, setGotowe] = useState(false);

  useEffect(() => {
    try {
      const zapis = localStorage.getItem(KLUCZ);
      if (zapis) setIds(JSON.parse(zapis));
    } catch {
      /* ignoruj */
    }
    setGotowe(true);
  }, []);

  useEffect(() => {
    if (gotowe) localStorage.setItem(KLUCZ, JSON.stringify(ids));
  }, [ids, gotowe]);

  const przelacz = useCallback((id: string) => {
    setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev]));
  }, []);

  const czy = useCallback((id: string) => ids.includes(id), [ids]);

  const wartosc = useMemo<UlubioneCtx>(() => ({ ids, przelacz, czy, liczba: ids.length }), [ids, przelacz, czy]);
  return <Kontekst.Provider value={wartosc}>{children}</Kontekst.Provider>;
}

export function useUlubione() {
  const ctx = useContext(Kontekst);
  if (!ctx) throw new Error("useUlubione musi być użyte wewnątrz UlubioneProvider");
  return ctx;
}
