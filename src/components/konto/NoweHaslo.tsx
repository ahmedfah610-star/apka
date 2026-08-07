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

  if (!wlaczone) return <p className="text-[15px] text-ink-2">Funkcja jest chwilowo niedostępna.</p>;
  if (ok) return <p className="text-[15px] text-[oklch(45%_0.12_150)]">Hasło zmienione. Przekierowuję do konta…</p>;

  if (zaladowano && !user) {
    return (
      <p className="text-[15px] text-ink-2">
        Link do zmiany hasła wygasł lub jest nieprawidłowy. Poproś o nowy na stronie{" "}
        <Link href="/konto/logowanie" className="underline underline-offset-2 hover:text-akcent">logowania</Link>.
      </p>
    );
  }

  return (
    <form onSubmit={zapisz} className="flex max-w-md flex-col gap-3">
      <input
        type="password"
        placeholder="Nowe hasło (min. 6 znaków)"
        value={haslo}
        onChange={(e) => setHaslo(e.target.value)}
        className="w-full border border-linia-2 bg-white px-3.5 py-2.5 text-[14px] outline-none focus:border-ink"
      />
      {blad ? <p className="text-[13px] text-akcent">{blad}</p> : null}
      <button type="submit" disabled={wysylka} className="self-start bg-ink px-6 py-3.5 text-[13px] font-semibold tracking-wide text-tlo transition-colors hover:bg-akcent disabled:opacity-60">
        {wysylka ? "ZAPISYWANIE…" : "USTAW NOWE HASŁO"}
      </button>
    </form>
  );
}
