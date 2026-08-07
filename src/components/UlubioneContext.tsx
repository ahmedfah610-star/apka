"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/AuthContext";
import { sbBrowser } from "@/lib/supabaseBrowser";

interface UlubioneCtx {
  ids: string[];
  przelacz: (id: string) => void;
  czy: (id: string) => boolean;
  liczba: number;
}

const Kontekst = createContext<UlubioneCtx | null>(null);
const KLUCZ = "fasolka-ulubione";

export function UlubioneProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [ids, setIds] = useState<string[]>([]);
  const [gotowe, setGotowe] = useState(false);
  const zaladowanyUser = useRef<string | null>(null);

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

  // Po zalogowaniu: scal ulubione konta z bieżącymi (gościa).
  useEffect(() => {
    if (!gotowe) return;
    const sb = sbBrowser();
    if (!user) {
      zaladowanyUser.current = null;
      return;
    }
    if (zaladowanyUser.current === user.id || !sb) return;
    zaladowanyUser.current = user.id;
    sb.from("konto_dane")
      .select("ulubione")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const zBazy = Array.isArray(data?.ulubione) ? (data!.ulubione as string[]) : [];
        if (zBazy.length) setIds((biezace) => Array.from(new Set([...zBazy, ...biezace])));
      });
  }, [user, gotowe]);

  // Zalogowany: zapis ulubionych do konta (debounce).
  useEffect(() => {
    if (!gotowe || !user) return;
    const sb = sbBrowser();
    if (!sb) return;
    const t = setTimeout(() => {
      void sb
        .from("konto_dane")
        .upsert({ user_id: user.id, ulubione: ids, zaktualizowano: new Date().toISOString() }, { onConflict: "user_id" });
    }, 800);
    return () => clearTimeout(t);
  }, [ids, user, gotowe]);

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
