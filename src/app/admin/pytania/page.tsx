"use client";

import { useEffect, useMemo, useState } from "react";
import { zdjecie } from "@/lib/zdjecia";
import type { Pytanie } from "@/lib/pytania";

type Filtr = "nowe" | "odpowiedziane" | "wszystkie";

const kiedy = (iso: string) => {
  const d = new Date(iso);
  const dzis = new Date();
  const wczoraj = new Date(Date.now() - 86400000);
  const godz = d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === dzis.toDateString()) return `dziś, ${godz}`;
  if (d.toDateString() === wczoraj.toDateString()) return `wczoraj, ${godz}`;
  return `${d.toLocaleDateString("pl-PL", { day: "numeric", month: "short" })}, ${godz}`;
};

function KartaPytania({ p, onZmiana, onUsun }: { p: Pytanie; onZmiana: (p: Pytanie) => void; onUsun: (id: string) => void }) {
  const [otwarta, setOtwarta] = useState(p.status === "nowe");
  const [tekst, setTekst] = useState("");
  const [busy, setBusy] = useState(false);
  const [blad, setBlad] = useState("");

  async function akcja(akcja: "odpowiedz" | "zalatwione" | "nowe" | "usun") {
    if (akcja === "usun" && !confirm("Usunąć to pytanie (np. spam)?")) return;
    setBusy(true);
    setBlad("");
    try {
      const r = await fetch("/api/admin/pytania", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id, akcja, tekst }),
      });
      const d = (await r.json().catch(() => ({}))) as { ok?: boolean; blad?: string; pytanie?: Pytanie };
      if (!d.ok) return setBlad(d.blad || "Nie udało się.");
      if (akcja === "usun") return onUsun(p.id);
      if (d.pytanie) onZmiana(d.pytanie);
      setTekst("");
    } catch {
      setBlad("Brak połączenia.");
    } finally {
      setBusy(false);
    }
  }

  const nowe = p.status === "nowe";
  return (
    <div className={`rounded-xl border bg-white px-4 py-4 md:px-5 ${nowe ? "border-akcent shadow-[inset_0_0_0_1px_var(--akcent)]" : "border-linia"}`}>
      <div className="flex gap-3">
        {p.zdjecie ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={zdjecie(p.zdjecie, "s128")} alt="" className="h-14 w-14 shrink-0 rounded-lg border border-linia object-contain" />
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <a href={`/produkty/${p.produktId}`} target="_blank" rel="noreferrer" className="text-[14.5px] font-bold text-ink hover:text-akcent">
              {p.nazwa} ↗
            </a>
            <span className="shrink-0 text-[12px] text-ink-2">{kiedy(p.czas)}</span>
          </div>
          <p className="text-[12.5px] text-ink-2">
            {p.rozmiar ? `rozmiar ${p.rozmiar} · ` : ""}
            <a href={`mailto:${p.email}`} className="underline-offset-2 hover:underline">
              {p.email}
            </a>
          </p>
          <p className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed">{p.tresc}</p>

          {p.odpowiedz ? (
            <div className="mt-3 rounded-lg border-l-2 border-akcent bg-akcent-2/50 px-3 py-2">
              <p className="text-[11.5px] font-bold uppercase tracking-wide text-akcent">
                Twoja odpowiedź{p.odpowiedzCzas ? ` · ${kiedy(p.odpowiedzCzas)}` : ""}
              </p>
              <p className="mt-0.5 whitespace-pre-wrap text-[13.5px]">{p.odpowiedz}</p>
            </div>
          ) : null}
          {p.status === "zalatwione" && !p.odpowiedz ? <p className="mt-2 text-[12.5px] font-semibold text-ink-2">✓ Oznaczone jako załatwione</p> : null}

          {otwarta ? (
            <div className="mt-3">
              <textarea
                rows={3}
                value={tekst}
                onChange={(e) => setTekst(e.target.value)}
                placeholder={p.odpowiedz ? "Dopisz kolejną odpowiedź…" : "Napisz odpowiedź — klient dostanie ją mailem ze zdjęciem i linkiem do produktu"}
                className="w-full rounded-lg border border-linia-2 px-3 py-2.5 text-[14px] outline-none focus:border-ink"
              />
              {blad ? <p className="mt-1 text-[13px] font-semibold text-[oklch(50%_0.19_25)]">{blad}</p> : null}
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => void akcja("odpowiedz")}
                  disabled={busy || tekst.trim().length < 2}
                  className="rounded-lg bg-akcent px-4 py-2 text-[13px] font-bold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {busy ? "Wysyłanie…" : "Wyślij odpowiedź mailem"}
                </button>
                {nowe ? (
                  <button onClick={() => void akcja("zalatwione")} disabled={busy} className="rounded-lg border border-linia-2 px-4 py-2 text-[13px] font-semibold hover:border-ink">
                    Oznacz jako załatwione
                  </button>
                ) : null}
                <button onClick={() => void akcja("usun")} disabled={busy} className="px-2 py-2 text-[12.5px] text-ink-2 underline hover:text-[oklch(50%_0.19_25)]">
                  usuń (spam)
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-2 flex gap-4 text-[13px]">
              <button onClick={() => setOtwarta(true)} className="font-bold text-akcent">
                {p.odpowiedz ? "Odpowiedz ponownie ›" : "Odpowiedz ›"}
              </button>
              {!nowe ? (
                <button onClick={() => void akcja("nowe")} className="text-ink-2 underline">
                  przywróć jako nowe
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPytania() {
  const [lista, setLista] = useState<Pytanie[] | null>(null);
  const [blad, setBlad] = useState("");
  const [filtr, setFiltr] = useState<Filtr>("nowe");

  useEffect(() => {
    fetch("/api/admin/pytania")
      .then((r) => r.json())
      .then((d) => (d.ok ? setLista(d.items) : setBlad(d.blad || "Nie udało się wczytać.")))
      .catch(() => setBlad("Nie udało się wczytać."));
  }, []);

  const nowych = useMemo(() => (lista ?? []).filter((p) => p.status === "nowe").length, [lista]);
  const widoczne = useMemo(
    () =>
      (lista ?? []).filter((p) => (filtr === "nowe" ? p.status === "nowe" : filtr === "odpowiedziane" ? p.status !== "nowe" : true)),
    [lista, filtr],
  );

  const podmien = (p: Pytanie) => setLista((l) => (l ?? []).map((x) => (x.id === p.id ? p : x)));
  const usun = (id: string) => setLista((l) => (l ?? []).filter((x) => x.id !== id));

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-[26px] font-bold tracking-tight">Pytania klientów</h1>
        <p className="text-[14px] text-ink-2">Pytania z kart produktów. Odpowiedź wysyłasz stąd — klient dostaje maila z Twoją odpowiedzią i linkiem do produktu.</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ["nowe", `Nowe (${nowych})`],
            ["odpowiedziane", "Odpowiedziane i załatwione"],
            ["wszystkie", "Wszystkie"],
          ] as [Filtr, string][]
        ).map(([k, t]) => (
          <button
            key={k}
            onClick={() => setFiltr(k)}
            className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold ${filtr === k ? "border-akcent bg-akcent-2 text-akcent" : "border-linia-2 bg-white text-ink"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {blad ? <p className="text-[14px] text-[oklch(50%_0.19_25)]">{blad}</p> : null}
      {!lista && !blad ? <p className="text-[14px] text-ink-2">Wczytywanie…</p> : null}
      {lista && widoczne.length === 0 ? (
        <div className="rounded-xl border border-linia bg-white px-5 py-8 text-center text-[14px] text-ink-2">
          {filtr === "nowe" ? "✓ Brak nowych pytań — wszystko odpowiedziane." : "Brak pytań."}
        </div>
      ) : null}
      <div className="flex flex-col gap-3">
        {widoczne.map((p) => (
          <KartaPytania key={p.id} p={p} onZmiana={podmien} onUsun={usun} />
        ))}
      </div>
    </div>
  );
}
