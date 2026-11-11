"use client";

import { useEffect, useMemo, useState } from "react";
import { formatCena } from "@/lib/filtrowanie";

interface Pozycja { id: string; nazwa: string; cena: number; ilosc: number; rozmiar?: string }
interface Zamowienie {
  id: string;
  data: string;
  pozycje: Pozycja[];
  suma: number;
  dostawa: number;
  razem: number;
  status: string;
  klient?: { test?: boolean };
}

// Statusy liczone jako zrealizowana sprzedaż.
const ZREALIZOWANE = ["oplacone", "wyslane"];
const OKRESY = [
  { dni: 7, label: "7 dni" },
  { dni: 30, label: "30 dni" },
  { dni: 90, label: "90 dni" },
  { dni: 3650, label: "Całość" },
];
const ETYKIETY_STATUS: Record<string, string> = {
  nowe: "Nowe",
  oczekuje_na_platnosc: "Oczekuje na płatność",
  oplacone: "Opłacone",
  wyslane: "Wysłane",
  anulowane: "Anulowane",
};

const dzienKey = (iso: string) => new Date(iso).toISOString().slice(0, 10);
const dzienLabel = (iso: string) => new Date(iso).toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit" });

function Kafel({ etykieta, wartosc, pod }: { etykieta: string; wartosc: string; pod?: string }) {
  return (
    <div className="rounded-xl border border-linia bg-white p-4 md:p-5">
      <p className="mb-1.5 text-[12.5px] font-semibold text-ink-2">{etykieta}</p>
      <p className="whitespace-nowrap text-[19px] font-bold leading-none tracking-tight md:text-[26px]">{wartosc}</p>
      {pod ? <p className="mt-1.5 text-[12px] leading-snug text-ink-2">{pod}</p> : null}
    </div>
  );
}

/** „+25%" / „−10%" względem poprzedniego okresu (null, gdy nie ma z czym porównać). */
function zmiana(teraz: number, wczesniej: number): { tekst: string; wzrost: boolean } | null {
  if (wczesniej <= 0) return null;
  const pr = Math.round(((teraz - wczesniej) / wczesniej) * 100);
  return { tekst: `${pr > 0 ? "+" : pr < 0 ? "−" : ""}${Math.abs(pr)}%`, wzrost: pr >= 0 };
}

/** „z 1 zamówienia", „z 4 zamówień" (dopełniacz). */
const zZamowien = (n: number) => `z ${n} ${n === 1 ? "zamówienia" : "zamówień"}`;

