"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { createContext, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import type { Produkt } from "@/data/produkty";

// Tryb admina w sklepie: po zalogowaniu w /admin właściciel chodzi po sklepie jak klient,
// ale przy produktach ma przyciski edycji. Uprawnienia sprawdza serwer (cookie httpOnly);
// flaga w localStorage tylko oszczędza zwykłym klientom zbędnego zapytania.

const FLAGA = "bobas-admin";
const PODGLAD = "bobas-admin-podglad";
const ZDARZENIE = "bobas:admin-zmiana";

// Edytor ładowany dopiero po kliknięciu — klienci sklepu go nie pobierają.
const EdytorProduktu = dynamic(() => import("@/components/EdytorProduktu").then((m) => m.EdytorProduktu), { ssr: false });

interface Ctx {
  admin: boolean; // zalogowany admin (sprawdzone na serwerze)
  edycja: boolean; // admin i nie w trybie „podgląd jak klient"
  ustawPodglad: (v: boolean) => void;
}
const Kontekst = createContext<Ctx>({ admin: false, edycja: false, ustawPodglad: () => {} });

export function oznaczAdmina(zalogowany: boolean) {
  try {
    if (zalogowany) localStorage.setItem(FLAGA, "1");
    else localStorage.removeItem(FLAGA);
  } catch {}
  // Logowanie w panelu i przejście do sklepu dzieje się bez przeładowania strony —
  // powiadamiamy tryb admina od razu (bez potrzeby odświeżania).
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(ZDARZENIE, { detail: zalogowany }));
}

export function TrybAdminaProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState(false);
  const [podglad, setPodglad] = useState(false);
  const sciezka = usePathname();

  // Sprawdzenie sesji: przy starcie, po każdej zmianie strony (dopóki nie jesteśmy adminem)
  // i natychmiast po zalogowaniu/wylogowaniu w panelu.
  useEffect(() => {
    try {
      setPodglad(localStorage.getItem(PODGLAD) === "1");
    } catch {}
    const sprawdz = () => {
      let flaga = false;
      try {
        flaga = localStorage.getItem(FLAGA) === "1";
      } catch {}
      if (!flaga) return setAdmin(false);
      fetch("/api/admin/login", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => {
          setAdmin(!!d.ok);
          if (!d.ok) {
            try {
              localStorage.removeItem(FLAGA); // sesja wygasła
            } catch {}
          }
        })
        .catch(() => {});
    };
    const zmiana = (e: Event) => {
      if ((e as CustomEvent<boolean>).detail) sprawdz();
      else setAdmin(false);
    };
    window.addEventListener(ZDARZENIE, zmiana);
    if (!admin) sprawdz();
    return () => window.removeEventListener(ZDARZENIE, zmiana);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sciezka]);

  const ustawPodglad = (v: boolean) => {
    setPodglad(v);
    try {
      localStorage.setItem(PODGLAD, v ? "1" : "0");
    } catch {}
  };

  return <Kontekst.Provider value={{ admin, edycja: admin && !podglad, ustawPodglad }}>{children}</Kontekst.Provider>;
}

export function useTrybAdmina() {
  return useContext(Kontekst);
}

async function wylogujZeSklepu() {
  try {
    await fetch("/api/admin/login", { method: "DELETE" });
  } catch {}
  oznaczAdmina(false);
  location.reload();
}

/** Pasek nad nagłówkiem — widoczny tylko dla zalogowanego admina. */
export function PasekAdmina() {
  const { admin, edycja, ustawPodglad } = useTrybAdmina();
  if (!admin) return null;
  return (
    <div className="bg-ink text-white">
      <div className="mx-auto flex max-w-content items-center gap-2 px-4 py-1.5 text-[12.5px] sm:gap-4 sm:px-6 md:px-10">
        <span className="flex items-center gap-1.5 font-bold">
          <span className={`h-2 w-2 rounded-full ${edycja ? "bg-[oklch(75%_0.17_150)]" : "bg-white/40"}`} aria-hidden />
          <span className="hidden sm:inline">Tryb admina</span>
          <span className="sm:hidden">Admin</span>
        </span>
        <button
          onClick={() => ustawPodglad(edycja)}
          className="rounded-md bg-white/10 px-2.5 py-1 font-semibold transition-colors hover:bg-white/20"
        >
          {edycja ? "Podgląd jak klient" : "Włącz edycję"}
        </button>
        <span className="ml-auto hidden text-white/60 lg:inline">
          {edycja ? "Ołówek przy produkcie = edycja" : "Widzisz sklep dokładnie jak klient"}
        </span>
        <Link href="/admin" className="ml-auto font-semibold text-white no-underline hover:underline lg:ml-0">
          Panel
        </Link>
        <button onClick={wylogujZeSklepu} className="font-semibold text-white/80 hover:text-white">
          Wyloguj
        </button>
      </div>
    </div>
  );
}

/** Przycisk edycji produktu: na karcie (ołówek na zdjęciu) albo na stronie produktu. */
export function EdycjaProduktu({ produkt, wariant }: { produkt: Produkt; wariant: "karta" | "strona" }) {
  const { edycja } = useTrybAdmina();
  const [otwarty, setOtwarty] = useState(false);
  const [ukrywanie, setUkrywanie] = useState(false);
  if (!edycja) return null;

  async function ukryj() {
    if (!confirm(`Ukryć „${produkt.nazwa}" w sklepie? Przywrócisz go w panelu (Lista produktów).`)) return;
    setUkrywanie(true);
    const res = await fetch("/api/admin/produkty", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: produkt.id, zmiany: { ukryty: true } }),
    }).catch(() => null);
    if (res?.ok) location.reload();
    else {
      setUkrywanie(false);
      alert("Nie udało się ukryć produktu.");
    }
  }

  // Portal + stopPropagation: karta produktu to link — kliknięcia w edytorze nie mogą do niego dotrzeć.
  const edytor = otwarty
    ? createPortal(
        <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <EdytorProduktu
      produkt={produkt}
      onZamknij={() => setOtwarty(false)}
      onZapisano={() => {
        setOtwarty(false);
        // Serwer odświeża strony po zapisie — przeładuj, żeby zobaczyć zmianę jak klient.
        setTimeout(() => location.reload(), 300);
      }}
          />
        </div>,
        document.body,
      )
    : null;

  if (wariant === "karta") {
    return (
      <>
        <button
          type="button"
          aria-label={`Edytuj: ${produkt.nazwa}`}
          title="Edytuj produkt"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOtwarty(true);
          }}
          className="absolute bottom-2 left-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white shadow-md transition-transform hover:scale-110"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M4 20h4L19 9l-4-4L4 16v4Z" />
            <path d="m13.5 6.5 4 4" />
          </svg>
        </button>
        {edytor}
      </>
    );
  }

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border-2 border-dashed border-ink/20 bg-white p-2.5">
      <span className="px-1 text-[12.5px] font-bold text-ink-2">Admin:</span>
      <button onClick={() => setOtwarty(true)} className="rounded-lg bg-ink px-3.5 py-2 text-[13.5px] font-bold text-white hover:bg-akcent">
        Edytuj produkt
      </button>
      <button
        onClick={ukryj}
        disabled={ukrywanie}
        className="rounded-lg border border-linia-2 px-3.5 py-2 text-[13.5px] font-semibold text-ink hover:border-ink disabled:opacity-60"
      >
        {ukrywanie ? "Ukrywanie…" : "Ukryj w sklepie"}
      </button>
      <span className="px-1 font-mono text-[11.5px] text-ink-2">{produkt.id}</span>
      {edytor}
    </div>
  );
}
