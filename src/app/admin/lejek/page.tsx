"use client";

import { useEffect, useMemo, useState } from "react";
import { zdjecie } from "@/lib/zdjecia";

interface Wiersz {
  id: string;
  nazwa: string;
  zdjecie: string | null;
  kolor: string | null;
  cena: number | null;
  ukryty: boolean;
  wejscia: number;
  koszyk: number;
  kupione: number;
  zamowien: number;
}
type Sort = "wejscia" | "koszyk" | "kupione" | "konwersja";
type Filtr = "wszystkie" | "bezKoszyka" | "bezZakupu";

const proc = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0);
const OKRESY = [7, 30, 90];

// Lejek na produkt: wejścia → dodania do koszyka → zakupy. Wskazuje produkty z potencjałem
// i takie, które coś blokuje (cena, zdjęcia, brak rozmiaru).
export default function AdminLejek() {
  const [dni, setDni] = useState(30);
  const [dane, setDane] = useState<{ items: Wiersz[]; licznikOd: string | null } | null>(null);
  const [sort, setSort] = useState<Sort>("wejscia");
  const [filtr, setFiltr] = useState<Filtr>("wszystkie");

  useEffect(() => {
    setDane(null);
    fetch(`/api/admin/lejek?dni=${dni}`)
      .then((r) => r.json())
      .then((d) => setDane({ items: Array.isArray(d.items) ? d.items : [], licznikOd: d.licznikOd ?? null }))
      .catch(() => setDane({ items: [], licznikOd: null }));
  }, [dni]);

  const wiersze = useMemo(() => {
    let l = dane?.items ?? [];
    if (filtr === "bezKoszyka") l = l.filter((w) => w.wejscia >= 10 && proc(w.koszyk, w.wejscia) < 3);
    if (filtr === "bezZakupu") l = l.filter((w) => w.koszyk >= 2 && w.kupione === 0);
    const klucz = (w: Wiersz) => (sort === "konwersja" ? proc(w.kupione, w.wejscia) : w[sort]);
    return [...l].sort((a, b) => klucz(b) - klucz(a) || b.wejscia - a.wejscia);
  }, [dane, sort, filtr]);

  const suma = useMemo(() => {
    const l = dane?.items ?? [];
    return { w: l.reduce((s, x) => s + x.wejscia, 0), k: l.reduce((s, x) => s + x.koszyk, 0), z: l.reduce((s, x) => s + x.kupione, 0) };
  }, [dane]);

  const naglowek = (k: Sort, t: string) => (
    <th className="px-3 py-2.5 text-right font-semibold">
      <button onClick={() => setSort(k)} className={`uppercase ${sort === k ? "text-ink underline underline-offset-4" : ""}`}>
        {t}
      </button>
    </th>
  );

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">Produkty: wejścia i sprzedaż</h1>
          <p className="max-w-2xl text-[13.5px] text-ink-2">
            Anonimowy licznik (bez cookies — liczy wszystkich odwiedzających, bez botów i bez Ciebie w panelu).
            {dane?.licznikOd ? ` Dane od ${new Date(dane.licznikOd).toLocaleDateString("pl-PL")}.` : " Licznik dopiero zaczął zbierać dane."}
          </p>
        </div>
        <div className="inline-flex gap-1 rounded-xl border border-linia bg-white p-1">
          {OKRESY.map((d) => (
            <button key={d} onClick={() => setDni(d)} className={`rounded-lg px-3.5 py-1.5 text-[13px] ${dni === d ? "bg-ink font-semibold text-tlo" : "text-ink-2"}`}>
              {d} dni
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-3">
        {[
          { t: "Wejścia na produkty", v: suma.w, p: "" },
          { t: "Dodania do koszyka", v: suma.k, p: suma.w ? `${proc(suma.k, suma.w)}% wejść` : "" },
          { t: "Sprzedane sztuki", v: suma.z, p: suma.w ? `${proc(suma.z, suma.w)}% wejść` : "" },
        ].map((k) => (
          <div key={k.t} className="rounded-xl border border-linia bg-white p-4">
            <p className="text-[12.5px] text-ink-2">{k.t}</p>
            <p className="mt-1 text-[24px] font-bold tabular-nums">{dane ? k.v.toLocaleString("pl-PL") : "…"}</p>
            {k.p ? <p className="text-[12px] text-ink-2">{k.p}</p> : null}
          </div>
        ))}
      </div>

      <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        {(
          [
            ["wszystkie", "Wszystkie"],
            ["bezKoszyka", "Oglądają, nie dodają do koszyka"],
            ["bezZakupu", "Dodają, nie kupują"],
          ] as [Filtr, string][]
        ).map(([k, t]) => (
          <button
            key={k}
            onClick={() => setFiltr(k)}
            className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-[13px] ${filtr === k ? "border-ink bg-ink text-tlo" : "border-linia-2 text-ink"}`}
          >
            {t}
          </button>
        ))}
      </div>
      {filtr !== "wszystkie" ? (
        <p className="mb-3 text-[12.5px] text-ink-2">
          {filtr === "bezKoszyka"
            ? "Min. 10 wejść i poniżej 3% dodań do koszyka — sprawdź cenę, zdjęcia, opis i dostępne rozmiary."
            : "Min. 2 dodania do koszyka i żadnej sprzedaży — klienci rezygnują przy koszyku (koszt dostawy? brak rozmiaru?)."}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-linia bg-white">
        <table className="w-full min-w-[640px] text-[13.5px]">
          <thead className="border-b border-linia bg-szary text-[11.5px] tracking-wide text-ink-2">
            <tr>
              <th className="px-3 py-2.5 text-left font-semibold uppercase">Produkt</th>
              {naglowek("wejscia", "Wejścia")}
              {naglowek("koszyk", "Do koszyka")}
              {naglowek("kupione", "Kupione szt.")}
              {naglowek("konwersja", "Konwersja")}
            </tr>
          </thead>
          <tbody className="divide-y divide-linia">
            {dane === null ? (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-ink-2">Wczytywanie…</td></tr>
            ) : wiersze.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-ink-2">Brak danych w tym okresie — liczby pojawią się, gdy klienci zaczną oglądać produkty.</td></tr>
            ) : (
              wiersze.slice(0, 300).map((w) => (
                <tr key={w.id}>
                  <td className="px-3 py-2">
                    <a href={`/produkty/${w.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-ink no-underline hover:underline">
                      {w.zdjecie ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={zdjecie(w.zdjecie, "s128")} alt="" className="h-10 w-10 shrink-0 rounded border border-linia object-contain" />
                      ) : (
                        <span className="h-10 w-10 shrink-0 rounded bg-szary" />
                      )}
                      <span className="min-w-0">
                        <span className="line-clamp-1">{w.nazwa}</span>
                        <span className="text-[12px] text-ink-2">
                          {[w.kolor, w.cena !== null ? `${w.cena.toFixed(2).replace(".", ",")} zł` : null, w.ukryty ? "ukryty" : null].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                    </a>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{w.wejscia}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {w.koszyk}
                    {w.wejscia ? <span className="block text-[11.5px] text-ink-2">{proc(w.koszyk, w.wejscia)}%</span> : null}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{w.kupione}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{w.wejscia ? `${proc(w.kupione, w.wejscia)}%` : "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
