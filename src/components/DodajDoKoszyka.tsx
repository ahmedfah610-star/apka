"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ZDARZENIE_ROZMIARU } from "@/components/OpisRozmiarowy";
import { useKoszyk } from "@/components/KoszykContext";
import { PowiadomODostepnosci } from "@/components/PowiadomODostepnosci";
import { TabelaRozmiarow } from "@/components/TabelaRozmiarow";
import { PrzyciskUlubione } from "@/components/PrzyciskUlubione";
import type { Produkt } from "@/data/produkty";
import { formatCena } from "@/lib/filtrowanie";
import { pomiarProduktu } from "@/lib/analityka";
import { licz } from "@/lib/licznikKlient";
import { kodAutomatyczny } from "@/lib/kodAutomatyczny";
import { PROMOCJE } from "@/lib/promocja";
import { useDostawa } from "@/lib/dostawaKlient";
import { kosztDostawy } from "@/lib/dostawa";
import { ZAMOWIENIA_WYLACZONE } from "@/lib/sklep";
import { useCenaZKodem } from "@/components/InfoPromocji";

// Okno „Kup teraz” ładowane dopiero po kliknięciu — strona produktu się nie wydłuża.
const KupTeraz = dynamic(() => import("@/components/KupTeraz").then((m) => m.KupTeraz), { ssr: false });

export const pozycjaPomiaru = (p: Produkt, ilosc = 1) => ({
  id: p.id,
  nazwa: p.nazwa,
  cena: p.cena,
  ilosc,
  kolor: p.kolor ?? null,
  kategoria: p.kategoria,
});

