"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Produkt } from "@/data/produkty";
import { pobierzKatalog } from "@/lib/katalogKlient";
import { useAuth } from "@/components/AuthContext";
import { sbBrowser } from "@/lib/supabaseBrowser";

export interface PozycjaKoszyka {
  id: string;
  rozmiar?: string;
  ilosc: number;
}

interface KoszykCtx {
  pozycje: PozycjaKoszyka[];
  gotowy: boolean; // true, gdy koszyk wczytano z localStorage (hydracja)
  dodaj: (id: string, rozmiar?: string, ilosc?: number) => void;
  usun: (id: string, rozmiar?: string) => void;
  ustawIlosc: (id: string, rozmiar: string | undefined, ilosc: number) => void;
  wyczysc: () => void;
  liczbaSztuk: number;
  suma: number;
  usunieteNiedostepne: number; // ile pozycji zniknęło, bo produktu nie ma już w sklepie
}

const Kontekst = createContext<KoszykCtx | null>(null);
const KLUCZ = "fasolka-koszyk";

const tenSam = (a: PozycjaKoszyka, id: string, rozmiar?: string) =>
  a.id === id && (a.rozmiar ?? "") === (rozmiar ?? "");

// Scalenie koszyka gościa z zapisanym w koncie (unia po id+rozmiar, większa ilość).
function scalKoszyk(a: PozycjaKoszyka[], b: PozycjaKoszyka[]): PozycjaKoszyka[] {
  const mapa = new Map<string, PozycjaKoszyka>();
  for (const p of [...a, ...b]) {
    if (!p?.id) continue;
    const klucz = `${p.id}|${p.rozmiar ?? ""}`;
    const ist = mapa.get(klucz);
    if (ist) ist.ilosc = Math.max(ist.ilosc, p.ilosc || 1);
    else mapa.set(klucz, { id: p.id, rozmiar: p.rozmiar, ilosc: p.ilosc || 1 });
  }
  return [...mapa.values()];
}

export function KoszykProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [pozycje, setPozycje] = useState<PozycjaKoszyka[]>([]);
  const [gotowe, setGotowe] = useState(false);
  const zaladowanyUser = useRef<string | null>(null);
  const [katalog, setKatalog] = useState<Map<string, Produkt> | null>(null);
  const [usunieteNiedostepne, setUsunieteNiedostepne] = useState(0);

  useEffect(() => {
    pobierzKatalog().then((k) => k && setKatalog(new Map(k.map((p) => [p.id, p]))));
  }, []);

  // Produkty, których już nie ma w sklepie (zakończone/scalone oferty), wypadają z koszyka —
  // inaczej licznik pokazywał sztuki, których klient nie widzi i nie może kupić.
  useEffect(() => {
    if (!gotowe || !katalog) return;
    const zostaja = pozycje.filter((p) => katalog.has(p.id));
    if (zostaja.length === pozycje.length) return;
    setUsunieteNiedostepne((n) => n + pozycje.length - zostaja.length);
    setPozycje(zostaja);
  }, [pozycje, katalog, gotowe]);

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

  // Po zalogowaniu: wczytaj koszyk konta i scal z bieżącym (gościa).
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
      .select("koszyk")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const zBazy = Array.isArray(data?.koszyk) ? (data!.koszyk as PozycjaKoszyka[]) : [];
        if (zBazy.length) setPozycje((biezace) => scalKoszyk(biezace, zBazy));
      });
  }, [user, gotowe]);

  // Zalogowany: zapis koszyka do konta (debounce) — synchronizacja między urządzeniami.
  useEffect(() => {
    if (!gotowe || !user) return;
    const sb = sbBrowser();
    if (!sb) return;
    const t = setTimeout(() => {
      void sb
        .from("konto_dane")
        .upsert({ user_id: user.id, koszyk: pozycje, zaktualizowano: new Date().toISOString() }, { onConflict: "user_id" });
    }, 800);
    return () => clearTimeout(t);
  }, [pozycje, user, gotowe]);

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
      const prod = katalog?.get(poz.id);
      if (katalog && !prod) continue; // za chwilę wypadnie z koszyka
      szt += poz.ilosc;
      if (prod) s += prod.cena * poz.ilosc;
    }
    return { liczbaSztuk: szt, suma: s };
  }, [pozycje, katalog]);

  const wartosc: KoszykCtx = { pozycje, gotowy: gotowe, dodaj, usun, ustawIlosc, wyczysc, liczbaSztuk, suma, usunieteNiedostepne };
  return <Kontekst.Provider value={wartosc}>{children}</Kontekst.Provider>;
}

export function useKoszyk() {
  const ctx = useContext(Kontekst);
  if (!ctx) throw new Error("useKoszyk musi być użyte wewnątrz KoszykProvider");
  return ctx;
}
