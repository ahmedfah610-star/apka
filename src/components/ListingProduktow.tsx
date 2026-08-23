"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Nawigacja } from "@/components/Nawigacja";
import { KartaProduktu } from "@/components/KartaProduktu";
import { Stopka } from "@/components/Stopka";
import { KATEGORIE_LABEL, PRODUKTY, type Produkt } from "@/data/produkty";
import {
  filtrujProdukty,
  ZAKRESY_CENY,
  type FiltrKategoria,
  type FiltrWiek,
  type FiltrWyroznienie,
  type Sortowanie,
} from "@/lib/filtrowanie";

const KATEGORIE: { key: FiltrKategoria; label: string }[] = [
  { key: "wszystkie", label: "Wszystkie" },
  { key: "dziewczynki", label: "Dziewczynki" },
  { key: "chlopcy", label: "Chłopcy" },
  { key: "niemowleta", label: "Niemowlęta" },
];

const WIEKI: { key: FiltrWiek; label: string }[] = [
  { key: "0-2", label: "0-2 lata" },
  { key: "2-6", label: "2-6 lat" },
  { key: "6-12", label: "6-12 lat" },
];

const WYROZNIENIA: { key: FiltrWyroznienie; label: string }[] = [
  { key: "NOWOŚĆ", label: "Nowości" },
  { key: "BESTSELLER", label: "Bestsellery" },
  { key: "promocja", label: "Promocje" },
];

// Opisy kategorii (SEO) — widoczne pod nagłówkiem strony kategorii.
const OPISY_KATEGORII: Record<string, string> = {
  wszystkie:
    "Pełna oferta ubranek dla dzieci 0–12 lat — od body i pajacyków dla niemowląt, po dresy, bluzy i sukienki dla starszaków. Miękkie, bezpieczne materiały i wygodne kroje na co dzień. Wysyłka InPost, 14 dni na zwrot.",
  dziewczynki:
    "Ubranka dla dziewczynek 0–12 lat: sukienki, legginsy, bluzy, komplety i body. Miękkie tkaniny i wygodne fasony — na przedszkole, spacer i wyjątkowe okazje.",
  chlopcy:
    "Ubranka dla chłopców 0–12 lat: dresy, spodnie, bluzy, komplety i koszulki. Wytrzymałe i wygodne, gotowe na przedszkole, plac zabaw i każdą przygodę.",
  niemowleta:
    "Ubranka dla niemowląt i noworodków: body, pajacyki, śpiochy, komplety i czapeczki. Delikatna bawełna, zatrzaski ułatwiające przewijanie i płaskie szwy przyjazne skórze malucha.",
};

