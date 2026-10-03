"use client";

import { zdjecie, zestawZdjec } from "@/lib/zdjecia";
import Link from "next/link";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { KATEGORIE_LABEL, PRODUKTY, type Kategoria, type Produkt } from "@/data/produkty";
import { KOLEKCJE, produktyKolekcji } from "@/data/kolekcje";
import { formatCena, normalizujTekst, pasujeTekst, slowaFrazy, trafnoscFrazy, wyszukaj } from "@/lib/filtrowanie";
import { zwinWarianty } from "@/lib/warianty";
import { pobierzKatalog } from "@/lib/katalogKlient";

// Katalog do podpowiedzi — współdzielony między instancjami (nagłówek komputer + telefon).
let KATALOG_CACHE: Produkt[] | null = null;
const KLUCZ_HISTORII = "bobas-szukane";

// Popularne frazy pokazywane w pustym polu.
const POPULARNE: { label: string; fraza?: string; href?: string }[] = [
  { label: "Body", fraza: "body" },
  { label: "Komplety niemowlęce", href: "/kolekcje/komplety-niemowlece" },
  { label: "Legginsy", fraza: "legginsy" },
  { label: "Dres dla chłopca", fraza: "dres chłopiec" },
  { label: "Pajacyki", fraza: "pajacyk" },
  { label: "Bluzy męskie", href: "/produkty?kategoria=dorosli&szukaj=bluza" },
  { label: "Czapki", fraza: "czapka" },
  { label: "Do 20 zł", href: "/produkty?cena=do-20" },
];

type Pozycja = { klucz: string; href: string; fraza?: string };

function czytajHistorie(): string[] {
  try {
    const h = JSON.parse(localStorage.getItem(KLUCZ_HISTORII) ?? "[]");
    return Array.isArray(h) ? h.filter((x) => typeof x === "string").slice(0, 6) : [];
  } catch {
    return [];
  }
}
function zapiszHistorie(h: string[]) {
  try {
    localStorage.setItem(KLUCZ_HISTORII, JSON.stringify(h.slice(0, 6)));
  } catch {}
}

// Pogrubia fragmenty słów, które zaczynają się od wpisanych liter (jak w Zalando).
function Podswietl({ tekst, fraza }: { tekst: string; fraza: string }) {
  const slowa = slowaFrazy(fraza);
  if (!slowa.length) return <>{tekst}</>;
  return (
    <>
      {tekst.split(/(\s+)/).map((w, i) => {
        const n = normalizujTekst(w);
        const dl = Math.max(0, ...slowa.filter((s) => n.startsWith(s)).map((s) => s.length));
        return dl ? (
          <Fragment key={i}>
            <b className="font-extrabold">{w.slice(0, dl)}</b>
            {w.slice(dl)}
          </Fragment>
        ) : (
          <Fragment key={i}>{w}</Fragment>
        );
      })}
    </>
  );
}

const NIE_DOPOWIADAJ = new Set([
  "i", "z", "ze", "w", "na", "do", "dla", "oraz", "body", "bluza", "bluzka", "spodnie", "legginsy", "czapka", "komplet",
  "dres", "pajac", "pajacyk", "sukienka", "kamizelka", "sweter", "sweterek", "koszulka", "polspiochy", "skarpetki",
  "rekawiczki", "sliniak", "kaftanik", "getry", "spodenki", "kurtka", "szorty",
]);

