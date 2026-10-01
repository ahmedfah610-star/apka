"use client";

import { useEffect, useState } from "react";
import type { RaportStanow } from "@/lib/allegroStany";

// Panel: wynik ostatniej codziennej synchronizacji ilości z Allegro + „Synchronizuj teraz".
export function SynchronizacjaStanow() {
  const [raport, setRaport] = useState<RaportStanow | null>(null);
  const [wczytano, setWczytano] = useState(false);
  const [trwa, setTrwa] = useState(false);
  const [lista, setLista] = useState(false);

  useEffect(() => {
    fetch("/api/admin/allegro?synchronizacja=1")
      .then((r) => r.json())
      .then((d) => setRaport(d.raport ?? null))
      .catch(() => {})
      .finally(() => setWczytano(true));
  }, []);

  async function teraz() {
    setTrwa(true);
    try {
      const r = await fetch("/api/admin/allegro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ akcja: "synchronizuj_stany" }),
      });
      const d = (await r.json().catch(() => null)) as RaportStanow | null;
      if (d && "czas" in d) setRaport(d);
    } finally {
      setTrwa(false);
    }
  }

  const data = raport ? new Date(raport.czas).toLocaleString("pl-PL", { dateStyle: "medium", timeStyle: "short" }) : "";

  return (
    <section className="rounded-xl border border-linia bg-white p-5">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[15px] font-bold">Stany z Allegro — codziennie ok. 22:00</h2>
        <button
          onClick={teraz}
          disabled={trwa}
          className="rounded-lg border border-linia-2 px-4 py-2 text-[13px] font-semibold text-ink transition-colors hover:border-ink disabled:opacity-60"
        >
          {trwa ? "Synchronizuję…" : "Synchronizuj teraz"}
        </button>
      </div>
      <p className="mb-3 text-[13px] text-ink-2">
        Ilość sztuk każdego rozmiaru na stronie jest ustawiana tak jak na Allegro. Sprzedałeś coś w sklepie? Zmniejsz ilość na Allegro — inaczej
        następna synchronizacja przywróci ją na stronie.
      </p>

      {!wczytano ? (
        <p className="text-[13px] text-ink-2">Wczytywanie…</p>
      ) : !raport ? (
        <p className="text-[13px] text-ink-2">Jeszcze nie było synchronizacji.</p>
      ) : (
        <div className="text-[14px]">
          <p className={`font-semibold ${raport.ok ? "text-[oklch(45%_0.13_150)]" : "text-akcent"}`}>
            {raport.ok ? "✓ Ostatnia synchronizacja udana" : "✕ Ostatnia synchronizacja nieudana"} · {data}
          </p>
          {raport.blad ? <p className="mt-1 text-akcent">{raport.blad}</p> : null}
          <ul className="mt-2 grid gap-x-6 gap-y-1 text-[13px] text-ink-2 sm:grid-cols-2">
            <li>Aktywne oferty na Allegro: <strong className="text-ink">{raport.aktywneOferty}</strong></li>
            <li>Powiązane z produktami sklepu: <strong className="text-ink">{raport.powiazane}</strong></li>
            <li>Zmienione produkty: <strong className="text-ink">{raport.zmienione}</strong></li>
            <li>Oferty bez pary w sklepie: <strong className="text-ink">{raport.niedopasowane}</strong></li>
            {raport.doPowiazaniaZostalo ? <li>Do powiązania przy następnej synchronizacji: <strong className="text-ink">{raport.doPowiazaniaZostalo}</strong></li> : null}
          </ul>
          {raport.zmianyLista.length || raport.niedopasowaneLista.length ? (
            <button onClick={() => setLista(!lista)} className="mt-3 text-[13px] font-semibold underline">
              {lista ? "Ukryj szczegóły" : "Pokaż szczegóły"}
            </button>
          ) : null}
          {lista ? (
            <div className="mt-3 grid gap-4 text-[13px]">
              {raport.zmianyLista.length ? (
                <div>
                  <p className="mb-1 font-semibold">Zmiany ilości</p>
                  <ul className="max-h-72 overflow-y-auto rounded-lg border border-linia">
                    {raport.zmianyLista.map((z, i) => (
                      <li key={i} className="flex justify-between gap-3 border-b border-linia px-3 py-1.5 last:border-0">
                        <a href={`/produkty/${z.produkt}`} target="_blank" rel="noreferrer" className="truncate hover:underline">
                          {z.nazwa}
                          {z.rozmiar ? ` · rozm. ${z.rozmiar}` : ""}
                        </a>
                        <span className="shrink-0 font-mono">
                          {z.z} → <strong>{z.na}</strong>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {raport.niedopasowaneLista.length ? (
                <div>
                  <p className="mb-1 font-semibold">Oferty Allegro, których nie ma w sklepie</p>
                  <p className="mb-1 text-ink-2">Zwykle nowe oferty — pojawią się po „Importuj oferty”.</p>
                  <ul className="max-h-72 overflow-y-auto rounded-lg border border-linia">
                    {raport.niedopasowaneLista.map((o) => (
                      <li key={o.oferta} className="border-b border-linia px-3 py-1.5 last:border-0">
                        <a href={`https://allegro.pl/oferta/${o.oferta}`} target="_blank" rel="noreferrer" className="hover:underline">
                          {o.nazwa}
                        </a>
                        {o.rozmiar ? <span className="text-ink-2"> · rozm. {o.rozmiar}</span> : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
