"use client";

import { useState } from "react";

export function FormularzKontaktowy() {
  const [imie, setImie] = useState("");
  const [email, setEmail] = useState("");
  const [wiadomosc, setWiadomosc] = useState("");
  const [hp, setHp] = useState("");
  const [wysylka, setWysylka] = useState(false);
  const [blad, setBlad] = useState("");
  const [sukces, setSukces] = useState(false);

  async function wyslij(e: React.FormEvent) {
    e.preventDefault();
    setBlad("");
    if (!imie.trim()) return setBlad("Podaj imię.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setBlad("Podaj poprawny e-mail.");
    if (wiadomosc.trim().length < 5) return setBlad("Napisz treść wiadomości.");
    setWysylka(true);
    try {
      const r = await fetch("/api/kontakt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imie, email, wiadomosc, hp }),
      });
      const d = (await r.json().catch(() => ({}))) as { ok?: boolean; blad?: string };
      if (!r.ok || d.ok === false) {
        setWysylka(false);
        return setBlad(d.blad || "Nie udało się wysłać wiadomości.");
      }
      setSukces(true);
      setImie("");
      setEmail("");
      setWiadomosc("");
    } catch {
      setBlad("Błąd połączenia. Spróbuj ponownie.");
    }
    setWysylka(false);
  }

  if (sukces) {
    return (
      <div className="border border-[oklch(66%_0.13_150)]/40 bg-[oklch(96%_0.05_150)] px-4 py-4 text-[14.5px] text-[oklch(38%_0.12_150)]">
        Dziękujemy! Wiadomość została wysłana — odpowiemy najszybciej jak to możliwe.
      </div>
    );
  }

  const input = "w-full border border-linia-2 bg-white px-3.5 py-2.5 text-[14px] outline-none focus:border-ink";

  return (
    <form onSubmit={wyslij} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input className={input} placeholder="Imię" maxLength={60} value={imie} onChange={(e) => setImie(e.target.value)} />
        <input className={input} type="email" placeholder="Twój e-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <textarea
        className={`${input} resize-y`}
        placeholder="W czym możemy pomóc? (np. numer zamówienia i opis sprawy)"
        rows={5}
        maxLength={3000}
        value={wiadomosc}
        onChange={(e) => setWiadomosc(e.target.value)}
      />
      <input value={hp} onChange={(e) => setHp(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden className="absolute left-[-9999px] h-0 w-0 opacity-0" />
      {blad ? <p className="text-[13px] text-akcent">{blad}</p> : null}
      <button
        type="submit"
        disabled={wysylka}
        className="self-start bg-ink px-7 py-3.5 text-[13px] font-semibold tracking-wide text-tlo transition-colors hover:bg-akcent disabled:opacity-60"
      >
        {wysylka ? "WYSYŁANIE…" : "WYŚLIJ WIADOMOŚĆ"}
      </button>
    </form>
  );
}