// Dopowiedzenia frazy z nazw pasujących produktów: „leg" → „legginsy prążkowane", „legginsy czarne"…
function dopowiedzenia(lista: Produkt[], fraza: string): string[] {
  const slowa = slowaFrazy(fraza);
  if (!slowa.length) return [];
  const licznik = new Map<string, number>();
  for (const p of lista) {
    const wyrazy = p.nazwa.toLowerCase().split(/\s+/).filter(Boolean);
    const i = wyrazy.findIndex((w) => normalizujTekst(w).startsWith(slowa[0]));
    if (i === -1) continue;
    const dodaj = (fr: string) => {
      fr = fr.replace(/[^\p{L}\p{N}\s-]/gu, "").trim();
      if (fr.length > 2) licznik.set(fr, (licznik.get(fr) ?? 0) + 1);
    };
    dodaj(wyrazy[i]);
    // Dwa słowa tylko, gdy nazwa zaczyna się od szukanej rzeczy, a drugie słowo ją opisuje
    // („legginsy prążkowane"), a nie jest kolejną rzeczą z kompletu („bluza spodnie").
    const drugie = wyrazy[i + 1];
    if (i === 0 && drugie && !NIE_DOPOWIADAJ.has(normalizujTekst(drugie))) dodaj(`${wyrazy[i]} ${drugie}`);
  }
  const q = normalizujTekst(fraza.trim());
  return [...licznik.entries()]
    .filter(([f, n]) => n >= 2 && normalizujTekst(f) !== q && slowa.every((s) => normalizujTekst(f).includes(s) || s === slowa[0]))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([f]) => f);
}

function produktow(n: number) {
  if (n === 1) return "1 produkt";
  const r10 = n % 10, r100 = n % 100;
  return `${n} ${r10 >= 2 && r10 <= 4 && !(r100 >= 12 && r100 <= 14) ? "produkty" : "produktów"}`;
}

