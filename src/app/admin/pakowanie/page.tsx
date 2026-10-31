"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { zdjecie } from "@/lib/zdjecia";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface Pozycja {
  id: string;
  nazwa: string;
  cena: number;
  ilosc: number;
  rozmiar?: string;
  kolor?: string | null;
  zdjecie?: string | null;
}
interface Zamowienie {
  id: string;
  data: string;
  pozycje: Pozycja[];
  metoda: string;
  status: string;
  razem: number;
  klient: Record<string, any> & { test?: boolean };
}

const DO_PAKOWANIA = ["oplacone", "nowe"];
const KLUCZ_SPAKOWANE = "bobas-admin-spakowane";

function doWyslania(z: Zamowienie) {
  return z.pozycje.filter((p) => p.ilosc > 0);
}

function dostawa(k: Record<string, any>): string {
  if (k?.paczkomat) return `Paczkomat ${k.paczkomat}${k.paczkomatOpis ? ` — ${k.paczkomatOpis}` : ""}`;
  if (k?.punkt) return `Punkt ${k.punktOpis || k.punkt}${k.miasto ? `, ${k.miasto}` : ""}`;
  return [k?.adres, [k?.kod, k?.miasto].filter(Boolean).join(" ")].filter(Boolean).join(", ") || "—";
}