export default function AdminStatystyki() {
  const [lista, setLista] = useState<Zamowienie[]>([]);
  const [ladowanie, setLadowanie] = useState(true);
  const [okres, setOkres] = useState(30);

  useEffect(() => {
    fetch("/api/zamowienia")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.items)) setLista(d.items); })
      .catch(() => {})
      .finally(() => setLadowanie(false));
  }, []);

  const dane = useMemo(() => {
    const granica = Date.now() - okres * 24 * 60 * 60 * 1000;
    // Bez zamówień TEST — nigdzie w statystykach.
    const prawdziwe = lista.filter((z) => !z.klient?.test);
    const wOkresie = prawdziwe.filter((z) => new Date(z.data).getTime() >= granica);
    const zrealizowane = wOkresie.filter((z) => ZREALIZOWANE.includes(z.status));
    // Poprzedni okres tej samej długości — do porównania („+25% vs poprzednie 30 dni").
    const poprzedniOd = granica - okres * 24 * 60 * 60 * 1000;
    const obrotPoprzedni = okres >= 3650 ? 0 : prawdziwe
      .filter((z) => ZREALIZOWANE.includes(z.status) && new Date(z.data).getTime() >= poprzedniOd && new Date(z.data).getTime() < granica)
      .reduce((s, z) => s + z.razem, 0);
    const nieoplacone = wOkresie.filter((z) => z.status === "oczekuje_na_platnosc").length;
    const anulowane = wOkresie.filter((z) => z.status === "anulowane").length;

    const obrot = zrealizowane.reduce((s, z) => s + z.razem, 0);
    const dostawa = zrealizowane.reduce((s, z) => s + (Number(z.dostawa) || 0), 0);
    const darmowych = zrealizowane.filter((z) => !(Number(z.dostawa) > 0)).length;
    const sztuk = zrealizowane.reduce((s, z) => s + z.pozycje.reduce((a, p) => a + p.ilosc, 0), 0);
    const sredniaWartosc = zrealizowane.length ? obrot / zrealizowane.length : 0;

    // Obrót wg dni (zrealizowane).
    const wgDni = new Map<string, number>();
    for (const z of zrealizowane) wgDni.set(dzienKey(z.data), (wgDni.get(dzienKey(z.data)) ?? 0) + z.razem);
    // Uzupełnij brakujące dni zerami (do 30 słupków maks. dla czytelności).
    const iloscSlupkow = Math.min(okres, 30);
    const slupki: { key: string; label: string; wartosc: number }[] = [];
    for (let i = iloscSlupkow - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      slupki.push({ key, label: dzienLabel(d.toISOString()), wartosc: wgDni.get(key) ?? 0 });
    }
    const maxSlupek = Math.max(1, ...slupki.map((s) => s.wartosc));

    // Bestsellery (wg sprzedanych sztuk, ze zrealizowanych).
    const prod = new Map<string, { nazwa: string; szt: number; obrot: number }>();
    for (const z of zrealizowane) {
      for (const p of z.pozycje) {
        const w = prod.get(p.id) ?? { nazwa: p.nazwa, szt: 0, obrot: 0 };
        w.szt += p.ilosc;
        w.obrot += p.cena * p.ilosc;
        prod.set(p.id, w);
      }
    }
    const bestsellery = [...prod.values()].sort((a, b) => b.szt - a.szt).slice(0, 8);
    const maxBest = Math.max(1, ...bestsellery.map((b) => b.szt));

    // Rozkład statusów (wszystkie w okresie).
    const statusy = new Map<string, number>();
    for (const z of wOkresie) statusy.set(z.status, (statusy.get(z.status) ?? 0) + 1);

    return { obrot, obrotPoprzedni, dostawa, darmowych, sztuk, sredniaWartosc, zrealizowane: zrealizowane.length, wszystkie: wOkresie.length, nieoplacone, anulowane, slupki, maxSlupek, bestsellery, maxBest, statusy };
  }, [lista, okres]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">Statystyki sprzedaży</h1>
          <p className="text-[14px] text-ink-2">Liczymy tylko opłacone zamówienia, bez testowych.</p>
        </div>
        <div className="flex gap-2">
          {OKRESY.map((o) => (
            <button
              key={o.dni}
              onClick={() => setOkres(o.dni)}
              className={`rounded-full border px-3 py-1.5 text-[13px] transition-colors ${okres === o.dni ? "border-ink bg-ink text-tlo" : "border-linia-2 text-ink hover:border-ink"}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {ladowanie ? (
        <p className="text-[13px] text-ink-2">Wczytywanie…</p>
      ) : (
        <>
          {/* Najważniejsze: ile zarobiono w okresie */}
          {(() => {
            const okresTekst = OKRESY.find((o) => o.dni === okres)?.label ?? "";
            const z = zmiana(dane.obrot, dane.obrotPoprzedni);
            return (
              <section className="mb-4 rounded-xl border border-linia bg-white p-5 md:p-6">
                <p className="text-[13px] font-semibold text-ink-2">Sprzedaż {okres >= 3650 ? "od początku" : `— ostatnie ${okresTekst}`}</p>
                <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <p className="text-[36px] font-bold leading-none tracking-tight md:text-[44px]">{formatCena(dane.obrot)} zł</p>
                  {z ? (
                    <span className={`rounded-full px-2.5 py-1 text-[12.5px] font-bold ${z.wzrost ? "bg-akcent/10 text-akcent" : "bg-[oklch(95%_0.03_25)] text-[oklch(50%_0.19_25)]"}`}>
                      {z.tekst} vs poprzednie {okresTekst}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-[13.5px] text-ink-2">{dane.zrealizowane ? zZamowien(dane.zrealizowane) : "Brak opłaconych zamówień w tym okresie."}</p>
                {dane.zrealizowane ? (
                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-linia pt-4 text-[13.5px]">
                    <div>
                      <p className="text-ink-2">Za produkty</p>
                      <p className="text-[18px] font-bold">{formatCena(dane.obrot - dane.dostawa)} zł</p>
                    </div>
                    <div>
                      <p className="text-ink-2">Za przesyłki</p>
                      <p className="text-[18px] font-bold">{formatCena(dane.dostawa)} zł</p>
                      {dane.darmowych ? <p className="text-[12px] text-ink-2">{dane.darmowych} z darmową dostawą</p> : null}
                    </div>
                  </div>
                ) : null}
              </section>
            );
          })()}

          <div className="mb-8 grid grid-cols-3 gap-3 md:gap-4">
            <Kafel etykieta="Średnio na zamówienie" wartosc={dane.zrealizowane ? `${formatCena(dane.sredniaWartosc)} zł` : "—"} />
            <Kafel etykieta="Sprzedane sztuki" wartosc={String(dane.sztuk)} />
            <Kafel
              etykieta="Nieopłacone"
              wartosc={String(dane.nieoplacone)}
              pod={dane.anulowane ? `+ ${dane.anulowane} anulowane` : dane.nieoplacone ? "czekają na płatność" : undefined}
            />
          </div>

          {/* Wykres obrotu */}
          <section className="rounded-xl mb-8 border border-linia bg-white p-6">
            <h2 className="mb-5 text-[16px] font-bold">Obrót dzienny</h2>
            {dane.slupki.every((s) => s.wartosc === 0) ? (
              <p className="text-[13px] text-ink-2">Brak zrealizowanej sprzedaży w tym okresie.</p>
            ) : (
              <div className="flex h-52 gap-[3px] md:gap-1">
                {dane.slupki.map((s, i) => (
                  <div key={s.key} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5 md:min-w-[16px]">
                    <span className="hidden text-[10px] font-semibold text-ink-2 opacity-0 transition-opacity group-hover:opacity-100 md:block">
                      {s.wartosc > 0 ? formatCena(s.wartosc) : ""}
                    </span>
                    {/* Słupek rośnie w obszarze nad podpisem (procent liczony od tego obszaru). */}
                    <div className="flex w-full min-h-0 flex-1 items-end">
                      <div
                        className="w-full rounded-t bg-akcent/80 transition-colors group-hover:bg-akcent"
                        style={{ height: `${Math.max(s.wartosc > 0 ? 4 : 0, (s.wartosc / dane.maxSlupek) * 100)}%` }}
                      />
                    </div>
                    {/* Na telefonie co któryś podpis — przy 30 dniach wszystkie się nie mieszczą. */}
                    <span className={`whitespace-nowrap text-[9.5px] text-ink-3 ${dane.slupki.length > 10 && i % Math.ceil(dane.slupki.length / 6) !== 0 ? "invisible md:visible" : ""}`}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Bestsellery */}
            <section className="rounded-xl border border-linia bg-white p-6">
              <h2 className="mb-5 text-[16px] font-bold">Bestsellery</h2>
              {dane.bestsellery.length === 0 ? (
                <p className="text-[13px] text-ink-2">Brak sprzedaży w tym okresie.</p>
              ) : (
                <div className="flex flex-col gap-3.5">
                  {dane.bestsellery.map((b, i) => (
                    <div key={i}>
                      <div className="mb-1 flex items-center justify-between gap-3 text-[13px]">
                        <span className="min-w-0 truncate font-medium">{b.nazwa}</span>
                        <span className="shrink-0 text-ink-2">{b.szt} szt. · {formatCena(b.obrot)} zł</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-szary">
                        <div className="h-full rounded-full bg-ink" style={{ width: `${(b.szt / dane.maxBest) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Rozkład statusów */}
            <section className="rounded-xl border border-linia bg-white p-6">
              <h2 className="mb-5 text-[16px] font-bold">Zamówienia wg statusu</h2>
              {dane.wszystkie === 0 ? (
                <p className="text-[13px] text-ink-2">Brak zamówień w tym okresie.</p>
              ) : (
                <div className="flex flex-col divide-y divide-linia">
                  {Object.keys(ETYKIETY_STATUS).map((k) => {
                    const n = dane.statusy.get(k) ?? 0;
                    if (n === 0) return null;
                    return (
                      <div key={k} className="flex items-center justify-between py-2.5 text-[13.5px]">
                        <span>{ETYKIETY_STATUS[k]}</span>
                        <span className="font-semibold">{n} · {Math.round((n / dane.wszystkie) * 100)}%</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