export function DodajDoKoszyka({ produkt, onZmianaRozmiaru }: { produkt: Produkt; onZmianaRozmiaru?: (rozmiar: string | undefined) => void }) {
  const { dodaj } = useKoszyk();
  const maRozmiary = !!produkt.rozmiary && produkt.rozmiary.length > 0;
  const sr = produkt.stanRozmiary ?? null;

  // Dostępność per rozmiar (gdy jest podział) — 0 = wyprzedany.
  const stanDla = (s: string): number | null => (sr ? sr[s] ?? 0 : null);

  // Produkt niedostępny, gdy: brak podziału i stan 0, albo podział i wszystkie rozmiary 0.
  const wszystkoZero = sr && maRozmiary ? produkt.rozmiary!.every((s) => (sr[s] ?? 0) === 0) : false;
  const niedostepny = produkt.stan === 0 || wszystkoZero;

  // Jedyny dostępny rozmiar wybieramy od razu — bez zbędnego klikania.
  const [rozmiar, setRozmiar] = useState<string | undefined>(() =>
    produkt.rozmiary?.length === 1 && (stanDla(produkt.rozmiary[0]) ?? 1) > 0 ? produkt.rozmiary[0] : undefined,
  );
  // Wybrany rozmiar dla reszty karty produktu (np. pytanie do sprzedawcy).
  useEffect(() => {
    onZmianaRozmiaru?.(rozmiar);
  }, [rozmiar]); // eslint-disable-line react-hooks/exhaustive-deps
  const [dodano, setDodano] = useState(false);
  const [blad, setBlad] = useState(false);
  const [kupTeraz, setKupTeraz] = useState(false);
  const zamknijKupTeraz = useCallback(() => setKupTeraz(false), []);

  // „z kodem i dostawą od …” — cena z kodem naliczanym automatycznie (jak w „Kup teraz”) + najtańsza
  // widoczna dostawa. Próg darmowej dostawy liczony od ceny przed rabatem — tak jak na serwerze.
  const ustawieniaDostawy = useDostawa();
  const zKodem = useCenaZKodem(produkt.cena);
  const zDostawaOd = useMemo(() => {
    const koszty = ustawieniaDostawy.metody.filter((m) => m.aktywna !== false).map((m) => kosztDostawy(m, produkt.cena, ustawieniaDostawy.darmowaOd));
    return koszty.length ? Math.round(((zKodem?.cena ?? produkt.cena) + Math.min(...koszty)) * 100) / 100 : null;
  }, [ustawieniaDostawy, produkt.cena, zKodem?.cena]);

  // Telefon: gdy główny przycisk jest poza ekranem, na dole wisi pasek z ceną i „Dodaj do koszyka".
  const przyciski = useRef<HTMLDivElement>(null);
  const sekcjaRozmiarow = useRef<HTMLDivElement>(null);
  const [pasekWidoczny, setPasekWidoczny] = useState(false);
  useEffect(() => {
    const el = przyciski.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(([w]) => setPasekWidoczny(!w.isIntersecting), { threshold: 0 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Dostępna ilość dla aktualnego wyboru.
  const dostepneTeraz = useMemo(() => {
    if (maRozmiary && rozmiar && sr) return sr[rozmiar] ?? 0;
    if (!maRozmiary && typeof produkt.stan === "number") return produkt.stan;
    return null;
  }, [maRozmiary, rozmiar, sr, produkt.stan]);

  const malyStan = typeof dostepneTeraz === "number" && dostepneTeraz > 0 && dostepneTeraz <= 5;

  function wymagajRozmiaru(): boolean {
    if (maRozmiary && !rozmiar) {
      setBlad(true);
      sekcjaRozmiarow.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    return !(typeof dostepneTeraz === "number" && dostepneTeraz <= 0);
  }

  function handleKupTeraz() {
    if (!wymagajRozmiaru()) return;
    setBlad(false);
    licz(produkt.id, "k");
    setKupTeraz(true);
  }

  function handleDodaj() {
    if (!wymagajRozmiaru()) return;
    dodaj(produkt.id, rozmiar, 1);
    pomiarProduktu("add_to_cart", { ...pozycjaPomiaru(produkt), rozmiar });
    licz(produkt.id, "k");
    setDodano(true);
    setBlad(false);
    setTimeout(() => setDodano(false), 2500);
  }

  if (niedostepny) {
    return (
      <div>
        <button disabled className="mb-4 w-full cursor-not-allowed rounded-xl bg-szary px-8 py-4 text-[14px] font-bold text-ink-2 sm:w-auto sm:min-w-[280px]">
          Produkt niedostępny
        </button>
        <PowiadomODostepnosci produktId={produkt.id} rozmiar={null} />
      </div>
    );
  }

  // Wybrany rozmiar wyprzedany (0 szt.) — pokaż formularz powiadomienia zamiast koszyka.
  const wybranyWyprzedany = maRozmiary && rozmiar != null && sr != null && (sr[rozmiar] ?? 0) <= 0;

  return (
    <div>
      {malyStan ? (
        <p className="mb-3 text-[13px] font-medium text-akcent">
          {rozmiar ? `Rozmiar ${rozmiar}: zostały ${dostepneTeraz} szt.!` : `Zostały już tylko ${dostepneTeraz} szt.!`}
        </p>
      ) : null}
      {maRozmiary ? (
        <div ref={sekcjaRozmiarow} className="mb-6 scroll-mt-40 md:mb-7">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className={`text-[14px] font-bold ${blad ? "text-cena" : "text-ink"}`}>
              {blad ? "Najpierw wybierz rozmiar" : "Rozmiar"}
            </h3>
            <TabelaRozmiarow />
          </div>
          <div className="flex flex-wrap gap-2">
            {produkt.rozmiary!.map((s) => {
              const on = rozmiar === s;
              const st = stanDla(s);
              const brak = st !== null && st <= 0;
              return (
                <button
                  key={s}
                  title={brak ? "Wyprzedany — powiadomimy o dostępności" : st !== null ? `${st} szt.` : undefined}
                  onClick={() => {
                    setRozmiar(s);
                    setBlad(false);
                    // Opis produktu pokazuje wymiary wybranego rozmiaru.
                    window.dispatchEvent(new CustomEvent(ZDARZENIE_ROZMIARU, { detail: { rozmiar: s } }));
                  }}
                  className={`relative min-w-[52px] rounded-lg border px-3.5 py-2.5 text-center text-[14px] font-bold transition-colors ${
                    brak
                      ? on
                        ? "border-ink bg-szary text-ink-2 line-through"
                        : "border-linia bg-szary/50 text-ink-2 line-through hover:border-ink-2"
                      : on
                        ? "border-ink bg-ink text-tlo"
                        : `${blad ? "border-cena" : "border-linia-2"} bg-white hover:border-ink`
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
          {rozmiar && typeof dostepneTeraz === "number" ? (
            <p className="mt-2.5 text-[12.5px] text-ink-2">
              {dostepneTeraz > 0 ? `Rozmiar ${rozmiar} — na stanie: ${dostepneTeraz} szt.` : `Rozmiar ${rozmiar} — wyprzedany`}
            </p>
          ) : null}
        </div>
      ) : null}

      <div ref={przyciski}>
      {wybranyWyprzedany ? (
        <PowiadomODostepnosci key={rozmiar} produktId={produkt.id} rozmiar={rozmiar} />
      ) : (
        <div className="mb-3 flex flex-col gap-2.5 sm:max-w-[460px]">
          {ZAMOWIENIA_WYLACZONE ? null : (
            <button
              type="button"
              onClick={handleKupTeraz}
              className="rounded-xl bg-ink px-6 py-3 text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-akcent hover:shadow-lg"
            >
              <span className="block text-[16px] font-extrabold">Kup teraz</span>
              {zDostawaOd !== null ? (
                <span className="block text-[12.5px] font-semibold opacity-80">
                  {zKodem ? `z kodem ${zKodem.kod} i dostawą od` : "z dostawą od"} {formatCena(zDostawaOd)} zł · BLIK
                </span>
              ) : null}
            </button>
          )}
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={handleDodaj}
              className={`flex-1 rounded-xl px-6 py-3.5 text-[15px] font-bold transition-all hover:-translate-y-0.5 ${
                ZAMOWIENIA_WYLACZONE ? "bg-ink text-white hover:bg-akcent" : "border-2 border-ink bg-white text-ink hover:bg-szary"
              }`}
            >
              Dodaj do koszyka
            </button>
            <PrzyciskUlubione id={produkt.id} wariant="produkt" />
          </div>
        </div>
      )}
      </div>

      {dodano ? (
        <p className="mb-8 text-[14px] text-ink-2">
          ✓ Dodano do koszyka.{" "}
          <Link href="/koszyk" className="text-ink underline underline-offset-2 hover:text-akcent">
            Przejdź do koszyka →
          </Link>
          <KodDodany />
        </p>
      ) : (
        <div className="mb-8" />
      )}

      {/* Pasek zakupu na telefonie */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-linia bg-white px-4 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-8px_24px_-16px_rgba(0,0,0,0.35)] transition-transform duration-200 md:hidden ${
          pasekWidoczny ? "translate-y-0" : "pointer-events-none translate-y-full"
        }`}
        aria-hidden={!pasekWidoczny}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[18px] font-extrabold leading-tight text-ink">{formatCena(produkt.cena)} zł</p>
            <p className="truncate text-[12px] text-ink-2">
              {dodano
                ? "✓ Dodano do koszyka"
                : [zKodem ? `${formatCena(zKodem.cena)} zł z kodem` : null, maRozmiary ? (rozmiar ? `rozm. ${rozmiar}` : "wybierz rozmiar") : produkt.wiekLabel]
                    .filter(Boolean)
                    .join(" · ")}
            </p>
          </div>
          {dodano ? (
            <Link href="/koszyk" tabIndex={pasekWidoczny ? 0 : -1} className="rounded-xl bg-akcent px-5 py-3 text-[14.5px] font-bold text-white no-underline">
              Przejdź do koszyka
            </Link>
          ) : wybranyWyprzedany || (maRozmiary && !rozmiar) || ZAMOWIENIA_WYLACZONE ? (
            <button
              type="button"
              onClick={wybranyWyprzedany ? () => sekcjaRozmiarow.current?.scrollIntoView({ behavior: "smooth", block: "center" }) : handleDodaj}
              tabIndex={pasekWidoczny ? 0 : -1}
              className="rounded-xl bg-ink px-5 py-3 text-[14.5px] font-bold text-white"
            >
              {wybranyWyprzedany ? "Powiadom mnie" : maRozmiary && !rozmiar ? "Wybierz rozmiar" : "Dodaj do koszyka"}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleDodaj}
                tabIndex={pasekWidoczny ? 0 : -1}
                aria-label="Dodaj do koszyka"
                title="Dodaj do koszyka"
                className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl border-2 border-ink bg-white text-ink"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <path d="M6 7h12l-1 13H7L6 7Z" />
                  <path d="M9 7V6a3 3 0 0 1 6 0v1" />
                  <path d="M12 11v5M9.5 13.5h5" />
                </svg>
              </button>
              <button type="button" onClick={handleKupTeraz} tabIndex={pasekWidoczny ? 0 : -1} className="rounded-xl bg-ink px-5 py-3 text-[14.5px] font-bold text-white">
                Kup teraz
              </button>
            </>
          )}
        </div>
      </div>

      {kupTeraz ? <KupTeraz produkt={produkt} rozmiar={rozmiar} onZamknij={zamknijKupTeraz} /> : null}
    </div>
  );
}

/** Po dodaniu do koszyka: informacja o automatycznie dodanym kodzie (test — lib/promocja KOD_AUTOMATYCZNY). */
function KodDodany() {
  const [kod, setKod] = useState<string | null>(null);
  useEffect(() => setKod(kodAutomatyczny()), []);
  const p = kod ? PROMOCJE.find((x) => x.kod === kod) : null;
  if (!p) return null;
  return (
    <span className="mt-1.5 block font-semibold text-[oklch(45%_0.13_150)]">
      🎁 Dodaliśmy Ci kod {p.kod} — −{p.procent}% na zamówienie.
    </span>
  );
}
