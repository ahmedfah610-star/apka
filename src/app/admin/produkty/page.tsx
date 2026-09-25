"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { KATEGORIE_LABEL, type Kategoria, type Produkt, type Wiek } from "@/data/produkty";
import { glowneZdjecie } from "@/lib/sklepStore";
import { EdytorProduktu } from "@/components/EdytorProduktu";

const PUSTY_PRODUKT: Produkt = {
  id: "",
  nazwa: "",
  cena: 0,
  kategoria: "dziewczynki" as Kategoria,
  wiek: "2-6" as Wiek,
  wiekLabel: "2-6 lat",
  badge: null,
  rozmiary: [],
  zdjecia: [],
  zdjecie: null,
  opis: undefined,
  opisHtml: null,
  kolor: null,
  stan: undefined,
  stanRozmiary: null,
  ukryty: false,
  hue: 340,
};

type Filtr = "wszystkie" | Kategoria | "bez_stanu" | "wylaczone";
const FILTRY: { key: Filtr; label: string; test: (p: Produkt) => boolean }[] = [
  { key: "wszystkie", label: "Wszystkie", test: () => true },
  { key: "niemowleta", label: KATEGORIE_LABEL.niemowleta, test: (p) => p.kategoria === "niemowleta" },
  { key: "dziewczynki", label: KATEGORIE_LABEL.dziewczynki, test: (p) => p.kategoria === "dziewczynki" },
  { key: "chlopcy", label: KATEGORIE_LABEL.chlopcy, test: (p) => p.kategoria === "chlopcy" },
  { key: "dorosli", label: KATEGORIE_LABEL.dorosli, test: (p) => p.kategoria === "dorosli" },
  { key: "bez_stanu", label: "Bez stanu", test: (p) => typeof p.stan === "number" && p.stan <= 0 },
  { key: "wylaczone", label: "Wyłączone", test: (p) => !!p.ukryty },
];
const NA_STRONE = 60;