function Listing() {
  const params = useSearchParams();

  // Katalog z kodu + produkty dodane w panelu (localStorage).
  const [wszystkie, setWszystkie] = useState<Produkt[]>(PRODUKTY);
  useEffect(() => {
    fetch("/api/katalog")
      .then((r) => r.json())
      .then((d) => {
        // Nie nadpisuj działającego katalogu pustą odpowiedzią (ochrona wyszukiwarki i listy).
        if (Array.isArray(d.items) && d.items.length) setWszystkie(d.items);
      })
      .catch(() => {});
  }, []);
  const DOSTEPNE_ROZMIARY = useMemo(
    () => Array.from(new Set(wszystkie.flatMap((p) => p.rozmiary ?? []))).sort((a, b) => Number(a) - Number(b)),
    [wszystkie],
  );

  const fraza = params.get("szukaj") ?? "";
  const startKat = params.get("kategoria");
  const poczatkowa: FiltrKategoria =
    startKat && startKat !== "wyprzedaz" && startKat in KATEGORIE_LABEL
      ? (startKat as FiltrKategoria)
      : "wszystkie";

  const [kategoria, setKategoria] = useState<FiltrKategoria>(poczatkowa);
  const [wiek, setWiek] = useState<FiltrWiek>("wszystkie");
  const [rozmiary, setRozmiary] = useState<string[]>([]);
  const [cenaIdx, setCenaIdx] = useState<number | null>(null);
  const [wyroznienie, setWyroznienie] = useState<FiltrWyroznienie>("wszystkie");
  const [sortBy, setSortBy] = useState<Sortowanie>("domyslnie");
  const [filtryOtwarte, setFiltryOtwarte] = useState(false);

  const produkty = useMemo(
    () =>
      filtrujProdukty(wszystkie, {
        kategoria,
        wiek,
        sortBy,
        rozmiary,
        cena: cenaIdx !== null ? ZAKRESY_CENY[cenaIdx] : null,
        wyroznienie,
        fraza,
      }),
    [wszystkie, kategoria, wiek, sortBy, rozmiary, cenaIdx, wyroznienie, fraza],
  );

  const toggleKat = (k: FiltrKategoria) => setKategoria((c) => (c === k ? "wszystkie" : k));
  const toggleWiek = (w: FiltrWiek) => setWiek((c) => (c === w ? "wszystkie" : w));
  const toggleRozmiar = (s: string) =>
    setRozmiary((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  const toggleWyroznienie = (w: FiltrWyroznienie) => setWyroznienie((c) => (c === w ? "wszystkie" : w));
  const reset = () => {
    setKategoria("wszystkie");
    setWiek("wszystkie");
    setRozmiary([]);
    setCenaIdx(null);
    setWyroznienie("wszystkie");
    setSortBy("domyslnie");
  };

  const aktywneFiltry =
    (kategoria !== "wszystkie" ? 1 : 0) +
    (wiek !== "wszystkie" ? 1 : 0) +
    rozmiary.length +
    (cenaIdx !== null ? 1 : 0) +
    (wyroznienie !== "wszystkie" ? 1 : 0);

  return (
    <div className="overflow-x-hidden">
      <Nawigacja aktywna="produkty" />

      <div className="mx-auto max-w-content px-6 pb-2 pt-11 md:px-12">
        <h1 className="mb-1.5 text-[32px] font-bold tracking-tight">
          {fraza ? <>Wyniki: „{fraza}"</> : KATEGORIE_LABEL[kategoria]}
        </h1>
        <p className={`text-[15px] text-ink-2 ${!fraza && OPISY_KATEGORII[kategoria] ? "mb-3" : "mb-7"}`}>
          {produkty.length} {produkty.length === 1 ? "produkt" : "produktów"}
        </p>
        {!fraza && OPISY_KATEGORII[kategoria] ? (
          <p className="mb-7 max-w-3xl text-[14.5px] leading-relaxed text-ink-2">{OPISY_KATEGORII[kategoria]}</p>
        ) : null}
      </div>

      {/* Pasek filtrów na mobile */}
      <div className="mx-auto mb-4 flex max-w-content items-center gap-3 px-6 md:hidden">
        <button
          onClick={() => setFiltryOtwarte((o) => !o)}
          className="flex items-center gap-2 rounded-lg border border-ink px-4 py-2.5 text-[13px] font-semibold text-ink"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
          Filtry{aktywneFiltry > 0 ? ` (${aktywneFiltry})` : ""}
          <span className="text-ink-2">{filtryOtwarte ? "▲" : "▼"}</span>
        </button>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as Sortowanie)}
          className="flex-1 rounded-lg border border-linia-2 bg-white px-3 py-2.5 text-[13px] text-ink"
        >
          <option value="domyslnie">Polecane</option>
          <option value="cena-rosnaco">Cena: od najniższej</option>
          <option value="cena-malejaco">Cena: od najwyższej</option>
        </select>
      </div>

      <div className="mx-auto grid max-w-content grid-cols-1 gap-8 px-6 pb-24 md:grid-cols-[240px_1fr] md:gap-11 md:px-12">
        {/* Filtry */}
        <aside className={`${filtryOtwarte ? "flex" : "hidden"} flex-col gap-8 md:flex`}>
          <div>
            <h3 className="mb-4 text-[13px] font-semibold tracking-wide text-ink-2">KATEGORIA</h3>
            <div className="flex flex-col gap-3">
              {KATEGORIE.filter((c) => c.key !== "wszystkie").map((c) => {
                const on = kategoria === c.key;
                return (
                  <button key={c.key} onClick={() => toggleKat(c.key)} className="flex items-center gap-2.5 text-left">
                    <span
                      className="h-3.5 w-3.5 shrink-0 border-[1.5px]"
                      style={{ borderColor: on ? "var(--ink)" : "oklch(80% 0.005 90)", background: on ? "var(--ink)" : "transparent" }}
                    />
                    <span className={`text-sm ${on ? "font-bold text-ink" : "font-medium text-ink-2"}`}>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-[13px] font-semibold tracking-wide text-ink-2">WIEK</h3>
            <div className="flex flex-col gap-3">
              {WIEKI.map((a) => {
                const on = wiek === a.key;
                return (
                  <button key={a.key} onClick={() => toggleWiek(a.key)} className="flex items-center gap-2.5 text-left">
                    <span
                      className="h-3.5 w-3.5 shrink-0 rounded-full border-[1.5px]"
                      style={{ borderColor: on ? "var(--ink)" : "oklch(80% 0.005 90)", background: on ? "var(--ink)" : "transparent" }}
                    />
                    <span className={`text-sm ${on ? "font-bold text-ink" : "font-medium text-ink-2"}`}>{a.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-[13px] font-semibold tracking-wide text-ink-2">CENA</h3>
            <div className="flex flex-col gap-3">
              {ZAKRESY_CENY.map((z, i) => {
                const on = cenaIdx === i;
                return (
                  <button
                    key={z.label}
                    onClick={() => setCenaIdx((c) => (c === i ? null : i))}
                    className="flex items-center gap-2.5 text-left"
                  >
                    <span
                      className="h-3.5 w-3.5 shrink-0 rounded-full border-[1.5px]"
                      style={{ borderColor: on ? "var(--ink)" : "oklch(80% 0.005 90)", background: on ? "var(--ink)" : "transparent" }}
                    />
                    <span className={`text-sm ${on ? "font-bold text-ink" : "font-medium text-ink-2"}`}>{z.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-[13px] font-semibold tracking-wide text-ink-2">WYRÓŻNIENIE</h3>
            <div className="flex flex-col gap-3">
              {WYROZNIENIA.map((w) => {
                const on = wyroznienie === w.key;
                return (
                  <button key={w.key} onClick={() => toggleWyroznienie(w.key)} className="flex items-center gap-2.5 text-left">
                    <span
                      className="h-3.5 w-3.5 shrink-0 border-[1.5px]"
                      style={{ borderColor: on ? "var(--ink)" : "oklch(80% 0.005 90)", background: on ? "var(--ink)" : "transparent" }}
                    />
                    <span className={`text-sm ${on ? "font-bold text-ink" : "font-medium text-ink-2"}`}>{w.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-[13px] font-semibold tracking-wide text-ink-2">ROZMIAR</h3>
            <div className="flex flex-wrap gap-2">
              {DOSTEPNE_ROZMIARY.map((s) => {
                const on = rozmiary.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => toggleRozmiar(s)}
                    className={`rounded-lg border px-[11px] py-1.5 text-[12.5px] font-medium transition-colors ${
                      on ? "border-ink bg-ink text-tlo" : "border-linia-2 text-ink hover:border-ink"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {aktywneFiltry > 0 ? (
            <button onClick={reset} className="self-start text-[13.5px] text-ink underline underline-offset-[3px]">
              Wyczyść filtry ({aktywneFiltry})
            </button>
          ) : null}

          {/* Zamknięcie filtrów na mobile */}
          <button
            onClick={() => setFiltryOtwarte(false)}
            className="mt-2 w-full rounded-lg bg-ink px-6 py-3.5 text-[13px] font-semibold tracking-wide text-tlo md:hidden"
          >
            POKAŻ {produkty.length} {produkty.length === 1 ? "PRODUKT" : "PRODUKTÓW"}
          </button>
        </aside>

        {/* Grid produktów */}
        <div>
          <div className="mb-6 hidden justify-end md:flex">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as Sortowanie)}
              className="rounded-lg border border-linia-2 bg-white px-3.5 py-2.5 text-[13.5px] text-ink"
            >
              <option value="domyslnie">Sortuj: polecane</option>
              <option value="cena-rosnaco">Cena: od najniższej</option>
              <option value="cena-malejaco">Cena: od najwyższej</option>
            </select>
          </div>

          {produkty.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-3">
              {produkty.map((p) => (
                <KartaProduktu key={p.id} produkt={p} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-ink-2">
              <p className="mb-2 text-[17px] font-semibold">
                {fraza ? <>Brak wyników dla „{fraza}"</> : "Brak produktów dla tych filtrów"}
              </p>
              <p className="text-sm">
                {fraza
                  ? "Spróbuj prostszego słowa lub przejrzyj wszystkie produkty."
                  : "Spróbuj poluzować lub wyczyścić filtry powyżej."}
              </p>
              {fraza ? (
                <a
                  href="/produkty"
                  className="mt-4 inline-block bg-ink px-6 py-3 text-[13px] font-semibold tracking-wide text-tlo no-underline transition-colors hover:bg-akcent"
                >
                  ZOBACZ WSZYSTKIE PRODUKTY
                </a>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <Stopka />
    </div>
  );
}

export default function ListingProduktow() {
  return (
    <Suspense fallback={<div className="p-12 text-ink-2">Ładowanie…</div>}>
      <Listing />
    </Suspense>
  );
}
