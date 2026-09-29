"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Nawigacja } from "@/components/Nawigacja";
import { KartaProduktu } from "@/components/KartaProduktu";
import { Stopka } from "@/components/Stopka";
import { KATEGORIE_LABEL, PRODUKTY, type Produkt } from "@/data/produkty";
import {
  filtrujProdukty,
  wyszukaj,
  ZAKRESY_CENY,
  type FiltrKategoria,
  type FiltrWiek,
  type FiltrWyroznienie,
  type Sortowanie,
} from "@/lib/filtrowanie";
import { porownajRozmiary } from "@/lib/rozmiary";
import { zwinWarianty } from "@/lib/warianty";
import { pobierzKatalog } from "@/lib/katalogKlient";

const KATEGORIE: { key: FiltrKategoria; label: string }[] = [
  { key: "wszystkie", label: "Wszystkie" },
  { key: "dziewczynki", label: "Dziewczynki" },
  { key: "chlopcy", label: "Chłopcy" },
  { key: "niemowleta", label: "Niemowlęta" },
  { key: "dorosli", label: "Męskie" },
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
    "Ubranka dla dzieci 0–12 lat — od body i pajacyków dla niemowląt po dresy, bluzy i legginsy dla starszaków — oraz odzież męska. Przy każdym rozmiarze wymiary w centymetrach. Darmowa dostawa od 150 zł, 14 dni na zwrot.",
  dziewczynki:
    "Ubranka dla dziewczynek 0–12 lat: sukienki, legginsy, bluzy, komplety i body. Miękkie tkaniny i wygodne fasony — na przedszkole, spacer i wyjątkowe okazje.",
  chlopcy:
    "Ubranka dla chłopców 0–12 lat: dresy, spodnie, bluzy, komplety i koszulki. Wytrzymałe i wygodne, gotowe na przedszkole, plac zabaw i każdą przygodę.",
  niemowleta:
    "Ubranka dla niemowląt i noworodków: body, pajacyki, śpiochy, komplety i czapeczki. Delikatna bawełna, zatrzaski ułatwiające przewijanie i płaskie szwy przyjazne skórze malucha.",
  dorosli:
    "Odzież męska — bluzy, dresy, spodnie i koszulki w wygodnych fasonach. Rozmiary od S do 6XL. Ta sama niska cena co w reszcie sklepu.",
};

// „1 produkt", „3 produkty", „232 produkty", „12 produktów".
function produktow(n: number): string {
  if (n === 1) return "1 produkt";
  const r10 = n % 10, r100 = n % 100;
  return `${n} ${r10 >= 2 && r10 <= 4 && !(r100 >= 12 && r100 <= 14) ? "produkty" : "produktów"}`;
}

const POPULARNE = ["body", "komplet", "legginsy", "dres", "pajacyk", "bluza", "czapka"];