export default function AdminProdukty() {
  const [lista, setLista] = useState<Produkt[]>([]);
  const [ladowanie, setLadowanie] = useState(true);
  const [szukaj, setSzukaj] = useState("");
  const [filtr, setFiltr] = useState<Filtr>("wszystkie");
  const [limit, setLimit] = useState(NA_STRONE);
  const [rozwiniety, setRozwiniety] = useState<string | null>(null);
  const [edytowany, setEdytowany] = useState<Produkt | null>(null);
  const [nowyOtwarty, setNowyOtwarty] = useState(false);

  const odswiez = async () => {
    setLadowanie(true);
    try {
      const r = await fetch("/api/admin/produkty");
      const d = await r.json();
      if (Array.isArray(d.items)) setLista(d.items);
    } catch {
      /* ignoruj */
    } finally {
      setLadowanie(false);
    }
  };
  useEffect(() => {
    void odswiez();
  }, []);

  const widoczne = useMemo(() => {
    const test = FILTRY.find((f) => f.key === filtr)?.test ?? (() => true);
    const q = szukaj.trim().toLowerCase();
    return lista.filter((p) => test(p) && (!q || p.nazwa.toLowerCase().includes(q)));
  }, [lista, szukaj, filtr]);
  useEffect(() => setLimit(NA_STRONE), [szukaj, filtr]);

  async function edytuj(id: string, zmiany: Partial<Pick<Produkt, "cena" | "stan" | "badge" | "ukryty" | "stanRozmiary">>) {
    const patch = { ...zmiany };
    if (zmiany.stanRozmiary) {
      patch.stan = Object.values(zmiany.stanRozmiary).reduce((s, v) => s + (Number(v) || 0), 0);
    }
    setLista((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    try {
      await fetch("/api/admin/produkty", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, zmiany }),
      });
    } catch {
      void odswiez();
    }
  }

  async function usun(id: string) {
    if (!confirm("Usunąć ten produkt na stałe?")) return;
    setLista((prev) => prev.filter((p) => p.id !== id));
    try {
      await fetch("/api/admin/produkty", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      void odswiez();
    }
  }

  const input = "w-full rounded-lg border border-linia-2 bg-white px-3 py-2 text-[14px] outline-none focus:border-ink";
  const naStanie = lista.reduce((s, p) => s + (typeof p.stan === "number" ? p.stan : 0), 0);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">Produkty</h1>
          <p className="text-[14px] text-ink-2">
            {lista.length} ofert · {naStanie} szt. z ustalonym stanem
          </p>
        </div>
        <button
          onClick={() => setNowyOtwarty(true)}
          className="rounded-lg bg-akcent px-5 py-2.5 text-[13px] font-semibold tracking-wide text-tlo transition-colors hover:bg-ink"
        >
          ＋ Wystaw nowy produkt
        </button>
      </div>

      <div className="mb-4 flex flex-col gap-3">
        <input className={`${input} max-w-sm`} placeholder="Szukaj po nazwie…" value={szukaj} onChange={(e) => setSzukaj(e.target.value)} />
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
          {FILTRY.map((f) => {
            const on = filtr === f.key;
            const ile = f.key === "wszystkie" ? lista.length : lista.filter(f.test).length;
            if (!ile && !on && f.key !== "wszystkie") return null;
            return (
              <button
                key={f.key}
                onClick={() => setFiltr(f.key)}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] transition-colors ${
                  on ? "border-ink bg-ink text-tlo" : "border-linia-2 bg-white text-ink hover:border-ink"
                }`}
              >
                {f.label} <span className={on ? "text-tlo/70" : "text-ink-2"}>{ile}</span>
              </button>
            );
          })}
        </div>
        <p className="text-[12.5px] text-ink-2">Cenę i stan zmieniasz od razu w tabeli — zapisuje się po kliknięciu obok pola. Zdjęcia, opis i rozmiary: „Edytuj".</p>
      </div>

      {/* Tabela zarządzania */}
      <div className="rounded-xl bg-white overflow-x-auto border border-linia">
        <table className="w-full text-left text-[14px] md:min-w-[820px]">
          <thead className="hidden border-b border-linia bg-szary text-[12px] uppercase tracking-wide text-ink-2 md:table-header-group">
            <tr>
              <th className="px-4 py-3 font-semibold">Produkt</th>
              <th className="px-4 py-3 font-semibold">Cena</th>
              <th className="px-4 py-3 font-semibold">Stan</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-linia">
            {widoczne.slice(0, limit).map((p) => {
              const zdj = glowneZdjecie(p);
              return (
                <Fragment key={p.id}>
                  <tr className="grid grid-cols-2 items-center gap-x-3 gap-y-2.5 bg-white p-4 align-middle md:table-row md:p-0">
                    <td className="col-span-2 md:px-4 md:py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-szary">
                          {zdj ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={zdj} alt="" className="h-full w-full object-contain p-0.5" />
                          ) : null}
                        </span>
                        <span>
                          <span className="block font-medium leading-tight">{p.nazwa}</span>
                          <span className="text-[12px] text-ink-2">{KATEGORIE_LABEL[p.kategoria] ?? p.kategoria}{p.kolor ? ` · ${p.kolor}` : ""}</span>
                        </span>
                      </div>
                    </td>
                    <td className="md:px-4 md:py-2.5">
                      <div className="flex items-center gap-1">
                        <input
                          key={`c-${p.id}-${p.cena}`}
                          defaultValue={p.cena}
                          onBlur={(e) => {
                            const v = parseFloat(e.target.value.replace(",", "."));
                            if (Number.isFinite(v) && v !== p.cena) void edytuj(p.id, { cena: v });
                          }}
                          className="rounded-md w-20 border border-linia-2 bg-white px-2 py-1 text-[13px] outline-none focus:border-ink"
                        />
                        <span className="text-[12px] text-ink-2">zł</span>
                      </div>
                    </td>
                    <td className="justify-self-end md:justify-self-auto md:px-4 md:py-2.5">
                      {p.stanRozmiary && p.rozmiary && p.rozmiary.length ? (
                        <button
                          onClick={() => setRozwiniety((r) => (r === p.id ? null : p.id))}
                          className="flex items-center gap-2 whitespace-nowrap rounded-lg border border-linia-2 bg-white px-3 py-1.5 text-[13px] hover:border-ink"
                        >
                          <span className="font-semibold">{p.stan ?? 0} szt.</span>
                          <span className="text-[12px] text-ink-2">wg rozmiarów {rozwiniety === p.id ? "▲" : "▼"}</span>
                        </button>
                      ) : (
                        <div className="flex items-center">
                          <button onClick={() => void edytuj(p.id, { stan: Math.max(0, (typeof p.stan === "number" ? p.stan : 0) - 1) })} className="rounded-lg border border-linia-2 px-2 py-1 text-ink-2 hover:text-ink" aria-label="Zmniejsz stan">
                            −
                          </button>
                          <input
                            key={`s-${p.id}-${p.stan ?? "x"}`}
                            defaultValue={p.stan ?? ""}
                            placeholder="∞"
                            onBlur={(e) => {
                              const t = e.target.value.trim();
                              const v = t === "" ? undefined : Math.max(0, parseInt(t, 10) || 0);
                              if (v !== p.stan) void edytuj(p.id, { stan: v });
                            }}
                            className="w-14 border-y border-linia-2 bg-white px-2 py-1 text-center text-[13px] outline-none focus:border-ink"
                          />
                          <button onClick={() => void edytuj(p.id, { stan: (typeof p.stan === "number" ? p.stan : 0) + 1 })} className="rounded-lg border border-linia-2 px-2 py-1 text-ink-2 hover:text-ink" aria-label="Zwiększ stan">
                            +
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="md:px-4 md:py-2.5">
                      <button
                        onClick={() => void edytuj(p.id, { ukryty: !p.ukryty })}
                        title={p.ukryty ? "Kliknij, aby pokazać w sklepie" : "Kliknij, aby ukryć w sklepie"}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${p.ukryty ? "bg-szary text-ink-2" : "bg-[oklch(72%_0.12_150)] text-tlo"}`}
                      >
                        {p.ukryty ? "Wyłączona" : "Aktywna"}
                      </button>
                    </td>
                    <td className="text-right md:px-4 md:py-2.5">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => setEdytowany(p)} className="text-[13px] font-medium text-ink underline underline-offset-2 hover:text-akcent">
                          Edytuj
                        </button>
                        <button onClick={() => void usun(p.id)} className="text-[13px] text-ink-2 underline underline-offset-2 hover:text-akcent">
                          Usuń
                        </button>
                      </div>
                    </td>
                  </tr>
                  {rozwiniety === p.id && p.stanRozmiary && p.rozmiary ? (
                    <tr className="block bg-szary/40 md:table-row">
                      <td colSpan={5} className="block px-4 py-3 md:table-cell">
                        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-2">Stan wg rozmiarów</p>
                        <div className="flex flex-wrap gap-2.5">
                          {p.rozmiary.map((s) => (
                            <label key={s} className="rounded-lg flex items-center gap-1.5 border border-linia-2 bg-white px-2.5 py-1.5">
                              <span className="text-[12px] font-semibold text-ink-2">{s}</span>
                              <input
                                key={`sr-${p.id}-${s}-${p.stanRozmiary?.[s] ?? 0}`}
                                type="number"
                                min={0}
                                defaultValue={p.stanRozmiary?.[s] ?? 0}
                                onBlur={(e) => {
                                  const v = Math.max(0, parseInt(e.target.value, 10) || 0);
                                  const akt = p.stanRozmiary?.[s] ?? 0;
                                  if (v !== akt) void edytuj(p.id, { stanRozmiary: { ...(p.stanRozmiary ?? {}), [s]: v } });
                                }}
                                className="rounded-md w-14 border border-linia-2 bg-white px-1.5 py-1 text-center text-[13px] outline-none focus:border-ink"
                              />
                            </label>
                          ))}
                        </div>
                        <p className="mt-2 text-[11px] text-ink-2">Zmiana zapisuje się po kliknięciu poza pole. Łączny stan liczy się automatycznie. Więcej (dodać/usunąć rozmiar) — w „Edytuj".</p>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {ladowanie ? (
        <p className="mt-3 text-[12px] text-ink-2">Wczytywanie…</p>
      ) : widoczne.length === 0 ? (
        <p className="mt-3 text-[13px] text-ink-2">Brak produktów dla tego filtra.</p>
      ) : widoczne.length > limit ? (
        <div className="mt-4 flex items-center gap-4">
          <button onClick={() => setLimit((l) => l + NA_STRONE)} className="rounded-lg border border-linia-2 bg-white px-4 py-2 text-[13px] font-medium hover:border-ink">
            Pokaż kolejne
          </button>
          <span className="text-[12.5px] text-ink-2">
            {limit} z {widoczne.length}
          </span>
        </div>
      ) : null}

      {edytowany ? (
        <EdytorProduktu
          produkt={edytowany}
          onZamknij={() => setEdytowany(null)}
          onZapisano={(zmiany) => {
            setLista((prev) => prev.map((p) => (p.id === edytowany.id ? { ...p, ...zmiany } : p)));
            setEdytowany(null);
          }}
        />
      ) : null}

      {nowyOtwarty ? (
        <EdytorProduktu
          nowy
          produkt={PUSTY_PRODUKT}
          onZamknij={() => setNowyOtwarty(false)}
          onZapisano={() => {
            setNowyOtwarty(false);
            void odswiez();
          }}
        />
      ) : null}
    </div>
  );
}
