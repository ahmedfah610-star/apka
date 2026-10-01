"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useTrybAdmina } from "@/components/TrybAdmina";
import { useDostawa } from "@/lib/dostawaKlient";
import type { MetodaDostawy } from "@/lib/dostawa";

// Tryb admina: edycja cen kurierów, opisów metod dostawy i progu darmowej dostawy.
// Widoczne tylko dla zalogowanego admina z włączoną edycją.

type Wiersz = Pick<MetodaDostawy, "id" | "nazwa" | "opis" | "info" | "aktywna"> & { cena: string };

export function EdycjaDostaw({ klasa = "" }: { klasa?: string }) {
  const { edycja } = useTrybAdmina();
  const ustawienia = useDostawa();
  const [otwarte, setOtwarte] = useState(false);
  const [wiersze, setWiersze] = useState<Wiersz[]>([]);
  const [prog, setProg] = useState("");
  const [zapis, setZapis] = useState(false);
  const [blad, setBlad] = useState("");
  if (!edycja) return null;

  function otworz() {
    setWiersze(ustawienia.metody.map((m) => ({ id: m.id, nazwa: m.nazwa, opis: m.opis, info: m.info ?? "", aktywna: m.aktywna !== false, cena: m.cena.toFixed(2).replace(".", ",") })));
    setProg(String(ustawienia.darmowaOd).replace(".", ","));
    setBlad("");
    setOtwarte(true);
  }

  const zmien = (id: string, pole: keyof Wiersz, v: string | boolean) => setWiersze((w) => w.map((x) => (x.id === id ? { ...x, [pole]: v } : x)));
  const liczba = (t: string) => Number(t.replace(",", ".").replace(/\s/g, ""));

  async function zapisz() {
    if (wiersze.some((w) => !Number.isFinite(liczba(w.cena)) || liczba(w.cena) < 0)) return setBlad("Sprawdź ceny — wpisz liczbę, np. 12,99.");
    if (!Number.isFinite(liczba(prog)) || liczba(prog) < 0) return setBlad("Sprawdź próg darmowej dostawy.");
    if (!wiersze.some((w) => w.aktywna)) return setBlad("Zostaw włączoną co najmniej jedną metodę dostawy.");
    setZapis(true);
    setBlad("");
    const res = await fetch("/api/admin/dostawa", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ darmowaOd: liczba(prog), metody: wiersze.map((w) => ({ ...w, cena: liczba(w.cena) })) }),
    }).catch(() => null);
    const d = (await res?.json().catch(() => ({}))) as { ok?: boolean; blad?: string } | undefined;
    if (res?.ok && d?.ok) return location.reload();
    setZapis(false);
    setBlad(d?.blad || "Nie udało się zapisać.");
  }

  const pole = "w-full rounded-lg border border-linia-2 bg-white px-3 py-2 text-[16px] outline-none focus:border-ink md:text-[14px]";

  return (
    <>
      <button
        type="button"
        onClick={otworz}
        className={`inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-ink/25 bg-white px-3.5 py-2 text-[13.5px] font-bold text-ink hover:border-ink ${klasa}`}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M4 20h4L19 9l-4-4L4 16v4Z" />
        </svg>
        Edytuj dostawy (ceny i opisy)
      </button>

      {otwarte
        ? createPortal(
            <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/40 p-3 sm:p-8" onClick={() => setOtwarte(false)}>
              <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-linia px-5 py-3.5">
                  <h2 className="text-[17px] font-extrabold">Dostawy — ceny i opisy</h2>
                  <button onClick={() => setOtwarte(false)} aria-label="Zamknij" className="flex h-9 w-9 items-center justify-center text-ink-2 hover:text-ink">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m6 6 12 12M18 6 6 18" /></svg>
                  </button>
                </div>

                <div className="max-h-[75vh] overflow-y-auto p-5">
                  <label className="mb-5 block rounded-xl bg-akcent-2 p-4">
                    <span className="block text-[14px] font-bold text-ink">Darmowa dostawa od (zł)</span>
                    <span className="mb-2 block text-[12.5px] text-ink-2">Przy tej wartości koszyka klient nie płaci za dostawę. Wpisz 0, żeby dostawa była zawsze darmowa.</span>
                    <input value={prog} onChange={(e) => setProg(e.target.value)} inputMode="decimal" className={`${pole} max-w-[160px]`} />
                  </label>

                  <div className="flex flex-col gap-4">
                    {wiersze.map((w) => (
                      <div key={w.id} className={`rounded-xl border p-4 ${w.aktywna ? "border-linia-2" : "border-linia bg-szary/50"}`}>
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <input value={w.nazwa} onChange={(e) => zmien(w.id, "nazwa", e.target.value)} className={`${pole} font-bold`} aria-label="Nazwa metody" />
                          <label className="flex shrink-0 cursor-pointer items-center gap-2 text-[13px] font-semibold">
                            <input type="checkbox" checked={!!w.aktywna} onChange={(e) => zmien(w.id, "aktywna", e.target.checked)} className="h-4 w-4 accent-[var(--ink)]" />
                            Widoczna
                          </label>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[140px_1fr]">
                          <label className="text-[12.5px] font-semibold text-ink-2">
                            Cena (zł)
                            <input value={w.cena} onChange={(e) => zmien(w.id, "cena", e.target.value)} inputMode="decimal" className={`${pole} mt-1`} />
                          </label>
                          <label className="text-[12.5px] font-semibold text-ink-2">
                            Krótki opis (pod nazwą)
                            <input value={w.opis} onChange={(e) => zmien(w.id, "opis", e.target.value)} className={`${pole} mt-1`} />
                          </label>
                        </div>
                        <label className="mt-3 block text-[12.5px] font-semibold text-ink-2">
                          Dodatkowa informacja po wybraniu (opcjonalnie)
                          <textarea value={w.info ?? ""} onChange={(e) => zmien(w.id, "info", e.target.value)} rows={2} className={`${pole} mt-1 resize-y`} />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-linia px-5 py-3.5">
                  {blad ? <span className="text-[13.5px] font-semibold text-cena">{blad}</span> : <span className="text-[12.5px] text-ink-2">Zmiany od razu widzą klienci.</span>}
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => setOtwarte(false)} className="rounded-lg border border-linia-2 px-5 py-2.5 text-[14px] font-bold hover:border-ink">Anuluj</button>
                    <button onClick={zapisz} disabled={zapis} className="rounded-lg bg-ink px-6 py-2.5 text-[14px] font-bold text-white hover:bg-akcent disabled:opacity-60">
                      {zapis ? "Zapisywanie…" : "Zapisz"}
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