export function Szukajka({ mobilna = false }: { mobilna?: boolean }) {
  const router = useRouter();
  const sciezka = usePathname();
  const [q, setQ] = useState("");
  const [otwarte, setOtwarte] = useState(false);
  const [aktywny, setAktywny] = useState(-1);
  const [historia, setHistoria] = useState<string[]>([]);
  const [katalog, setKatalog] = useState<Produkt[]>(KATALOG_CACHE ?? PRODUKTY);
  const pole = useRef<HTMLInputElement>(null);
  const kontener = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHistoria(czytajHistorie());
    if (KATALOG_CACHE) return;
    pobierzKatalog().then((k) => {
      if (k) {
        KATALOG_CACHE = k;
        setKatalog(k);
      }
    });
  }, []);

  // W polu zostaje to, czego szukano (na stronie wyników); po przejściu gdzie indziej — czyste.
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("szukaj");
    setQ(sciezka === "/produkty" && s ? s : "");
    setOtwarte(false);
  }, [sciezka]);

  // Zamknij po kliknięciu poza wyszukiwarką (komputer).
  useEffect(() => {
    if (!otwarte || mobilna) return;
    const klik = (e: MouseEvent) => {
      if (kontener.current && !kontener.current.contains(e.target as Node)) setOtwarte(false);
    };
    document.addEventListener("mousedown", klik);
    return () => document.removeEventListener("mousedown", klik);
  }, [otwarte, mobilna]);

  // Telefon: wyszukiwarka na cały ekran — strona pod spodem stoi.
  useEffect(() => {
    if (!(otwarte && mobilna)) return;
    const poprzedni = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = poprzedni;
    };
  }, [otwarte, mobilna]);

  const fraza = q.trim();
  const wynik = useMemo(() => {
    if (!fraza) return null;
    const { lista, zOpisu } = wyszukaj(katalog, fraza);
    const posortowane = [...lista].sort((a, b) => trafnoscFrazy(b, fraza) - trafnoscFrazy(a, fraza));
    const modele = zwinWarianty(posortowane);
    const dzialy = (Object.keys(KATEGORIE_LABEL) as Kategoria[])
      .map((k) => ({ k, n: zwinWarianty(lista.filter((p) => p.kategoria === k)).length }))
      .filter((d) => d.n > 0)
      .sort((a, b) => b.n - a.n);
    const kolekcje = KOLEKCJE.filter((k) => pasujeTekst(`${k.h1} ${k.klucze.join(" ")}`, fraza))
      .map((k) => {
        const lista = produktyKolekcji(katalog, k);
        return { k, n: zwinWarianty(lista).length, ids: lista.map((p) => p.id).sort().join() };
      })
      .filter((x, i, all) => x.n > 0 && all.findIndex((y) => y.ids === x.ids) === i) // ten sam zestaw produktów = jeden dział
      .slice(0, 3);
    return {
      liczba: modele.length,
      zOpisu,
      produkty: modele.slice(0, 6).map((m) => m.produkt),
      frazy: zOpisu ? [] : dopowiedzenia(posortowane, fraza),
      dzialy: dzialy.length > 1 ? dzialy.slice(0, 4) : [],
      kolekcje,
    };
  }, [fraza, katalog]);

  // Płaska lista pozycji do nawigacji strzałkami.
  const pozycje: Pozycja[] = useMemo(() => {
    if (!wynik) return historia.map((h) => ({ klucz: `h:${h}`, href: `/produkty?szukaj=${encodeURIComponent(h)}`, fraza: h }));
    return [
      ...wynik.frazy.map((f) => ({ klucz: `f:${f}`, href: `/produkty?szukaj=${encodeURIComponent(f)}`, fraza: f })),
      ...wynik.kolekcje.map(({ k }) => ({ klucz: `k:${k.slug}`, href: `/kolekcje/${k.slug}` })),
      ...wynik.dzialy.map(({ k }) => ({
        klucz: `d:${k}`,
        href: `/produkty?szukaj=${encodeURIComponent(fraza)}&kategoria=${k}`,
        fraza,
      })),
      ...wynik.produkty.map((p) => ({ klucz: `p:${p.id}`, href: `/produkty/${p.id}` })),
    ];
  }, [wynik, historia, fraza]);
  const indeks = (klucz: string) => pozycje.findIndex((p) => p.klucz === klucz);

  useEffect(() => setAktywny(-1), [fraza]);

  function zapamietaj(s: string) {
    const h = [s, ...czytajHistorie().filter((x) => normalizujTekst(x) !== normalizujTekst(s))];
    zapiszHistorie(h);
    setHistoria(h.slice(0, 6));
  }

  function zamknij() {
    setOtwarte(false);
    pole.current?.blur();
  }

  function idz(href: string, zapamietanaFraza?: string) {
    if (zapamietanaFraza) {
      zapamietaj(zapamietanaFraza);
      setQ(zapamietanaFraza);
    }
    zamknij();
    router.push(href);
  }

  function szukaj(v: string) {
    const s = v.trim();
    if (!s) return idz("/produkty");
    idz(`/produkty?szukaj=${encodeURIComponent(s)}`, s);
  }

  function klawisz(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!pozycje.length) return;
      setOtwarte(true);
      setAktywny((a) => {
        const n = pozycje.length;
        return e.key === "ArrowDown" ? (a + 1) % n : (a - 1 + n) % n;
      });
    } else if (e.key === "Escape") {
      zamknij();
    } else if (e.key === "Enter" && aktywny >= 0 && pozycje[aktywny]) {
      e.preventDefault();
      idz(pozycje[aktywny].href, pozycje[aktywny].fraza);
    }
  }

  const pelnyEkran = mobilna && otwarte;
  const klasaPozycji = (klucz: string) =>
    `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[14.5px] text-ink no-underline transition-colors ${
      indeks(klucz) === aktywny ? "bg-akcent-2" : "hover:bg-szary"
    }`;

  const panel = (
    <div
      className={
        pelnyEkran
          ? "flex-1 overflow-y-auto overscroll-contain px-2 pb-8 pt-2"
          : "absolute left-0 top-full z-[60] mt-2 w-full min-w-[620px] overflow-hidden rounded-xl border border-linia bg-white shadow-[0_24px_60px_-24px_rgba(0,0,0,0.4)]"
      }
      onMouseDown={(e) => {
        // Klik w panel nie zabiera fokusu z pola (komputer).
        if (!mobilna && (e.target as HTMLElement).tagName !== "INPUT") e.preventDefault();
      }}
    >
      {!wynik ? (
        // 1) Puste pole: ostatnio szukane + popularne
        <div className={pelnyEkran ? "" : "p-3"}>
          {historia.length ? (
            <div className="mb-3">
              <div className="flex items-center justify-between px-3 pb-1 pt-1">
                <p className="text-[13px] font-bold text-ink-2">Ostatnio szukane</p>
                <button
                  onClick={() => {
                    zapiszHistorie([]);
                    setHistoria([]);
                  }}
                  className="text-[13px] font-semibold text-akcent"
                >
                  Wyczyść
                </button>
              </div>
              {historia.map((h) => (
                <button key={h} onClick={() => idz(`/produkty?szukaj=${encodeURIComponent(h)}`, h)} className={klasaPozycji(`h:${h}`)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0 text-ink-2">
                    <circle cx="12" cy="12" r="8.5" />
                    <path d="M12 7.5V12l3 2" />
                  </svg>
                  <span className="truncate">{h}</span>
                </button>
              ))}
            </div>
          ) : null}
          <p className="px-3 pb-2 pt-1 text-[13px] font-bold text-ink-2">Popularne</p>
          <div className="flex flex-wrap gap-2 px-3 pb-2">
            {POPULARNE.map((s) => (
              <button
                key={s.label}
                onClick={() => (s.href ? idz(s.href) : szukaj(s.fraza ?? ""))}
                className="rounded-full border border-linia-2 bg-white px-3.5 py-2 text-[13.5px] font-semibold text-ink transition-colors hover:border-ink"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      ) : wynik.liczba === 0 ? (
        // 2) Brak wyników
        <div className="px-4 py-5">
          <p className="text-[15px] font-bold text-ink">Nic nie znaleźliśmy dla „{fraza}"</p>
          <p className="mt-1 text-[13.5px] text-ink-2">Sprawdź pisownię albo wybierz coś z popularnych:</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {POPULARNE.map((s) => (
              <button
                key={s.label}
                onClick={() => (s.href ? idz(s.href) : szukaj(s.fraza ?? ""))}
                className="rounded-full border border-linia-2 bg-white px-3.5 py-2 text-[13.5px] font-semibold text-ink hover:border-ink"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        // 3) Podpowiedzi + produkty
        <div className={pelnyEkran ? "flex flex-col" : "grid grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"}>
          <div className={pelnyEkran ? "pb-2" : "border-r border-linia p-2"}>
            {wynik.frazy.map((f) => (
              <button key={f} onClick={() => idz(`/produkty?szukaj=${encodeURIComponent(f)}`, f)} className={klasaPozycji(`f:${f}`)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0 text-ink-2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.2-3.2" />
                </svg>
                <span className="truncate">
                  <Podswietl tekst={f} fraza={fraza} />
                </span>
              </button>
            ))}
            {wynik.kolekcje.map(({ k, n }) => (
              <button key={k.slug} onClick={() => idz(`/kolekcje/${k.slug}`)} className={klasaPozycji(`k:${k.slug}`)}>
                <span className="flex h-6 shrink-0 items-center rounded-md bg-akcent-2 px-1.5 text-[11px] font-extrabold text-akcent">Dział</span>
                <span className="min-w-0 flex-1 truncate">
                  <Podswietl tekst={k.h1} fraza={fraza} />
                </span>
                <span className="shrink-0 text-[12.5px] text-ink-2">{n}</span>
              </button>
            ))}
            {wynik.dzialy.length ? (
              <>
                <p className="px-3 pb-1 pt-3 text-[12.5px] font-bold text-ink-2">„{fraza}" w dziale</p>
                {wynik.dzialy.map(({ k, n }) => (
                  <button
                    key={k}
                    onClick={() => idz(`/produkty?szukaj=${encodeURIComponent(fraza)}&kategoria=${k}`, fraza)}
                    className={klasaPozycji(`d:${k}`)}
                  >
                    <span className="min-w-0 flex-1 truncate font-semibold">{KATEGORIE_LABEL[k]}</span>
                    <span className="shrink-0 text-[12.5px] text-ink-2">{n}</span>
                  </button>
                ))}
              </>
            ) : null}
            {wynik.zOpisu ? (
              <p className="px-3 py-2 text-[12.5px] leading-snug text-ink-2">
                Nie ma „{fraza}" w nazwach produktów — pokazujemy te, w których opisie pada to słowo.
              </p>
            ) : null}
          </div>

          <div className={pelnyEkran ? "border-t border-linia pt-2" : "p-3"}>
            <p className="px-1 pb-2 text-[12.5px] font-bold text-ink-2">Produkty</p>
            <div className={pelnyEkran ? "flex flex-col" : "grid grid-cols-3 gap-2.5"}>
              {wynik.produkty.map((p) => (
                <Link
                  key={p.id}
                  href={`/produkty/${p.id}`}
                  onClick={() => {
                    zapamietaj(fraza);
                    zamknij();
                  }}
                  className={
                    pelnyEkran
                      ? `flex items-center gap-3 rounded-lg px-2 py-2 text-inherit no-underline ${indeks(`p:${p.id}`) === aktywny ? "bg-akcent-2" : ""}`
                      : `group flex flex-col rounded-lg p-1.5 text-inherit no-underline transition-colors ${
                          indeks(`p:${p.id}`) === aktywny ? "bg-akcent-2" : "hover:bg-szary"
                        }`
                  }
                >
                  <span
                    className={`flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-linia bg-white ${
                      pelnyEkran ? "h-14 w-14" : "mb-1.5 aspect-square w-full"
                    }`}
                  >
                    {p.zdjecie ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={zdjecie(p.zdjecie, "s128")} alt="" className="h-full w-full object-contain p-1" loading="lazy" />
                    ) : null}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14px] font-extrabold text-ink">{formatCena(p.cena)} zł</span>
                    <span className={`block text-[12.5px] leading-snug text-ink ${pelnyEkran ? "truncate" : "line-clamp-2"}`}>{p.nazwa}</span>
                  </span>
                </Link>
              ))}
            </div>
            <button
              onClick={() => szukaj(fraza)}
              className="mt-2 w-full rounded-lg bg-ink px-4 py-3 text-[14px] font-bold text-white transition-colors hover:bg-akcent"
            >
              Pokaż {produktow(wynik.liczba)}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div ref={kontener} className={pelnyEkran ? "fixed inset-0 z-[90] flex flex-col bg-white" : "relative w-full"}>
      <div className={pelnyEkran ? "flex items-center gap-1 border-b border-linia px-2 py-2" : ""}>
        {pelnyEkran ? (
          <button onClick={zamknij} aria-label="Zamknij wyszukiwanie" className="flex h-11 w-10 shrink-0 items-center justify-center text-ink">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
        ) : null}
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            if (aktywny >= 0 && pozycje[aktywny]) idz(pozycje[aktywny].href, pozycje[aktywny].fraza);
            else szukaj(q);
          }}
          className={`flex min-w-0 flex-1 items-center overflow-hidden rounded-lg border-2 bg-white transition-colors ${
            otwarte ? "border-akcent" : "border-ink"
          }`}
        >
          <input
            ref={pole}
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOtwarte(true);
            }}
            onFocus={() => setOtwarte(true)}
            onKeyDown={klawisz}
            placeholder={mobilna ? "Czego szukasz?" : "Czego szukasz? np. body 68, dres chłopięcy, legginsy"}
            aria-label="Szukaj produktów"
            aria-expanded={otwarte}
            aria-autocomplete="list"
            autoComplete="off"
            enterKeyHint="search"
            className="w-full min-w-0 bg-transparent px-3.5 py-2.5 text-[16px] outline-none placeholder:text-ink-2 md:text-[14px] [&::-webkit-search-cancel-button]:hidden"
          />
          {q ? (
            <button
              type="button"
              aria-label="Wyczyść"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setQ("");
                pole.current?.focus();
              }}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-szary hover:text-ink"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            </button>
          ) : null}
          <button
            type="submit"
            aria-label="Szukaj"
            className="flex items-center gap-2 self-stretch bg-ink px-4 text-[14px] font-bold text-white transition-colors hover:bg-akcent md:px-5"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.2-3.2" />
            </svg>
            {mobilna ? null : <span className="hidden md:inline">Szukaj</span>}
          </button>
        </form>
      </div>

      {otwarte ? panel : null}
    </div>
  );
}