export default function AdminPakowanie() {
  const [lista, setLista] = useState<Zamowienie[] | null>(null);
  const [spakowane, setSpakowane] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/zamowienia")
      .then((r) => r.json())
      .then((d) => setLista(Array.isArray(d.items) ? d.items : []))
      .catch(() => setLista([]));
    try {
      setSpakowane(JSON.parse(localStorage.getItem(KLUCZ_SPAKOWANE) || "{}"));
    } catch {
      /* ignoruj */
    }
  }, []);

  const oznacz = (id: string, v: boolean) =>
    setSpakowane((s) => {
      const n = { ...s, [id]: v };
      try {
        localStorage.setItem(KLUCZ_SPAKOWANE, JSON.stringify(n));
      } catch {
        /* ignoruj */
      }
      return n;
    });

  // Najstarsze pierwsze — wysyłamy w kolejności opłacenia.
  const zamowienia = useMemo(
    () =>
      (lista ?? [])
        .filter((z) => DO_PAKOWANIA.includes(z.status) && !z.klient?.test && doWyslania(z).length > 0)
        .sort((a, b) => +new Date(a.data) - +new Date(b.data)),
    [lista],
  );

  // Zbiorczo: co zebrać z półki (produkt + kolor + rozmiar).
  const zbiorczo = useMemo(() => {
    const m = new Map<string, { p: Pozycja; ilosc: number; zam: string[] }>();
    for (const z of zamowienia) {
      for (const p of doWyslania(z)) {
        const k = `${p.id}|${p.rozmiar ?? ""}|${p.kolor ?? ""}`;
        const e = m.get(k) ?? { p, ilosc: 0, zam: [] };
        e.ilosc += p.ilosc;
        e.zam.push(z.id.slice(0, 8));
        m.set(k, e);
      }
    }
    return [...m.values()].sort((a, b) => a.p.nazwa.localeCompare(b.p.nazwa, "pl"));
  }, [zamowienia]);

  const sztuk = zbiorczo.reduce((s, e) => s + e.ilosc, 0);
  const gotowe = zamowienia.filter((z) => spakowane[z.id]).length;

  if (lista === null) return <p className="text-[13px] text-ink-2">Wczytywanie…</p>;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">Do pakowania</h1>
          <p className="text-[14px] text-ink-2">
            {zamowienia.length ? `${zamowienia.length} paczek · ${sztuk} szt. · spakowane ${gotowe}/${zamowienia.length}` : "Opłacone zamówienia, które czekają na wysyłkę."}
          </p>
        </div>
        {zamowienia.length ? (
          <button onClick={() => window.print()} className="nie-drukuj rounded-lg bg-ink px-4 py-2.5 text-[13.5px] font-semibold text-tlo hover:bg-akcent">
            Drukuj listę
          </button>
        ) : null}
      </div>

      {zamowienia.length === 0 ? (
        <div className="rounded-xl border border-linia bg-white px-6 py-12 text-center">
          <p className="text-[15px] font-semibold">Nic do pakowania 🎉</p>
          <p className="mt-1 text-[13px] text-ink-2">Gdy przyjdzie opłacone zamówienie, pojawi się tutaj.</p>
        </div>
      ) : (
        <>
          {/* 1. Co zebrać */}
          <section className="druk-bez-podzialu mb-8 rounded-xl border border-linia bg-white p-4 md:p-5">
            <h2 className="mb-3 text-[16px] font-bold">1. Zbierz z półki</h2>
            <div className="flex flex-col divide-y divide-linia">
              {zbiorczo.map((e) => (
                <div key={`${e.p.id}|${e.p.rozmiar}|${e.p.kolor}`} className="flex items-center gap-3 py-2.5">
                  {e.p.zdjecie ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={zdjecie(e.p.zdjecie, "s128")} alt="" className="h-14 w-14 shrink-0 rounded-md border border-linia bg-white object-contain" />
                  ) : (
                    <span className="h-14 w-14 shrink-0 rounded-md bg-szary" />
                  )}
                  <span className="min-w-0 flex-1 text-[13.5px]">
                    <span className="block font-semibold leading-snug">{e.p.nazwa}</span>
                    <span className="text-ink-2">
                      {e.p.kolor ? <>kolor: <strong className="text-ink">{e.p.kolor}</strong> · </> : null}
                      {e.p.rozmiar ? <>rozmiar: <strong className="text-ink">{e.p.rozmiar}</strong> · </> : null}
                      zam. {e.zam.map((n) => `#${n}`).join(", ")}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-lg bg-ink px-3 py-1.5 text-[16px] font-bold tabular-nums text-tlo">× {e.ilosc}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 2. Paczki */}
          <h2 className="mb-3 text-[16px] font-bold">2. Paczki</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {zamowienia.map((z) => {
              const k = z.klient ?? {};
              const pozycje = doWyslania(z);
              return (
                <div key={z.id} className={`druk-bez-podzialu rounded-xl border bg-white p-4 ${spakowane[z.id] ? "border-[oklch(75%_0.1_150)] opacity-60" : "border-linia"}`}>
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <span>
                      <span className="block text-[15px] font-bold">#{z.id.slice(0, 8)}</span>
                      <span className="text-[12px] text-ink-2">
                        {new Date(z.data).toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        {z.status === "nowe" ? " · bez płatności online" : " · opłacone"}
                      </span>
                    </span>
                    <label className="nie-drukuj flex cursor-pointer items-center gap-1.5 text-[13px] font-semibold">
                      <input type="checkbox" checked={!!spakowane[z.id]} onChange={(e) => oznacz(z.id, e.target.checked)} className="h-5 w-5" />
                      Spakowane
                    </label>
                  </div>
                  <p className="text-[13.5px] leading-relaxed">
                    <strong>{k.imie || "—"}</strong>
                    {k.telefon ? ` · ${k.telefon}` : ""}
                    <br />
                    <span className="text-ink-2">{z.metoda}</span>
                    <br />
                    {dostawa(k)}
                  </p>
                  {k.uwagi ? (
                    <p className="mt-2 rounded-md border border-[oklch(85%_0.1_85)] bg-[oklch(97%_0.04_90)] px-2.5 py-1.5 text-[13px]">
                      <strong>Uwagi:</strong> {k.uwagi}
                    </p>
                  ) : null}
                  <ul className="mt-3 flex flex-col gap-2 border-t border-linia pt-3">
                    {pozycje.map((p, i) => (
                      <li key={i} className="flex items-center gap-2.5 text-[13px]">
                        {p.zdjecie ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={zdjecie(p.zdjecie, "s128")} alt="" className="h-10 w-10 shrink-0 rounded border border-linia object-contain" />
                        ) : null}
                        <span className="min-w-0 flex-1">
                          {p.nazwa}
                          <span className="block text-[12px] text-ink-2">{[p.kolor, p.rozmiar ? `rozm. ${p.rozmiar}` : null].filter(Boolean).join(" · ")}</span>
                        </span>
                        <strong className="shrink-0 tabular-nums">× {p.ilosc}</strong>
                      </li>
                    ))}
                  </ul>
                  <Link href="/admin/zamowienia" className="nie-drukuj mt-3 inline-block text-[12.5px] text-ink-2 underline underline-offset-2">
                    Nadaj w zamówieniach →
                  </Link>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
