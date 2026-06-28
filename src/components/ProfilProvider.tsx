"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ProfilPupila } from "@/types/domain";

const KLUCZ_LOCALSTORAGE = "mojalapa_profil_robocza";

export const PUSTY_PROFIL: ProfilPupila = {
  imie: "",
  gatunek: "pies",
  rasa: "",
  wiekLat: 1,
  wagaKg: 10,
  rozmiar: undefined,
  sterylizowany: false,
  stanCiala: "norma",
  aktywnosc: "umiarkowany",
  rodzajKarmy: "obie",
  alergeny: [],
  cele: [],
  schorzenie: "brak",
};

interface ProfilContextValue {
  profil: ProfilPupila;
  setProfil: (zmiana: Partial<ProfilPupila>) => void;
  resetProfil: () => void;
}

const ProfilContext = createContext<ProfilContextValue | null>(null);

// Profil pupila trzymany w stanie aplikacji i zapisywany do localStorage, żeby
// przetrwał odświeżenie strony, nawet gdy użytkownik nie jest zalogowany.
export function ProfilProvider({ children }: { children: React.ReactNode }) {
  const [profil, setProfilState] = useState<ProfilPupila>(PUSTY_PROFIL);

  useEffect(() => {
    const zapisany = window.localStorage.getItem(KLUCZ_LOCALSTORAGE);
    if (zapisany) {
      try {
        setProfilState(JSON.parse(zapisany));
      } catch {
        // ignorujemy uszkodzony zapis
      }
    }
  }, []);

  function setProfil(zmiana: Partial<ProfilPupila>) {
    setProfilState((poprzedni) => {
      const nowy = { ...poprzedni, ...zmiana };
      window.localStorage.setItem(KLUCZ_LOCALSTORAGE, JSON.stringify(nowy));
      return nowy;
    });
  }

  function resetProfil() {
    window.localStorage.removeItem(KLUCZ_LOCALSTORAGE);
    setProfilState(PUSTY_PROFIL);
  }

  return (
    <ProfilContext.Provider value={{ profil, setProfil, resetProfil }}>
      {children}
    </ProfilContext.Provider>
  );
}

export function useProfil(): ProfilContextValue {
  const ctx = useContext(ProfilContext);
  if (!ctx) throw new Error("useProfil musi być użyty wewnątrz ProfilProvider");
  return ctx;
}
