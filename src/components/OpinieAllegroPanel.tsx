"use client";

import { useState } from "react";

// Panel: ręczne pobranie opinii o sklepie z Allegro (automatycznie — codziennie z synchronizacją stanów).
export function OpinieAllegroPanel() {
  const [trwa, setTrwa] = useState(false);
  const [wynik, setWynik] = useState<string>("");

  async function pobierz() {
    setTrwa(true);
    setWynik("");
    try {
      const r = await fetch("/api/admin/allegro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ akcja: "opinie" }),
      });
      const d = (await r.json().catch(() => null)) as { ok?: boolean; opinii?: number; ocen?: number; blad?: string } | null;
      setWynik(
        d?.ok
          ? `Gotowe: ${d.ocen} ocen na Allegro, ${d.opinii} opinii z treścią — już widać je na stronie.`
          : `Nie udało się: ${d?.blad ?? "błąd połączenia"}. Jeśli to „403”, połącz Allegro ponownie (Produkty → Allegro).`,
      );
    } finally {
      setTrwa(false);
    }
  }

  return (
    <section className="rounded-xl border border-linia bg-white p-5">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[15px] font-bold">Opinie z Allegro na stronie — codziennie ok. 22:00</h2>
        <button
          onClick={pobierz}
          disabled={trwa}
          className="rounded-lg border border-linia-2 px-4 py-2 text-[13px] font-semibold text-ink transition-colors hover:border-ink disabled:opacity-60"
        >
          {trwa ? "Pobieram…" : "Pobierz teraz"}
        </button>
      </div>
      <p className="text-[13px] text-ink-2">
        Procent poleceń, liczba ocen i najnowsze opinie z treścią (także negatywne, z Twoimi odpowiedziami) — pod ceną produktu, na stronie głównej,
        w zamówieniu i na stronie <a href="/opinie" target="_blank" rel="noreferrer">/opinie</a>.
      </p>
      {wynik ? <p className="mt-2 text-[13.5px] font-semibold">{wynik}</p> : null}
    </section>
  );
}
