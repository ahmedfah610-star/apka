"use client";

import { useState } from "react";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [label, setLabel] = useState("ZAPISZ SIĘ");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: podłączyć realną wysyłkę (backend / ESP, np. Mailchimp).
    setLabel("DZIĘKI!");
    setEmail("");
  }

  return (
    <section className="bg-szary px-6 py-20 text-center md:px-12">
      <h2 className="mb-3 text-[26px] font-bold tracking-tight">Bądź na bieżąco</h2>
      <p className="mx-auto mb-8 max-w-md text-sm text-ink-2">
        Zapisz się i dostań info o nowych kolekcjach i wyprzedażach jako pierwszy.
      </p>
      <form onSubmit={onSubmit} className="mx-auto flex max-w-sm items-center gap-3 border-b-[1.5px] border-ink">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Twój e-mail"
          className="w-full border-none bg-transparent py-2 text-sm outline-none placeholder:text-ink-2"
        />
        <button type="submit" className="whitespace-nowrap py-2 text-sm font-semibold tracking-wide">
          {label}
        </button>
      </form>
    </section>
  );
}
