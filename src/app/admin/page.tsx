"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { type Zamowienie } from "@/lib/sklepStore";
import { statystykiKatalogu, statystykiZamowien } from "@/lib/statystyki";
import { formatCena } from "@/lib/filtrowanie";
import { KATEGORIE_LABEL, type Produkt } from "@/data/produkty";

const KATEGORIE = ["niemowleta", "dziewczynki", "chlopcy", "dorosli"] as const;
const KOLOR: Record<(typeof KATEGORIE)[number], string> = {
  dziewczynki: "oklch(70% 0.11 340)",
  chlopcy: "oklch(66% 0.10 250)",
  niemowleta: "oklch(70% 0.10 160)",
  dorosli: "oklch(62% 0.08 90)",
};

const STATUS: Record<string, { label: string; klasa: string }> = {
  nowe: { label: "Nowe", klasa: "bg-[oklch(92%_0.04_250)] text-[oklch(40%_0.13_250)]" },
  oczekuje_na_platnosc: { label: "Czeka na płatność", klasa: "bg-[oklch(93%_0.06_85)] text-[oklch(45%_0.12_75)]" },
  oplacone: { label: "Do wysłania", klasa: "bg-[oklch(92%_0.06_150)] text-[oklch(40%_0.13_150)]" },
  wyslane: { label: "Wysłane", klasa: "bg-szary text-ink-2" },
  anulowane: { label: "Anulowane", klasa: "bg-szary text-ink-2" },
};

const liczba = (n: number) => new Intl.NumberFormat("pl-PL").format(n);

function Kafel({ etykieta, wartosc, pod }: { etykieta: string; wartosc: string; pod?: string }) {
  return (
    <div className="rounded-xl border border-linia bg-white p-5">
      <p className="mb-2 text-[12.5px] font-medium text-ink-2">{etykieta}</p>
      <p className="text-[26px] font-bold leading-none tracking-tight tabular-nums">{wartosc}</p>
      {pod ? <p className="mt-2 text-[12px] text-ink-2">{pod}</p> : null}
    </div>
  );
}

