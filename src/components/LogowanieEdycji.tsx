"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { oznaczAdmina } from "@/components/TrybAdmina";

export function LogowanieEdycji() {
  const router = useRouter();
  const [haslo, setHaslo] = useState("");
  const [blad, setBlad] = useState("");
  const [loguje, setLoguje] = useState(false);
  const [sprawdzam, setSprawdzam] = useState(true);

  const doSklepu = () => {
    oznaczAdmina(true);
    try {
      localStorage.setItem("bobas-admin-podglad", "0"); // od razu z włączoną edycją
    } catch {}
    router.push("/");
  };

  // Już zalogowany → od razu do sklepu.
  useEffect(() => {
    fetch("/api/admin/login", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => (d.ok ? doSklepu() : setSprawdzam(false)))
      .catch(() => setSprawdzam(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function zaloguj(e: React.FormEvent) {
    e.preventDefault();
    setBlad("");
    setLoguje(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ haslo }),
      });
      if (res.ok) return doSklepu();
      setBlad(res.status === 429 ? "Za dużo prób. Odczekaj kilka minut." : "Nieprawidłowe hasło.");
    } catch {
      setBlad("Błąd połączenia. Spróbuj ponownie.");
    }
    setLoguje(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-strona px-4">
      <form onSubmit={zaloguj} className="w-full max-w-sm rounded-2xl border border-linia bg-white p-6 shadow-[0_2px_28px_-16px_rgba(0,0,0,0.35)]">
        <div className="mb-5 flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/logo.png" alt="" className="h-10 w-auto" />
          <span className="text-[17px] font-extrabold tracking-tight">bobas-shopping</span>
        </div>
        <h1 className="mb-1 text-[24px] font-extrabold tracking-tight">Edycja sklepu</h1>
        <p className="mb-5 text-[14px] text-ink-2">Wpisz hasło — od razu przejdziesz do sklepu z możliwością edycji produktów.</p>
        <label htmlFor="haslo" className="mb-1.5 block text-[13px] font-semibold text-ink-2">
          Hasło
        </label>
        <input
          id="haslo"
          type="password"
          autoFocus
          autoComplete="current-password"
          value={haslo}
          onChange={(e) => setHaslo(e.target.value)}
          disabled={sprawdzam}
          className="mb-3 w-full rounded-lg border border-linia-2 bg-white px-3.5 py-2.5 text-[16px] outline-none focus:border-ink md:text-[14px]"
        />
        {blad ? <p className="mb-3 text-[13.5px] font-semibold text-cena">{blad}</p> : null}
        <button
          type="submit"
          disabled={loguje || sprawdzam || !haslo}
          className="w-full rounded-lg bg-ink px-8 py-3.5 text-[14.5px] font-bold text-white transition-colors hover:bg-akcent disabled:opacity-60"
        >
          {sprawdzam ? "Sprawdzam…" : loguje ? "Logowanie…" : "Wejdź do edycji sklepu"}
        </button>
      </form>
    </div>
  );
}
