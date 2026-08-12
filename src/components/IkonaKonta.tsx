"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";

const IKONA = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

export function IkonaKonta() {
  const { user, wlaczone, wyloguj } = useAuth();
  const [otwarte, setOtwarte] = useState(false);
  const router = useRouter();

  if (!wlaczone) return null;

  // Gość — ikona prowadzi prosto do logowania.
  if (!user) {
    return (
      <Link
        href="/konto/logowanie"
        aria-label="Zaloguj się"
        className="relative flex items-center text-ink no-underline transition-colors hover:text-akcent"
      >
        {IKONA}
      </Link>
    );
  }

  const pozycja = "block px-4 py-2.5 text-[14px] text-ink no-underline transition-colors hover:bg-szary/50";

  // Zalogowany — ikona rozwija menu konta.
  return (
    <div className="relative flex items-center">
      <button
        onClick={() => setOtwarte((o) => !o)}
        aria-label="Menu konta"
        aria-expanded={otwarte}
        className="flex items-center text-ink transition-colors hover:text-akcent"
      >
        {IKONA}
      </button>

      {otwarte ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOtwarte(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-linia bg-white py-1.5 shadow-[0_16px_44px_-18px_rgba(0,0,0,0.4)]">
            <div className="border-b border-linia px-4 pb-2 pt-1.5">
              <p className="text-[11px] uppercase tracking-wide text-ink-3">Zalogowano jako</p>
              <p className="truncate text-[13px] font-semibold text-ink">{user.email}</p>
            </div>
            <Link href="/konto" onClick={() => setOtwarte(false)} className={pozycja}>Moje konto</Link>
            <Link href="/konto/zamowienia" onClick={() => setOtwarte(false)} className={pozycja}>Moje zamówienia</Link>
            <Link href="/ulubione" onClick={() => setOtwarte(false)} className={pozycja}>Ulubione</Link>
            <button
              onClick={() => {
                setOtwarte(false);
                void wyloguj();
                router.replace("/");
              }}
              className="mt-1 block w-full border-t border-linia px-4 py-2.5 text-left text-[14px] text-ink-2 transition-colors hover:bg-szary/50 hover:text-akcent"
            >
              Wyloguj się
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