function Zadanie({ href, ile, tytul, opis, pilne }: { href: string; ile: number; tytul: string; opis: string; pilne?: boolean }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-xl border border-linia bg-white p-4 no-underline transition-colors hover:border-ink"
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[17px] font-bold tabular-nums ${
          pilne ? "bg-akcent text-white" : "bg-szary text-ink"
        }`}
      >
        {ile}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14.5px] font-semibold text-ink">{tytul}</span>
        <span className="block text-[12.5px] text-ink-2">{opis}</span>
      </span>
      <span className="text-ink-2 transition-colors group-hover:text-ink">→</span>
    </Link>
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

  const widoczne = useMemo(() => produkty.filter((p) => !p.ukryty), [produkty]);
  const kat = useMemo(() => statystykiKatalogu(widoczne), [widoczne]);
  // Realne = opłacone/wysłane (prawdziwa sprzedaż przez P24). Nowe/oczekujące/anulowane nie liczą się do obrotu.
  const realne = useMemo(() => zamowienia.filter((z) => z.status === "oplacone" || z.status === "wyslane"), [zamowienia]);
  const zam = useMemo(() => statystykiZamowien(realne), [realne]);
  const doWyslania = zamowienia.filter((z) => z.status === "oplacone").length;
  const bezStanu = widoczne.filter((p) => (p.stan ?? 1) <= 0).length;
  const maxKat = Math.max(1, ...KATEGORIE.map((k) => kat.wgKategorii[k]));
  const ostatnie = useMemo(
    () => [...zamowienia].filter((z) => z.status !== "anulowane").sort((a, b) => +new Date(b.data) - +new Date(a.data)).slice(0, 6),
    [zamowienia],
  );

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-[26px] font-bold tracking-tight">Pulpit</h1>
        <p className="text-[14px] text-ink-2">
          {new Date().toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Do zrobienia */}
      <section className="mb-8">
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-ink-2">Do zrobienia</h2>
        {doWyslania === 0 && bezStanu === 0 ? (
          <div className="rounded-xl border border-linia bg-white px-5 py-4 text-[14px] text-ink-2">
            ✓ Wszystko ogarnięte — brak zamówień do wysłania i produktów bez stanu.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {doWyslania > 0 ? (
              <Zadanie href="/admin/zamowienia" ile={doWyslania} tytul="Zamówienia do wysłania" opis="Opłacone — spakuj i nadaj paczkę" pilne />
            ) : null}
            {bezStanu > 0 ? (
              <Zadanie href="/admin/magazyn" ile={bezStanu} tytul="Produkty bez stanu" opis="Widoczne w sklepie, ale 0 sztuk — uzupełnij lub ukryj" />
            ) : null}
          </div>
        )}
      </section>

      {/* Wskaźniki */}
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kafel etykieta="Obrót" wartosc={`${formatCena(zam.obrot)} zł`} pod={zam.liczba ? `śr. ${formatCena(zam.sredniaWartosc)} zł / zamówienie` : "brak opłaconych zamówień"} />
        <Kafel etykieta="Zamówienia" wartosc={liczba(zam.liczba)} pod={zam.liczba ? `${zam.sztuk} szt. sprzedanych` : "opłacone i wysłane"} />
        <Kafel etykieta="Produkty w sklepie" wartosc={liczba(kat.liczba)} pod={kat.zPromocja ? `${kat.zPromocja} w promocji` : undefined} />
        <Kafel etykieta="Średnia cena" wartosc={`${formatCena(kat.sredniaCena)} zł`} pod={kat.liczba ? `${formatCena(kat.minCena)}–${formatCena(kat.maxCena)} zł` : undefined} />
      </div>

      {/* Ruch na stronie (GA4) */}
      {ga4?.ok ? (
        <Link
          href="/admin/analityka"
          className="mb-8 flex flex-wrap items-center gap-x-8 gap-y-3 rounded-xl border border-linia bg-white px-5 py-4 no-underline transition-colors hover:border-ink"
        >
          <span className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[oklch(72%_0.12_150)] opacity-75" />
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[oklch(60%_0.13_150)]" />
            </span>
            <span className="text-[18px] font-bold tabular-nums text-ink">{liczba(ga4.naZywo ?? 0)}</span>
            <span className="text-[12.5px] text-ink-2">na stronie teraz</span>
          </span>
          <span className="flex items-baseline gap-1.5">
            <span className="text-[18px] font-bold tabular-nums text-ink">{liczba(ga4.podsumowanie?.uzytkownicy ?? 0)}</span>
            <span className="text-[12.5px] text-ink-2">odwiedzających / 28 dni</span>
          </span>
          {ga4.kanaly?.[0] ? (
            <span className="flex items-baseline gap-1.5">
              <span className="text-[14px] font-semibold text-ink">{ga4.kanaly[0].kanal}</span>
              <span className="text-[12.5px] text-ink-2">główne źródło</span>
            </span>
          ) : null}
          <span className="ml-auto text-[13px] font-semibold text-ink">Ruch na stronie →</span>
        </Link>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Ostatnie zamówienia */}
        <section className="rounded-xl border border-linia bg-white p-5 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[16px] font-bold">Ostatnie zamówienia</h2>
            <Link href="/admin/zamowienia" className="text-[13px] text-ink-2 no-underline hover:text-ink">
              Wszystkie →
            </Link>
          </div>
          {ostatnie.length === 0 ? (
            <p className="py-6 text-center text-[13.5px] text-ink-2">Jeszcze nie ma zamówień. Pojawią się tu po pierwszym zakupie.</p>
          ) : (
            <div className="flex flex-col divide-y divide-linia">
              {ostatnie.map((z) => {
                const s = STATUS[z.status ?? "nowe"] ?? STATUS.nowe;
                return (
                  <div key={z.id} className="flex items-center gap-3 py-3 text-[13.5px]">
                    <span className="w-24 shrink-0 text-ink-2">{new Date(z.data).toLocaleDateString("pl-PL")}</span>
                    <span className="min-w-0 flex-1 truncate text-ink-2">{z.pozycje.reduce((a, p) => a + p.ilosc, 0)} szt.</span>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${s.klasa}`}>{s.label}</span>
                    <span className="w-20 shrink-0 text-right font-semibold tabular-nums">{formatCena(z.razem)} zł</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Produkty wg kategorii */}
        <section className="rounded-xl border border-linia bg-white p-5 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[16px] font-bold">Produkty wg kategorii</h2>
            <Link href="/admin/produkty" className="text-[13px] text-ink-2 no-underline hover:text-ink">
              Lista →
            </Link>
          </div>
          <div className="flex flex-col gap-3.5">
            {KATEGORIE.map((k) => {
              const n = kat.wgKategorii[k];
              return (
                <div key={k}>
                  <div className="mb-1.5 flex items-center justify-between text-[13px]">
                    <span className="font-medium">{KATEGORIE_LABEL[k]}</span>
                    <span className="tabular-nums text-ink-2">{liczba(n)}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-szary">
                    <div className="h-full rounded-full" style={{ width: `${(n / maxKat) * 100}%`, background: KOLOR[k] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {ga4 && !ga4.ok ? (
        <p className="mt-6 text-[12.5px] text-ink-2">
          Google Analytics nie jest podłączone —{" "}
          <Link href="/admin/analityka" className="text-ink underline underline-offset-2">
            skonfiguruj
          </Link>
          , aby widzieć ruch na stronie.
        </p>
      ) : null}
    </div>
  );
}
