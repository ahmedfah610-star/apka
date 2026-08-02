"use client";

import { useState } from "react";

export function PowiadomODostepnosci({ produktId, rozmiar }: { produktId: string; rozmiar?: string | null }) {
  const [email, setEmail] = useState("");
  const [stan, setStan] = useState<"idle" | "wysylanie" | "ok" | "blad">("idle");
  const [blad, setBlad] = useState("");

  async function wyslij(e: React.FormEvent) {
    e.preventDefault();
    setStan("wysylanie");
    setBlad("");
    try {
      const res = await fetch("/api/dostepnosc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ produktId, rozmiar: rozmiar ?? null, email }),
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

  if (stan === "ok") {
    return (
      <p className="mb-8 border border-linia bg-szary/50 px-4 py-3 text-[13.5px] text-ink">
        ✓ Damy Ci znać mailem, gdy {rozmiar ? `rozmiar ${rozmiar}` : "produkt"} znów będzie dostępny.
      </p>
    );
  }

  return (
    <form onSubmit={wyslij} className="mb-8 border border-linia bg-szary/40 p-4">
      <p className="mb-2.5 text-[13.5px] font-semibold">
        {rozmiar ? `Rozmiar ${rozmiar} chwilowo niedostępny` : "Produkt chwilowo niedostępny"}
      </p>
      <p className="mb-3 text-[13px] text-ink-2">Zostaw e-mail — powiadomimy Cię, gdy wróci na stan.</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Twój e-mail"
          className="w-full border border-linia-2 bg-white px-3.5 py-2.5 text-[16px] outline-none focus:border-ink md:text-[14px]"
        />
        <button
          type="submit"
          disabled={stan === "wysylanie"}
          className="whitespace-nowrap bg-ink px-6 py-2.5 text-[13px] font-semibold tracking-wide text-tlo transition-colors hover:bg-akcent disabled:opacity-60"
        >
          {stan === "wysylanie" ? "…" : "POWIADOM MNIE"}
        </button>
      </div>
      {stan === "blad" ? <p className="mt-2 text-[13px] text-akcent">{blad}</p> : null}
    </form>
  );
}
