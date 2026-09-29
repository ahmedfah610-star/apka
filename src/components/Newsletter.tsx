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
    <section className="border-t border-linia bg-white px-5 py-10 md:px-10 md:py-12">
      <div className="mx-auto flex max-w-content flex-col gap-5 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-[20px] font-extrabold tracking-tight">Nowości na e-mail</h2>
        <p className="text-[14px] text-ink-2">Raz w tygodniu, w czwartek — nowe produkty ze sklepu. Wypiszesz się jednym kliknięciem.</p>
      </div>

      {stan === "ok" ? (
        <p className="text-[15px] font-semibold text-akcent">
          ✓ Dzięki! Zapisaliśmy Twój e-mail.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="flex w-full max-w-md overflow-hidden rounded-lg border-2 border-ink md:w-[420px]">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Twój e-mail"
            className="w-full border-none bg-transparent px-3.5 py-2.5 text-[16px] outline-none placeholder:text-ink-2 md:text-sm"
          />
          <button
            type="submit"
            disabled={stan === "wysylanie"}
            className="whitespace-nowrap bg-ink px-5 text-[13.5px] font-bold text-white transition-colors hover:bg-akcent disabled:opacity-60"
          >
            {stan === "wysylanie" ? "…" : "Zapisz się"}
          </button>
        </form>
      )}
      </div>
      {stan === "blad" ? <p className="mx-auto mt-3 max-w-content text-[13px] text-cena">{blad}</p> : null}
    </section>
  );
}
