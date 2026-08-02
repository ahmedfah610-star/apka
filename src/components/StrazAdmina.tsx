"use client";

import { useEffect, useState } from "react";

// Hasło z env (lub domyślne). To MIĘKKA brama (client-side) — wystarcza dla
// demo/podglądu, ale NIE jest realnym zabezpieczeniem. Do produkcji: auth po
// stronie serwera (np. NextAuth + baza).
const HASLO = process.env.NEXT_PUBLIC_ADMIN_HASLO || "admin";
const KLUCZ = "fasolka-admin-ok";

export function StrazAdmina({ children }: { children: React.ReactNode }) {
  const [odblokowane, setOdblokowane] = useState(false);
  const [gotowe, setGotowe] = useState(false);
  const [wpis, setWpis] = useState("");
  const [blad, setBlad] = useState(false);

  useEffect(() => {
    setOdblokowane(sessionStorage.getItem(KLUCZ) === "1");
    setGotowe(true);
  }, []);

  function zaloguj(e: React.FormEvent) {
    e.preventDefault();
    if (wpis === HASLO) {
      sessionStorage.setItem(KLUCZ, "1");
      setOdblokowane(true);
      setBlad(false);
    } else {
      setBlad(true);
    }
  }

  if (!gotowe) return null;

  if (!odblokowane) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-tlo px-6">
        <form onSubmit={zaloguj} className="w-full max-w-sm">
          <p className="mb-1 text-[13px] tracking-[0.16em] text-ink-2">FASOLKA</p>
          <h1 className="mb-6 text-[26px] font-bold tracking-tight">Panel administracyjny</h1>
          <label className="mb-2 block text-[13px] font-semibold text-ink-2">Hasło</label>
          <input
            type="password"
            value={wpis}
            onChange={(e) => setWpis(e.target.value)}
            autoFocus
            className="mb-3 w-full border border-linia-2 bg-white px-3.5 py-2.5 text-[14px] outline-none focus:border-ink"
          />
          {blad ? <p className="mb-3 text-[13px] text-akcent">Nieprawidłowe hasło.</p> : null}
          <button type="submit" className="w-full bg-ink px-8 py-3.5 text-[13px] font-semibold tracking-wide text-tlo transition-colors hover:bg-akcent">
            ZALOGUJ
          </button>
          <p className="mt-4 text-[11px] leading-relaxed text-ink-2">
            Miękka brama demonstracyjna. Docelowo logowanie po stronie serwera.
          </p>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}

export function wyloguj() {
  sessionStorage.removeItem(KLUCZ);
  location.href = "/admin";
}
