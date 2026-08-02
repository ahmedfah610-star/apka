"use client";

import { useEffect, useState } from "react";

// Brama panelu. Logowanie idzie przez serwer (/api/admin/login) — hasło
// trzymane jest w zmiennej ADMIN_HASLO na serwerze, a sesja w cookie httpOnly.
// Dzięki temu endpointy /api/admin są realnie chronione (nie tylko UI).

export function StrazAdmina({ children }: { children: React.ReactNode }) {
  const [odblokowane, setOdblokowane] = useState(false);
  const [gotowe, setGotowe] = useState(false);
  const [skonfigurowane, setSkonfigurowane] = useState(true);
  const [wpis, setWpis] = useState("");
  const [blad, setBlad] = useState("");
  const [loguje, setLoguje] = useState(false);

  useEffect(() => {
    fetch("/api/admin/login")
      .then((r) => r.json())
      .then((d) => {
        setOdblokowane(!!d.ok);
        setSkonfigurowane(d.skonfigurowane !== false);
      })
      .catch(() => {})
      .finally(() => setGotowe(true));
  }, []);

  async function zaloguj(e: React.FormEvent) {
    e.preventDefault();
    setBlad("");
    setLoguje(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ haslo: wpis }),
      });
      if (res.ok) {
        setOdblokowane(true);
      } else if (res.status === 501) {
        setBlad("Panel nie jest skonfigurowany — ustaw zmienną ADMIN_HASLO.");
      } else {
        setBlad("Nieprawidłowe hasło.");
      }
    } catch {
      setBlad("Błąd połączenia. Spróbuj ponownie.");
    } finally {
      setLoguje(false);
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
          {blad ? <p className="mb-3 text-[13px] text-akcent">{blad}</p> : null}
          <button
            type="submit"
            disabled={loguje}
            className="w-full bg-ink px-8 py-3.5 text-[13px] font-semibold tracking-wide text-tlo transition-colors hover:bg-akcent disabled:opacity-60"
          >
            {loguje ? "LOGOWANIE…" : "ZALOGUJ"}
          </button>
          <p className="mt-4 text-[11px] leading-relaxed text-ink-2">
            {skonfigurowane
              ? "Logowanie po stronie serwera. Hasło ustawia zmienna ADMIN_HASLO."
              : "Uwaga: zmienna ADMIN_HASLO nie jest ustawiona — dodaj ją w konfiguracji (Vercel), aby włączyć panel."}
          </p>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}

export async function wyloguj() {
  try {
    await fetch("/api/admin/login", { method: "DELETE" });
  } catch {
    /* ignoruj */
  }
  location.href = "/admin";
}
