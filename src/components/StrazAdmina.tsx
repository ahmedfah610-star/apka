"use client";

import { useEffect, useState } from "react";
import { oznaczAdmina } from "@/components/TrybAdmina";

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
        oznaczAdmina(!!d.ok);
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
        oznaczAdmina(true);
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
      <div className="flex min-h-screen items-center justify-center bg-strona px-4">
        <form onSubmit={zaloguj} className="w-full max-w-sm rounded-2xl border border-linia bg-white p-6 shadow-[0_2px_28px_-16px_rgba(0,0,0,0.35)]">
          <div className="mb-5 flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/logo.png" alt="" className="h-10 w-auto" />
            <span className="text-[17px] font-extrabold tracking-tight">bobas-shopping</span>
          </div>
          <h1 className="mb-5 text-[24px] font-extrabold tracking-tight">Panel administracyjny</h1>
          <label className="mb-2 block text-[13px] font-semibold text-ink-2">Hasło</label>
          <input
            type="password"
            value={wpis}
            onChange={(e) => setWpis(e.target.value)}
            autoFocus
            className="mb-3 w-full rounded-lg border border-linia-2 bg-white px-3.5 py-2.5 text-[16px] outline-none focus:border-ink md:text-[14px]"
          />
          {blad ? <p className="mb-3 text-[13px] text-akcent">{blad}</p> : null}
          <button
            type="submit"
            disabled={loguje}
            className="w-full rounded-lg bg-ink px-8 py-3.5 text-[14.5px] font-bold text-white transition-colors hover:bg-akcent disabled:opacity-60"
          >
            {loguje ? "Logowanie…" : "Zaloguj"}
          </button>
          <p className="mt-4 text-[12px] leading-relaxed text-ink-2">
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
  oznaczAdmina(false);
  try {
    await fetch("/api/admin/login", { method: "DELETE" });
  } catch {
    /* ignoruj */
  }
  location.href = "/admin";
}
