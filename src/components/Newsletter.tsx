"use client";

import { useState } from "react";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [stan, setStan] = useState<"idle" | "wysylanie" | "ok" | "blad">("idle");
  const [blad, setBlad] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStan("wysylanie");
    setBlad("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const d = (await res.json().catch(() => ({}))) as { ok?: boolean; blad?: string };
      if (res.ok && d.ok) {
        setStan("ok");
        setEmail("");
      } else {
        setStan("blad");
        setBlad(d.blad || "Coś poszło nie tak.");
      }
    } catch {
      setStan("blad");
      setBlad("Błąd połączenia.");
    }
  }

  return (
    <section className="bg-szary px-6 py-20 text-center md:px-12">
      <h2 className="mb-3 text-[26px] font-bold tracking-tight">Bądź na bieżąco</h2>
      <p className="mx-auto mb-8 max-w-md text-sm text-ink-2">
        Zapisz się i dostań info o nowych kolekcjach i wyprzedażach jako pierwszy.
      </p>

      {stan === "ok" ? (
        <p className="mx-auto max-w-sm text-[15px] font-semibold text-[oklch(48%_0.13_150)]">
          ✓ Dzięki! Zapisaliśmy Twój e-mail.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mx-auto flex max-w-sm items-center gap-3 border-b-[1.5px] border-ink">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Twój e-mail"
            className="w-full border-none bg-transparent py-2 text-[16px] outline-none placeholder:text-ink-2 md:text-sm"
          />
          <button
            type="submit"
            disabled={stan === "wysylanie"}
            className="whitespace-nowrap py-2 text-sm font-semibold tracking-wide disabled:opacity-60"
          >
            {stan === "wysylanie" ? "…" : "ZAPISZ SIĘ"}
          </button>
        </form>
      )}
      {stan === "blad" ? <p className="mt-3 text-[13px] text-akcent">{blad}</p> : null}
    </section>
  );
}
