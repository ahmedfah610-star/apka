"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";

export function NoweHaslo() {
  const router = useRouter();
  const { user, zaladowano, wlaczone, ustawHaslo } = useAuth();
  const [haslo, setHaslo] = useState("");
  const [blad, setBlad] = useState("");
  const [ok, setOk] = useState(false);
  const [wysylka, setWysylka] = useState(false);

  async function zapisz(e: React.FormEvent) {
    e.preventDefault();
    setBlad("");
    if (haslo.length < 6) return setBlad("Hasło musi mieć co najmniej 6 znaków.");
    setWysylka(true);
    const r = await ustawHaslo(haslo);
    setWysylka(false);
    if (!r.ok) return setBlad(r.blad || "Nie udało się zmienić hasła.");
    setOk(true);
    setTimeout(() => router.replace("/konto"), 1500);
  }

  const karta = "rounded-2xl border border-linia bg-white p-6 shadow-[0_2px_28px_-16px_rgba(0,0,0,0.35)] sm:p-8";

  if (!wlaczone) return <div className={karta}><p className="text-center text-[15px] text-ink-2">Funkcja jest chwilowo niedostępna.</p></div>;
  if (ok) return <div className={karta}><p className="text-center text-[15px] text-[oklch(45%_0.12_150)]">Hasło zmienione. Przekierowuję do konta…</p></div>;

  if (zaladowano && !user) {
    return (
      <div className={karta}>
        <p className="text-center text-[15px] text-ink-2">
          Link do zmiany hasła wygasł lub jest nieprawidłowy. Poproś o nowy na stronie{" "}
          <Link href="/konto/logowanie" className="underline underline-offset-2 hover:text-akcent">logowania</Link>.
        </p>
      </div>
    );
  }

  return (
    <div className={karta}>
      <h1 className="mb-1 text-center text-[24px] font-bold tracking-tight md:text-[27px]">Ustaw nowe hasło</h1>
      <p className="mb-6 text-center text-[13.5px] text-ink-2">Wpisz nowe hasło do swojego konta.</p>
      <form onSubmit={zapisz} className="flex flex-col gap-3">
        <input
          type="password"
          placeholder="Nowe hasło (min. 6 znaków)"
          autoComplete="new-password"
          value={haslo}
          onChange={(e) => setHaslo(e.target.value)}
          className="w-full rounded-lg border border-linia-2 bg-white px-4 py-3 text-[15px] outline-none transition-colors focus:border-ink"
        />
        {blad ? <p className="rounded-lg bg-akcent/5 px-3 py-2 text-[13px] text-akcent">{blad}</p> : null}
        <button type="submit" disabled={wysylka} className="mt-1 rounded-lg bg-ink px-6 py-3.5 text-[13px] font-semibold tracking-wide text-tlo transition-colors hover:bg-akcent disabled:opacity-60">
          {wysylka ? "ZAPISYWANIE…" : "USTAW NOWE HASŁO"}
        </button>
      </form>
    </div>
  );
}
