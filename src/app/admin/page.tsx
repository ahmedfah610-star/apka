"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { type Zamowienie } from "@/lib/sklepStore";
import { statystykiKatalogu, statystykiZamowien } from "@/lib/statystyki";
import { formatCena } from "@/lib/filtrowanie";
import { KATEGORIE_LABEL, type Produkt } from "@/data/produkty";

const KATEGORIE = ["dziewczynki", "chlopcy", "niemowleta"] as const;
const KOLOR: Record<(typeof KATEGORIE)[number], string> = {
  dziewczynki: "oklch(70% 0.11 340)",
  chlopcy: "oklch(66% 0.10 250)",
  niemowleta: "oklch(70% 0.10 160)",
};

function Kafel({ etykieta, wartosc, pod }: { etykieta: string; wartosc: string; pod?: string }) {
  return (
    <div className="border border-linia bg-white p-5">
      <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-2">{etykieta}</p>
      <p className="text-[28px] font-bold leading-none tracking-tight">{wartosc}</p>
      {pod ? <p className="mt-1.5 text-[12px] text-ink-2">{pod}</p> : null}
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function PulpitAdmina() {
  const [produkty, setProdukty] = useState<Produkt[]>([]);
  const [zamowienia, setZamowienia] = useState<Zamowienie[]>([]);
  const [ga4, setGa4] = useState<any>(null);

  useEffect(() => {
    fetch("/api/admin/produkty")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.items)) setProdukty(d.items);
      })
      .catch(() => {});
    fetch("/api/zamowienia")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.items)) setZamowienia(d.items);
      })
      .catch(() => {});
    fetch("/api/admin/ga4")
      .then((r) => r.json())
      .then((d) => setGa4(d))
      .catch(() => {});
  }, []);

  const kat = useMemo(() => statystykiKatalogu(produkty), [produkty]);
  // Realne = opłacone/wysłane (prawdziwa sprzedaż przez P24). Nowe/oczekujące/anulowane nie liczą się do obrotu.
  const realne = useMemo(() => zamowienia.filter((z) => z.status === "oplacone" || z.status === "wyslane"), [zamowienia]);
  const zam = useMemo(() => statystykiZamowien(realne), [realne]);
  const maxKat = Math.max(1, ...KATEGORIE.map((k) => kat.wgKategorii[k]));

  return (
    <div>
      <h1 className="mb-1 text-[26px] font-bold tracking-tight">Pulpit</h1>
      <p className="mb-6 text-[14px] text-ink-2">Przegląd sklepu bobas-shopping</p>

      {/* Duży skrót do magazynu — najczęstsza czynność (ustawianie ilości sztuk). */}
      <Link
        href="/admin/magazyn"
        className="mb-8 flex items-center justify-between gap-4 rounded-2xl bg-akcent px-6 py-5 text-white no-underline transition-colors hover:bg-ink"
      >
        <span>
          <span className="block text-[20px] font-bold">📦 Magazyn — ilości sztuk</span>
          <span className="block text-[14px] text-white/85">Przeglądaj produkty po kolei i ustaw, ile masz sztuk każdego rozmiaru</span>
        </span>
        <span className="shrink-0 text-[24px] font-bold">→</span>
      </Link>

      {/* Pasek GA4 — ruch na żywo i za 28 dni */}
      {ga4?.ok ? (
        <div className="mb-8 flex flex-wrap items-center gap-x-8 gap-y-3 border border-linia bg-white px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[oklch(72%_0.12_150)] opacity-75" />
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[oklch(60%_0.13_150)]" />
            </span>
            <span className="text-[18px] font-bold tabular-nums">{new Intl.NumberFormat("pl-PL").format(ga4.naZywo ?? 0)}</span>
            <span className="text-[12px] text-ink-2">aktywnych teraz</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[18px] font-bold tabular-nums">{new Intl.NumberFormat("pl-PL").format(ga4.podsumowanie?.uzytkownicy ?? 0)}</span>
            <span className="text-[12px] text-ink-2">użytkowników / 28 dni</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[18px] font-bold tabular-nums">{new Intl.NumberFormat("pl-PL").format(ga4.podsumowanie?.sesje ?? 0)}</span>
            <span className="text-[12px] text-ink-2">sesji</span>
          </div>
          {ga4.kanaly?.[0] ? (
            <div className="flex items-baseline gap-1.5">
              <span className="text-[14px] font-semibold">{ga4.kanaly[0].kanal}</span>
              <span className="text-[12px] text-ink-2">główne źródło ruchu</span>
            </div>
          ) : null}
          <Link href="/admin/analityka" className="ml-auto text-[13px] font-semibold text-ink underline underline-offset-2 hover:text-akcent">
            Pełna analityka →
          </Link>
        </div>
      ) : ga4 && !ga4.ok ? (
        <Link href="/admin/analityka" className="mb-8 flex items-center justify-between gap-3 border border-dashed border-linia-2 bg-white px-5 py-3.5 text-[13px] no-underline">
          <span className="text-ink-2">📊 Podłącz Google Analytics, aby widzieć ruch, źródła i najczęściej oglądane produkty w panelu.</span>
          <span className="shrink-0 font-semibold text-ink">Skonfiguruj →</span>
        </Link>
      ) : null}

      {/* KPI */}
      <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kafel etykieta="Produkty" wartosc={String(kat.liczba)} pod={`${kat.zPromocja} w promocji`} />
        <Kafel etykieta="Średnia cena" wartosc={`${formatCena(kat.sredniaCena)} zł`} pod={`od ${formatCena(kat.minCena)} do ${formatCena(kat.maxCena)} zł`} />
        <Kafel etykieta="Zamówienia" wartosc={String(zam.liczba)} pod={zam.liczba ? `${zam.sztuk} szt. łącznie` : "opłacone i wysłane"} />
        <Kafel etykieta="Obrót" wartosc={`${formatCena(zam.obrot)} zł`} pod={zam.liczba ? `śr. ${formatCena(zam.sredniaWartosc)} zł/zam.` : "brak opłaconych zamówień"} />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Podział na kategorie */}
        <section className="border border-linia bg-white p-6">
          <h2 className="mb-5 text-[16px] font-bold">Produkty wg kategorii</h2>
          <div className="flex flex-col gap-4">
            {KATEGORIE.map((k) => {
              const n = kat.wgKategorii[k];
              return (
                <div key={k}>
                  <div className="mb-1.5 flex items-center justify-between text-[13px]">
                    <span className="font-medium">{KATEGORIE_LABEL[k]}</span>
                    <span className="text-ink-2">
                      {n} · {kat.liczba ? Math.round((n / kat.liczba) * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-szary">
                    <div className="h-full" style={{ width: `${(n / maxKat) * 100}%`, background: KOLOR[k] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Ostatnie zamówienia */}
        <section className="border border-linia bg-white p-6">
          <h2 className="mb-5 text-[16px] font-bold">Ostatnie zamówienia</h2>
          {realne.length === 0 ? (
            <p className="text-[13px] text-ink-2">
              Brak opłaconych zamówień. Pojawią się tu po pierwszej sprzedaży przez Przelewy24.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-linia">
              {realne.slice(0, 6).map((z) => (
                <div key={z.id} className="flex items-center justify-between py-2.5 text-[13px]">
                  <span className="text-ink-2">
                    {new Date(z.data).toLocaleDateString("pl-PL")} · {z.pozycje.reduce((s, p) => s + p.ilosc, 0)} szt.
                  </span>
                  <span className="font-semibold">{formatCena(z.razem)} zł</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/admin/produkty" className="bg-ink px-6 py-3 text-[13px] font-semibold tracking-wide text-tlo no-underline transition-colors hover:bg-akcent">
          ZARZĄDZAJ PRODUKTAMI
        </Link>
        <Link href="/admin/zamowienia" className="border border-ink px-6 py-3 text-[13px] font-semibold tracking-wide text-ink no-underline transition-colors hover:bg-ink hover:text-tlo">
          ZOBACZ ZAMÓWIENIA
        </Link>
      </div>
    </div>
  );
}
