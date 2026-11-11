"use client";

import Link from "next/link";
import { fakturDoWystawienia } from "@/lib/faktura";
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
    <div className="rounded-xl border border-linia bg-white p-4 md:p-5">
      <p className="mb-2 text-[12.5px] font-medium leading-snug text-ink-2">{etykieta}</p>
      <p className="whitespace-nowrap text-[19px] font-bold leading-none tracking-tight tabular-nums md:text-[26px]">{wartosc}</p>
      {pod ? <p className="mt-2 text-[12px] leading-snug text-ink-2">{pod}</p> : null}
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
  const [opinieDoZatw, setOpinieDoZatw] = useState(0);
  const [pytanNowych, setPytanNowych] = useState(0);
  const [raport, setRaport] = useState<{ czas: string; ok: boolean; niedopasowane: number; blad?: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/produkty?lekki=1")
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
    fetch("/api/admin/opinie")
      .then((r) => r.json())
      .then((d) => setOpinieDoZatw(Array.isArray(d.items) ? d.items.filter((o: any) => !o.zatwierdzona).length : 0))
      .catch(() => {});
    fetch("/api/admin/pytania")
      .then((r) => r.json())
      .then((d) => setPytanNowych(Array.isArray(d.items) ? d.items.filter((p: any) => p.status === "nowe").length : 0))
      .catch(() => {});
    fetch("/api/admin/allegro?synchronizacja=1")
      .then((r) => r.json())
      .then((d) => setRaport(d.raport ?? null))
      .catch(() => {});
  }, []);

  const widoczne = useMemo(() => produkty.filter((p) => !p.ukryty), [produkty]);
  const kat = useMemo(() => statystykiKatalogu(widoczne), [widoczne]);
  // Realne = opłacone/wysłane (prawdziwa sprzedaż przez P24). Nowe/oczekujące/anulowane nie liczą się do obrotu.
  const realne = useMemo(() => zamowienia.filter((z) => (z.status === "oplacone" || z.status === "wyslane") && !z.klient?.test), [zamowienia]);
  // Pulpit: ostatnie 30 dni (+ porównanie z poprzednimi 30) i dzisiaj. Pełne zestawienia — Statystyki.
  const okresy = useMemo(() => {
    const dzien = 86400000;
    const teraz = Date.now();
    const wOkresie = (od: number, do_: number) => realne.filter((z) => { const t = new Date(z.data).getTime(); return t >= od && t < do_; });
    const polnoc = new Date();
    polnoc.setHours(0, 0, 0, 0);
    return {
      m30: statystykiZamowien(wOkresie(teraz - 30 * dzien, Infinity)),
      poprzednie30: statystykiZamowien(wOkresie(teraz - 60 * dzien, teraz - 30 * dzien)),
      dzis: statystykiZamowien(wOkresie(polnoc.getTime(), Infinity)),
    };
  }, [realne]);
  const zam = okresy.m30;
  // „Na dziś": zamówienia bez znacznika TEST.
  const prawdziwe = useMemo(() => zamowienia.filter((z) => !z.klient?.test), [zamowienia]);
  const teraz = Date.now();
  const doWyslaniaLista = prawdziwe.filter((z) => z.status === "oplacone" || z.status === "nowe");
  const doWyslania = doWyslaniaLista.length;
  const spoznione = doWyslaniaLista.filter((z) => teraz - new Date(z.data).getTime() > 24 * 3600 * 1000).length;
  const nieoplaconeLista = prawdziwe.filter((z) => z.status === "oczekuje_na_platnosc" && teraz - new Date(z.data).getTime() < 3 * 86400 * 1000);
  const nieoplacone = nieoplaconeLista.length;
  const przypomniane = nieoplaconeLista.filter((z) => !!(z.klient as { przypomnienie?: string } | undefined)?.przypomnienie).length;
  const syncStara = raport ? teraz - new Date(raport.czas).getTime() > 30 * 3600 * 1000 : false;
  const syncProblem = !!raport && (!raport.ok || syncStara);
  const wygaslo = !!raport && !raport.ok && /wygasło|połączenia z Allegro/i.test(raport.blad ?? "");
  const faktury = fakturDoWystawienia(prawdziwe as never);
  const zadan = [doWyslania, faktury.razem, nieoplacone, pytanNowych, opinieDoZatw, raport?.niedopasowane ?? 0, syncProblem ? 1 : 0].filter((n) => n > 0).length;
  const maxKat = Math.max(1, ...KATEGORIE.map((k) => kat.wgKategorii[k]));
  const ostatnie = useMemo(
    () => [...prawdziwe].filter((z) => z.status !== "anulowane").sort((a, b) => +new Date(b.data) - +new Date(a.data)).slice(0, 6),
    [prawdziwe],
  );

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-[26px] font-bold tracking-tight">Pulpit</h1>
        <p className="text-[14px] text-ink-2">
          {new Date().toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Na dziś */}
      <section className="mb-8">
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-ink-2">Na dziś</h2>
        {zadan === 0 ? (
          <div className="rounded-xl border border-linia bg-white px-5 py-4 text-[14px] text-ink-2">
            ✓ Wszystko ogarnięte — nic do wysłania, synchronizacja działa.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {syncProblem ? (
              <Zadanie
                href={wygaslo ? "/admin/import" : "/admin/magazyn"}
                ile={1}
                tytul={wygaslo ? "Połączenie z Allegro wygasło" : raport?.ok ? "Synchronizacja z Allegro nie działała od ponad doby" : "Ostatnia synchronizacja z Allegro nieudana"}
                opis={wygaslo ? "Stany się nie synchronizują — kliknij i połącz ponownie" : "Stany w sklepie mogą być nieaktualne — sprawdź i uruchom ręcznie"}
                pilne
              />
            ) : null}
            {doWyslania > 0 ? (
              <Zadanie
                href="/admin/pakowanie"
                ile={doWyslania}
                tytul="Zamówienia do wysłania"
                opis={spoznione ? `${spoznione} czeka ponad 24 h — wyślij jak najszybciej` : "Opłacone — lista do pakowania"}
                pilne
              />
            ) : null}
            {nieoplacone > 0 ? (
              <Zadanie
                href="/admin/zamowienia"
                ile={nieoplacone}
                tytul="Czekają na płatność"
                opis={
                  przypomniane === nieoplacone
                    ? `✓ Wysłano ${nieoplacone > 1 ? "klientom" : "klientowi"} maila z przypomnieniem i linkiem do płatności`
                    : przypomniane > 0
                      ? `Przypomnienie o płatności wysłane: ${przypomniane} z ${nieoplacone} — pozostałym wyślemy automatycznie`
                      : "Mail z przypomnieniem i linkiem do płatności wyślemy automatycznie"
                }
              />
            ) : null}
            {raport?.niedopasowane ? (
              <Zadanie href="/admin/import" ile={raport.niedopasowane} tytul="Oferty z Allegro, których nie ma w sklepie" opis="Pobierz nowe produkty jednym kliknięciem" />
            ) : null}
            {faktury.razem > 0 ? (
              <Zadanie
                href="/admin/zamowienia?filtr=faktury"
                ile={faktury.razem}
                tytul="Faktury do wystawienia"
                opis={[faktury.firmy ? `${faktury.firmy} na firmę (KSeF)` : "", faktury.osoby ? `${faktury.osoby} na osobę prywatną` : ""].filter(Boolean).join(", ") + " — wystaw i wyślij z zamówienia"}
                pilne
              />
            ) : null}
            {pytanNowych > 0 ? (
              <Zadanie href="/admin/pytania" ile={pytanNowych} tytul="Pytania od klientów" opis="Ktoś pyta o produkt — odpowiedz, póki jest zainteresowany" pilne />
            ) : null}
            {opinieDoZatw > 0 ? (
              <Zadanie href="/admin/opinie" ile={opinieDoZatw} tytul="Opinie do zatwierdzenia" opis="Nowe opinie klientów czekają na publikację" />
            ) : null}
          </div>
        )}
        {raport && !syncProblem ? (
          <p className="mt-2 text-[12px] text-ink-2">
            Synchronizacja z Allegro: ✓ {new Date(raport.czas).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })} · o każdym nowym opłaconym
            zamówieniu dostajesz e-mail.
          </p>
        ) : null}
      </section>

      {/* Sprzedaż — ostatnie 30 dni */}
      {(() => {
        const wczesniej = okresy.poprzednie30.obrot;
        const pr = wczesniej > 0 ? Math.round(((zam.obrot - wczesniej) / wczesniej) * 100) : null;
        return (
          <Link href="/admin/statystyki" className="mb-3 block rounded-xl border border-linia bg-white p-5 text-ink no-underline transition-colors hover:border-ink md:p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] font-semibold text-ink-2">Sprzedaż — ostatnie 30 dni</p>
              <span className="text-[13px] font-semibold text-ink-2">Statystyki →</span>
            </div>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="text-[36px] font-bold leading-none tracking-tight tabular-nums md:text-[42px]">{formatCena(zam.obrot)} zł</p>
              {pr !== null ? (
                <span className={`rounded-full px-2.5 py-1 text-[12.5px] font-bold ${pr >= 0 ? "bg-akcent/10 text-akcent" : "bg-[oklch(95%_0.03_25)] text-[oklch(50%_0.19_25)]"}`}>
                  {pr > 0 ? "+" : pr < 0 ? "−" : ""}
                  {Math.abs(pr)}% vs poprzednie 30 dni
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-[13.5px] text-ink-2">
              {zam.liczba ? `z ${zam.liczba} ${zam.liczba === 1 ? "zamówienia" : "zamówień"} · ${zam.sztuk} szt.` : "Brak opłaconych zamówień w ostatnich 30 dniach."}
            </p>
            {zam.liczba ? (
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-linia pt-4 text-[13.5px]">
                <div>
                  <p className="text-ink-2">Za produkty</p>
                  <p className="text-[18px] font-bold tabular-nums">{formatCena(zam.produkty)} zł</p>
                </div>
                <div>
                  <p className="text-ink-2">Za przesyłki</p>
                  <p className="text-[18px] font-bold tabular-nums">{formatCena(zam.dostawa)} zł</p>
                </div>
              </div>
            ) : null}
          </Link>
        );
      })()}

      <div className="mb-8 grid grid-cols-3 gap-3">
        <Kafel etykieta="Dzisiaj" wartosc={`${formatCena(okresy.dzis.obrot)} zł`} pod={okresy.dzis.liczba ? `${okresy.dzis.liczba} zam.` : "brak zamówień"} />
        <Kafel etykieta="Średnio na zamówienie" wartosc={zam.liczba ? `${formatCena(zam.sredniaWartosc)} zł` : "—"} pod="30 dni" />
        <Kafel etykieta="Produkty w sklepie" wartosc={liczba(kat.liczba)} pod={kat.zPromocja ? `${kat.zPromocja} w promocji` : undefined} />
      </div>


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
                  <Link key={z.id} href="/admin/zamowienia" className="flex items-center gap-3 py-3 text-[13.5px] text-ink no-underline">
                    <span className="min-w-0 flex-1">
                      <span className="block text-ink-2">
                        {new Date(z.data).toLocaleDateString("pl-PL")} · {z.pozycje.reduce((a, p) => a + p.ilosc, 0)} szt.
                      </span>
                      <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold md:hidden ${s.klasa}`}>{s.label}</span>
                    </span>
                    <span className={`hidden shrink-0 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold md:inline ${s.klasa}`}>{s.label}</span>
                    <span className="shrink-0 text-right font-semibold tabular-nums">{formatCena(z.razem)} zł</span>
                  </Link>
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

    </div>
  );
}