function Listing() {
  const params = useSearchParams();

  // Katalog z kodu + produkty dodane w panelu (localStorage).
  const [wszystkie, setWszystkie] = useState<Produkt[]>(PRODUKTY);
  useEffect(() => {
    pobierzKatalog().then((k) => {
      if (k) {
        setWszystkie(k);
      }
    });
  }, []);
  const DOSTEPNE_ROZMIARY = useMemo(
    () => Array.from(new Set(wszystkie.flatMap((p) => p.rozmiary ?? []))).sort(porownajRozmiary),
    [wszystkie],
  );

  const fraza = params.get("szukaj") ?? "";
  const grupa = params.get("grupa"); // "dzieci" → tylko asortyment dziecięcy (bez dorosłych)
  const tylkoDzieci = grupa === "dzieci";
  const startKat = params.get("kategoria");
  const poczatkowa: FiltrKategoria =
    startKat && startKat !== "wyprzedaz" && startKat in KATEGORIE_LABEL
      ? (startKat as FiltrKategoria)
      : "wszystkie";

  // Baza katalogu z uwzględnieniem grupy (dzieci = bez dorosłych).
  const bazaKatalog = useMemo(
    () => (tylkoDzieci ? wszystkie.filter((p) => p.kategoria !== "dorosli") : wszystkie),
    [wszystkie, tylkoDzieci],
  );

  const [kategoria, setKategoria] = useState<FiltrKategoria>(poczatkowa);
  const [wiek, setWiek] = useState<FiltrWiek>("wszystkie");
  const [rozmiary, setRozmiary] = useState<string[]>([]);
  const startCena = ZAKRESY_CENY.findIndex((z) => z.slug === params.get("cena"));
  const [cenaIdx, setCenaIdx] = useState<number | null>(startCena >= 0 ? startCena : null);
  const [wyroznienie, setWyroznienie] = useState<FiltrWyroznienie>("wszystkie");
  const startSort = params.get("sort");
  const [sortBy, setSortBy] = useState<Sortowanie>(
    startSort === "nowosci" || startSort === "cena-rosnaco" || startSort === "cena-malejaco" ? startSort : "domyslnie",
  );
  const [filtryOtwarte, setFiltryOtwarte] = useState(false);

  // Nowe wyszukiwanie / klik w zakładkę na tej samej stronie → filtry z adresu.
  const adres = params.toString();
  useEffect(() => {
    setKategoria(poczatkowa);
    const c = ZAKRESY_CENY.findIndex((z) => z.slug === params.get("cena"));
    setCenaIdx(c >= 0 ? c : null);
    const so = params.get("sort");
    setSortBy(so === "nowosci" || so === "cena-rosnaco" || so === "cena-malejaco" ? so : "domyslnie");
    setWiek("wszystkie");
    setRozmiary([]);
    setWyroznienie("wszystkie");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adres]);

  // Wyszukiwanie: ile modeli w każdym dziale (chipsy nad listą) i czy trafienia są tylko z opisów.
  const szukanie = useMemo(() => {
    if (!fraza.trim()) return null;
    const { lista, zOpisu } = wyszukaj(bazaKatalog, fraza);
    const dzialy = KATEGORIE.filter((c) => c.key !== "wszystkie")
      .map((c) => ({ ...c, n: zwinWarianty(lista.filter((p) => p.kategoria === c.key)).length }))
      .filter((c) => c.n > 0);
    return { zOpisu, dzialy, razem: zwinWarianty(lista).length };
  }, [bazaKatalog, fraza]);
  // Panel filtrów na telefonie zajmuje cały ekran — strona pod nim się nie przewija.
  useEffect(() => {
    if (!filtryOtwarte) return;
    const poprzedni = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = poprzedni;
    };
  }, [filtryOtwarte]);

  const produkty = useMemo(
    () =>
      filtrujProdukty(bazaKatalog, {
        kategoria,
        wiek,
        sortBy,
        rozmiary,
        cena: cenaIdx !== null ? ZAKRESY_CENY[cenaIdx] : null,
        wyroznienie,
        fraza,
      }),
    [bazaKatalog, kategoria, wiek, sortBy, rozmiary, cenaIdx, wyroznienie, fraza],
  );

  // Zwiń warianty kolorystyczne (po opisie) — jeden kafel na model.
  const zwiniete = useMemo(() => zwinWarianty(produkty), [produkty]);

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
    <div className="overflow-x-clip">
      <Nawigacja aktywna="produkty" />

      <div className="mx-auto max-w-content px-4 pb-1 pt-5 md:px-12 md:pb-2 md:pt-11">
        <h1 className="mb-1 text-[24px] font-extrabold leading-tight tracking-tight md:mb-1.5 md:text-[32px]">
          {fraza ? (
            <>„{fraza}"</>
          ) : kategoria === "wszystkie" && cenaIdx !== null ? (
            `Ceny ${ZAKRESY_CENY[cenaIdx].label}`
          ) : kategoria === "wszystkie" && sortBy === "nowosci" ? (
            "Nowości"
          ) : tylkoDzieci && kategoria === "wszystkie" ? (
            "Dla dzieci"
          ) : (
            KATEGORIE_LABEL[kategoria]
          )}
        </h1>
        <p className={`text-[14px] text-ink-2 md:text-[15px] ${!fraza && OPISY_KATEGORII[kategoria] ? "mb-2 md:mb-3" : "mb-4 md:mb-7"}`}>
          {produktow(zwiniete.length)}
        </p>
        {szukanie && szukanie.dzialy.length > 1 ? (
          <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:mb-6 md:flex-wrap md:px-0 [&::-webkit-scrollbar]:hidden">
            {[{ key: "wszystkie" as FiltrKategoria, label: "Wszystkie", n: szukanie.razem }, ...szukanie.dzialy].map((c) => {
              const on = kategoria === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => setKategoria(c.key)}
                  className={`shrink-0 rounded-full border px-3.5 py-2 text-[13.5px] font-semibold transition-colors ${
                    on ? "border-ink bg-ink text-white" : "border-linia-2 bg-white text-ink hover:border-ink"
                  }`}
                >
                  {c.label} <span className={on ? "text-white/70" : "text-ink-2"}>{c.n}</span>
                </button>
              );
            })}
          </div>
        ) : null}
        {szukanie?.zOpisu && zwiniete.length ? (
          <p className="mb-4 max-w-3xl rounded-lg bg-akcent-2 px-3.5 py-2.5 text-[13.5px] text-ink md:mb-6">
            Nie mamy produktu z „{fraza}" w nazwie — pokazujemy te, w których opisie pada to słowo.
          </p>
        ) : null}
        {!fraza && OPISY_KATEGORII[kategoria] ? (
          <p className="mb-4 line-clamp-2 max-w-3xl text-[13px] leading-relaxed text-ink-2 md:mb-7 md:line-clamp-none md:text-[14.5px]">{OPISY_KATEGORII[kategoria]}</p>
        ) : null}
      </div>

      {/* Pasek filtrów na mobile */}
      <div className="mx-auto mb-4 flex max-w-content items-center gap-2.5 px-4 md:hidden">
        <button
          onClick={() => setFiltryOtwarte((o) => !o)}
          className="flex items-center gap-2 rounded-lg border-2 border-ink bg-white px-4 py-2 text-[13.5px] font-bold text-ink"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
          Filtry{aktywneFiltry > 0 ? ` (${aktywneFiltry})` : ""}
        </button>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as Sortowanie)}
          className="min-w-0 flex-1 rounded-lg border border-linia-2 bg-white px-3 py-2.5 text-[13.5px] text-ink"
        >
          <option value="domyslnie">Polecane</option>
          <option value="nowosci">Najnowsze</option>
          <option value="cena-rosnaco">Cena: od najniższej</option>
          <option value="cena-malejaco">Cena: od najwyższej</option>
        </select>
      </div>

      <div className="mx-auto grid max-w-content grid-cols-1 gap-8 px-4 pb-16 md:grid-cols-[240px_1fr] md:gap-11 md:px-12 md:pb-24">
        {/* Filtry */}
        <aside
          className={`${
            filtryOtwarte ? "fixed inset-0 z-[80] flex overflow-y-auto overscroll-contain bg-white px-5 pb-28 pt-4" : "hidden"
          } flex-col gap-7 md:static md:z-auto md:flex md:gap-8 md:overflow-visible md:bg-transparent md:p-0`}
        >
          {/* Nagłówek panelu filtrów (telefon) */}
          <div className="-mx-5 -mt-4 flex items-center justify-between border-b border-linia px-5 py-3 md:hidden">
            <p className="text-[17px] font-extrabold">Filtry</p>
            <button onClick={() => setFiltryOtwarte(false)} aria-label="Zamknij filtry" className="-mr-2 flex h-10 w-10 items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          <div>
            <h3 className="mb-2.5 text-[15px] font-bold text-ink md:mb-3.5">Kategoria</h3>
            <div className="flex flex-col gap-1.5 md:gap-3">
              {KATEGORIE.filter((c) => c.key !== "wszystkie" && !(tylkoDzieci && c.key === "dorosli")).map((c) => {
                const on = kategoria === c.key;
                return (
                  <button key={c.key} onClick={() => toggleKat(c.key)} className="flex items-center gap-2.5 py-1 text-left md:py-0">
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
            <h3 className="mb-2.5 text-[15px] font-bold text-ink md:mb-3.5">Wiek</h3>
            <div className="flex flex-col gap-1.5 md:gap-3">
              {WIEKI.map((a) => {
                const on = wiek === a.key;
                return (
                  <button key={a.key} onClick={() => toggleWiek(a.key)} className="flex items-center gap-2.5 py-1 text-left md:py-0">
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
            <h3 className="mb-2.5 text-[15px] font-bold text-ink md:mb-3.5">Cena</h3>
            <div className="flex flex-col gap-1.5 md:gap-3">
              {ZAKRESY_CENY.map((z, i) => {
                const on = cenaIdx === i;
                return (
                  <button
                    key={z.label}
                    onClick={() => setCenaIdx((c) => (c === i ? null : i))}
                    className="flex items-center gap-2.5 py-1 text-left md:py-0"
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
            <h3 className="mb-2.5 text-[15px] font-bold text-ink md:mb-3.5">Wyróżnienie</h3>
            <div className="flex flex-col gap-1.5 md:gap-3">
              {WYROZNIENIA.map((w) => {
                const on = wyroznienie === w.key;
                return (
                  <button key={w.key} onClick={() => toggleWyroznienie(w.key)} className="flex items-center gap-2.5 py-1 text-left md:py-0">
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
            <h3 className="mb-2.5 text-[15px] font-bold text-ink md:mb-3.5">Rozmiar</h3>
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
          <div className="fixed inset-x-0 bottom-0 border-t border-linia bg-white p-4 md:hidden">
            <button
              onClick={() => {
                setFiltryOtwarte(false);
                window.scrollTo({ top: 0 });
              }}
              className="w-full rounded-lg bg-ink px-6 py-3.5 text-[14.5px] font-bold text-white"
            >
              Pokaż {produktow(zwiniete.length)}
            </button>
          </div>
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
              <option value="nowosci">Najnowsze</option>
              <option value="cena-rosnaco">Cena: od najniższej</option>
              <option value="cena-malejaco">Cena: od najwyższej</option>
            </select>
          </div>

          {zwiniete.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-2.5 gap-y-5 md:grid-cols-3 md:gap-x-6 md:gap-y-8">
              {zwiniete.map(({ produkt, kolory, cenaMin, cenyRozne }) => (
                <KartaProduktu key={produkt.id} produkt={produkt} liczbaKolorow={kolory} cenaOd={cenyRozne ? cenaMin : undefined} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-white px-5 py-12 text-center text-ink-2">
              <p className="mb-2 text-[18px] font-extrabold text-ink">
                {fraza ? <>Nic nie znaleźliśmy dla „{fraza}"</> : "Brak produktów dla tych filtrów"}
              </p>
              <p className="text-[14px]">
                {fraza
                  ? "Sprawdź pisownię albo spróbuj jednego słowa, np.:"
                  : "Spróbuj poluzować lub wyczyścić filtry."}
              </p>
              {fraza ? (
                <div className="mx-auto mt-4 flex max-w-md flex-wrap justify-center gap-2">
                  {POPULARNE.map((s) => (
                    <a
                      key={s}
                      href={`/produkty?szukaj=${s}`}
                      className="rounded-full border border-linia-2 bg-white px-3.5 py-2 text-[13.5px] font-semibold text-ink no-underline hover:border-ink"
                    >
                      {s}
                    </a>
                  ))}
                </div>
              ) : aktywneFiltry > 0 ? (
                <button onClick={reset} className="mt-4 rounded-lg border-2 border-ink px-5 py-2.5 text-[14px] font-bold text-ink">
                  Wyczyść filtry
                </button>
              ) : null}
              {fraza ? (
                <a
                  href="/produkty"
                  className="rounded-lg mt-4 inline-block bg-ink px-6 py-3 text-[14.5px] font-bold text-white no-underline transition-colors hover:bg-akcent"
                >
                  Zobacz wszystkie produkty
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
