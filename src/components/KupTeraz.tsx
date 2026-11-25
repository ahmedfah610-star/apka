"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Produkt } from "@/data/produkty";
import { zdjecie } from "@/lib/zdjecia";
import { formatCena } from "@/lib/filtrowanie";
import { kosztDostawy, type MetodaDostawy } from "@/lib/dostawa";
import { useDostawa } from "@/lib/dostawaKlient";
import { WyborPaczkomatu, type Paczkomat } from "@/components/WyborPaczkomatu";
import { WyborPunktu, type PunktOdbioru } from "@/components/WyborPunktu";
import { FormularzFaktury, PUSTA_FAKTURA, type StanFaktury } from "@/components/FormularzFaktury";
import { useAuth } from "@/components/AuthContext";
import { useKoszyk } from "@/components/KoszykContext";
import { pozycjaPomiaru } from "@/components/DodajDoKoszyka";
import { daneDoPomiaru, pomiarKoszyka, zapamietajZakup } from "@/lib/analityka";
import { aktywujKodAutomatyczny, kodAutomatyczny, odrzucKodAutomatyczny } from "@/lib/kodAutomatyczny";
import { bladZamowienia, trescZamowienia, PUSTE_DANE, type Zamowienie } from "@/lib/zamowienieWspolne";
import { fakturaZZapisu, uzupelnijPuste, wczytajDane, zapamietajPoZamowieniu } from "@/lib/zapamietaneDane";
import { ZAMOWIENIA_WYLACZONE, KOMUNIKAT_PRZERWY } from "@/lib/sklep";

/** Metody od najtańszej (przy równej cenie — kolejność z ustawień). */
export function metodyOdNajtanszej(metody: MetodaDostawy[], suma: number, darmowaOd: number): MetodaDostawy[] {
  return metody
    .filter((m) => m.aktywna !== false)
    .map((m, i) => ({ m, i, k: kosztDostawy(m, suma, darmowaOd) }))
    .sort((a, b) => a.k - b.k || a.i - b.i)
    .map((x) => x.m);
}

type Kod = { kod: string; rabat: number };

/**
 * „Kup teraz” — zakup jednego produktu bez koszyka, w jednym oknie (na telefonie wysuwane od dołu):
 * dostawa (od najtańszej) → dane → „Zamawiam i płacę” → Przelewy24. Koszyk klienta zostaje nietknięty.
 * Zamówienie idzie tym samym /api/platnosc/checkout co koszyk (serwer liczy ceny, dostawę i kod sam).
 */
export function KupTeraz({ produkt, rozmiar, onZamknij }: { produkt: Produkt; rozmiar?: string; onZamknij: () => void }) {
  const router = useRouter();
  const { user } = useAuth();
  const { dodaj } = useKoszyk();
  const ustawienia = useDostawa();
  const suma = produkt.cena;
  const metody = useMemo(() => metodyOdNajtanszej(ustawienia.metody, suma, ustawienia.darmowaOd), [ustawienia, suma]);

  const [metodaId, setMetodaId] = useState<string | null>(null);
  const [paczkomat, setPaczkomat] = useState<Paczkomat | null>(null);
  const [punkty, setPunkty] = useState<Record<string, PunktOdbioru>>({});
  const [dane, setDane] = useState(PUSTE_DANE);
  const [faktura, setFaktura] = useState<StanFaktury>(PUSTA_FAKTURA);
  const [akceptacja, setAkceptacja] = useState(false);
  const [zapamietaj, setZapamietaj] = useState(true);
  const [kod, setKod] = useState<Kod | null>(null);
  const [kodPole, setKodPole] = useState<string | null>(null); // null = pole ukryte
  const [kodBlad, setKodBlad] = useState("");
  const [blad, setBlad] = useState("");
  const [wysylka, setWysylka] = useState(false);
  const [platnosciOnline, setPlatnosciOnline] = useState(true);

  // Wybrana metoda: zapamiętana z poprzedniego zamówienia (jeśli wciąż aktywna), inaczej najtańsza.
  const metoda = metody.find((m) => m.id === metodaId) ?? metody[0];
  const punkt = metoda ? punkty[metoda.id] ?? null : null;
  const rabat = kod ? Math.min(kod.rabat, suma) : 0;
  const dostawa = metoda ? kosztDostawy(metoda, suma, ustawienia.darmowaOd) : 0;
  const razem = Math.max(0, suma - rabat) + dostawa;
  const brakujeDoDarmowej = metoda && !metoda.bezDarmowej && dostawa > 0 ? ustawienia.darmowaOd - suma : 0;

  // Start: dane z poprzedniego zamówienia, z konta, kod automatyczny, pomiar GA4.
  useEffect(() => {
    const z = wczytajDane();
    if (z) {
      setDane((d) => uzupelnijPuste(d, z.dane));
      setFaktura((f) => fakturaZZapisu(f, z.faktura));
      if (z.metodaId) setMetodaId(z.metodaId);
      if (z.paczkomat) setPaczkomat({ ...z.paczkomat, miasto: z.paczkomat.miasto ?? "" });
      if (z.punkty) setPunkty(Object.fromEntries(Object.entries(z.punkty).map(([k, p]) => [k, { ...p, miasto: p.miasto ?? "" }])));
    }
    fetch("/api/konfiguracja")
      .then((r) => r.json())
      .then((d) => setPlatnosciOnline(!!d.platnosci))
      .catch(() => {});
    pomiarKoszyka("begin_checkout", [{ ...pozycjaPomiaru(produkt), rozmiar }]);
    // Kod dodawany automatycznie (jak po włożeniu do koszyka) — naliczamy go bez wpisywania.
    aktywujKodAutomatyczny();
    const auto = kodAutomatyczny();
    if (auto) void sprawdzKod(auto, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user) return;
    const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
    setDane((d) =>
      uzupelnijPuste(d, {
        imie: (meta.imie ?? "").trim(),
        email: user.email ?? "",
        telefon: (meta.telefon ?? "").trim(),
        adres: (meta.adres ?? "").trim(),
        miasto: (meta.miasto ?? "").trim(),
        kod: (meta.kod ?? "").trim(),
      }),
    );
  }, [user]);

  // Okno: Escape zamyka, strona pod spodem się nie przewija.
  useEffect(() => {
    const przed = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const klawisz = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !wysylkaRef.current) onZamknij();
    };
    window.addEventListener("keydown", klawisz);
    return () => {
      document.body.style.overflow = przed;
      window.removeEventListener("keydown", klawisz);
    };
  }, [onZamknij]);
  const wysylkaRef = useRef(false);
  wysylkaRef.current = wysylka;

  async function sprawdzKod(tekst: string, automatyczny = false) {
    const k = tekst.trim().toUpperCase();
    if (!k) return;
    setKodBlad("");
    try {
      const r = await fetch("/api/kod", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(automatyczny ? { kod: k, suma } : { kod: k, suma, telefon: dane.telefon }),
      });
      const d = (await r.json().catch(() => ({}))) as { ok?: boolean; kod?: string; rabat?: number; blad?: string };
      if (d.ok && d.kod && typeof d.rabat === "number") {
        setKod({ kod: d.kod, rabat: d.rabat });
        setKodPole(null);
      } else if (!automatyczny) {
        setKod(null);
        setKodBlad(d.blad || "Nieprawidłowy kod.");
      }
    } catch {
      if (!automatyczny) setKodBlad("Błąd połączenia.");
    }
  }

  function usunKod() {
    if (kod) odrzucKodAutomatyczny(kod.kod);
    setKod(null);
    setKodBlad("");
  }

  function doKoszyka() {
    dodaj(produkt.id, rozmiar, 1);
    onZamknij();
  }

  async function zloz() {
    if (ZAMOWIENIA_WYLACZONE) return setBlad(KOMUNIKAT_PRZERWY);
    if (!metoda) return setBlad("Wybierz sposób dostawy.");
    const zamowienie: Zamowienie = {
      pozycje: [{ id: produkt.id, nazwa: produkt.nazwa, cena: produkt.cena, ilosc: 1, rozmiar, kolor: produkt.kolor ?? null }],
      dostawa,
      metoda,
      dane,
      paczkomat,
      punkt,
      faktura,
      akceptacja,
      kod: kod?.kod ?? null,
      zrodlo: "kup-teraz",
    };
    const b = bladZamowienia(zamowienie);
    if (b) return setBlad(b);
    setBlad("");
    setWysylka(true);
    zapamietajZakup({
      pozycje: [{ ...pozycjaPomiaru(produkt), rozmiar }],
      dostawa,
      rabat,
      kod: kod?.kod ?? null,
      email: dane.email,
      telefon: dane.telefon,
    });
    try {
      const res = await fetch("/api/platnosc/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...trescZamowienia(zamowienie), pomiar: daneDoPomiaru() }),
      });
      const d = (await res.json().catch(() => ({}))) as { ok?: boolean; blad?: string; url?: string; id?: string };
      if (!res.ok || d.ok === false) {
        setWysylka(false);
        // Kod przestał działać (np. pula się skończyła) — zdejmujemy rabat, klient widzi prawdziwą kwotę przed płatnością.
        if (kod && /Usuń kod/.test(d.blad ?? "")) {
          odrzucKodAutomatyczny(kod.kod);
          setKod(null);
          return setBlad(`${(d.blad ?? "").replace(/\s*Usuń kod lub wpisz inny\.$/, "")} Rabat został zdjęty — sprawdź nową kwotę i kliknij jeszcze raz.`);
        }
        return setBlad(d.blad || "Nie udało się złożyć zamówienia. Spróbuj ponownie.");
      }
      zapamietajPoZamowieniu(zapamietaj, { dane, metodaId: metoda.id, paczkomat, punkt, faktura });
      if (d.url) {
        window.location.href = d.url;
        return;
      }
      // Bez płatności online — od razu potwierdzenie (koszyk zostaje, bo ten zakup go nie dotyczył).
      router.push(d.id ? `/zamowienie/dziekujemy?zamowienie=${encodeURIComponent(String(d.id))}` : "/zamowienie/dziekujemy");
    } catch {
      setWysylka(false);
      setBlad("Błąd połączenia. Spróbuj ponownie.");
    }
  }

  const input = "w-full rounded-lg border border-linia-2 bg-white px-3.5 py-2.5 text-[16px] outline-none transition-colors focus:border-ink md:text-[14px]";
  const kurier = metoda && !metoda.paczkomat && !metoda.punkt;
  const zl = (n: number) => `${formatCena(n)} zł`;

  return (
    <div
      className="fixed inset-0 z-[96] flex items-end justify-center bg-black/45 md:items-center md:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !wysylka) onZamknij();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="kup-teraz-tytul"
        className="flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-[22px] bg-white shadow-2xl md:max-h-[92vh] md:max-w-[980px] md:rounded-[20px]"
      >
        <div className="flex items-center justify-between border-b border-linia px-4 py-3 md:px-7 md:py-4">
          <h2 id="kup-teraz-tytul" className="text-[19px] font-extrabold md:text-[22px]">
            Kup teraz
          </h2>
          <button type="button" onClick={onZamknij} disabled={wysylka} aria-label="Zamknij" className="-mr-1 p-1.5 text-[20px] leading-none text-ink-2 hover:text-ink">
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3 md:px-7 md:pb-6">
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-szary/70 p-2.5">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-white">
              {produkt.zdjecie ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={zdjecie(produkt.zdjecie, "s128")} alt="" className="h-full w-full object-contain p-0.5" />
              ) : null}
            </span>
            <span className="min-w-0 flex-1 text-[13.5px]">
              <span className="line-clamp-2 font-semibold leading-snug">{produkt.nazwa}</span>
              <span className="block text-ink-2">
                {[produkt.kolor, rozmiar ? `rozmiar ${rozmiar}` : null, "1 szt."].filter(Boolean).join(" · ")}
              </span>
            </span>
            <span className="shrink-0 text-[15px] font-bold">{zl(produkt.cena)}</span>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-8">
            {/* 1. Dostawa */}
            <section>
              <h3 className="mb-2.5 text-[15px] font-extrabold">1. Jak chcesz otrzymać paczkę?</h3>
              <div className="flex flex-col gap-2">
                {metody.map((m, i) => {
                  const on = metoda?.id === m.id;
                  const koszt = kosztDostawy(m, suma, ustawienia.darmowaOd);
                  return (
                    <div key={m.id}>
                      <button
                        type="button"
                        onClick={() => setMetodaId(m.id)}
                        aria-pressed={on}
                        className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors ${
                          on ? "border-akcent bg-akcent-2 ring-1 ring-akcent" : "border-linia-2 hover:border-ink-2"
                        }`}
                      >
                        <span className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 ${on ? "border-akcent" : "border-linia-2"}`}>
                          {on ? <span className="h-2 w-2 rounded-full bg-akcent" /> : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-1.5 text-[14px] font-bold">
                            {m.nazwa}
                            {i === 0 ? <span className="rounded bg-cena px-1.5 py-px text-[10.5px] font-extrabold text-white">najtaniej</span> : null}
                          </span>
                          <span className="block truncate text-[12.5px] text-ink-2">{m.opis}</span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="block text-[14px] font-extrabold">{koszt === 0 ? "gratis" : zl(koszt)}</span>
                          <span className="block text-[11.5px] text-ink-2">razem {zl(Math.max(0, suma - rabat) + koszt)}</span>
                        </span>
                      </button>
                      {on && m.paczkomat ? <WyborPaczkomatu wybrany={paczkomat} onWybierz={setPaczkomat} /> : null}
                      {on && m.punkt ? (
                        <WyborPunktu
                          operator={m.operator ?? "RUCH"}
                          nazwa={m.operatorNazwa ?? m.nazwa}
                          wybrany={punkty[m.id] ?? null}
                          onWybierz={(p) => setPunkty((w) => ({ ...w, [m.id]: p }))}
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 2. Dane, faktura, podsumowanie */}
            <section>
              <h3 className="mb-2.5 text-[15px] font-extrabold">2. {kurier ? "Gdzie wysłać?" : "Twoje dane"}</h3>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <input className={`${input} sm:col-span-2`} placeholder="Imię i nazwisko" name="name" autoComplete="name" value={dane.imie} onChange={(e) => setDane({ ...dane, imie: e.target.value })} />
                <input className={input} placeholder="E-mail" type="email" name="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} value={dane.email} onChange={(e) => setDane({ ...dane, email: e.target.value })} />
                <input className={input} placeholder="Telefon (SMS o paczce)" type="tel" name="tel" autoComplete="tel" inputMode="tel" value={dane.telefon} onChange={(e) => setDane({ ...dane, telefon: e.target.value })} />
                {kurier ? (
                  <>
                    <input className={`${input} sm:col-span-2`} placeholder="Ulica i numer" name="street-address" autoComplete="street-address" value={dane.adres} onChange={(e) => setDane({ ...dane, adres: e.target.value })} />
                    <input className={input} placeholder="Kod pocztowy" name="postal-code" autoComplete="postal-code" inputMode="numeric" value={dane.kod} onChange={(e) => setDane({ ...dane, kod: e.target.value })} />
                    <input className={input} placeholder="Miejscowość" name="address-level2" autoComplete="address-level2" value={dane.miasto} onChange={(e) => setDane({ ...dane, miasto: e.target.value })} />
                  </>
                ) : null}
              </div>

              <div className="mt-3 [&>section]:mb-0 [&>section]:rounded-xl [&>section]:p-3.5 md:[&>section]:p-4">
                <FormularzFaktury
                  wartosc={faktura}
                  onZmiana={setFaktura}
                  domyslne={{ imie: dane.imie, adres: kurier ? dane.adres : "", kod: kurier ? dane.kod : "", miasto: kurier ? dane.miasto : "" }}
                />
              </div>

              <div className="mt-4 text-[14px]">
                <div className="flex justify-between py-0.5">
                  <span className="text-ink-2">Produkt</span>
                  <span>{zl(suma)}</span>
                </div>
                {kod ? (
                  <div className="flex justify-between py-0.5 text-[oklch(45%_0.13_150)]">
                    <span>
                      Rabat {kod.kod}{" "}
                      <button type="button" onClick={usunKod} className="text-[12px] text-ink-2 underline underline-offset-2 hover:text-akcent">
                        usuń
                      </button>
                    </span>
                    <span>−{zl(rabat)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between py-0.5">
                  <span className="text-ink-2">Dostawa{metoda ? ` · ${metoda.nazwa}` : ""}</span>
                  <span>{dostawa === 0 ? "gratis" : zl(dostawa)}</span>
                </div>
                {!kod ? (
                  kodPole === null ? (
                    <button type="button" onClick={() => setKodPole("")} className="mt-1 text-[12.5px] text-ink-2 underline underline-offset-2 hover:text-ink">
                      Masz kod rabatowy?
                    </button>
                  ) : (
                    <div className="mt-1.5">
                      <div className="flex gap-2">
                        <input
                          value={kodPole}
                          onChange={(e) => setKodPole(e.target.value.toUpperCase())}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") void sprawdzKod(kodPole);
                          }}
                          placeholder="Kod rabatowy"
                          aria-label="Kod rabatowy"
                          className="min-w-0 flex-1 rounded-lg border border-linia-2 px-3 py-2 text-[16px] uppercase outline-none focus:border-ink md:text-[13px]"
                        />
                        <button type="button" onClick={() => void sprawdzKod(kodPole)} disabled={!kodPole.trim()} className="shrink-0 rounded-lg border border-ink px-4 text-[12.5px] font-semibold hover:bg-ink hover:text-white disabled:opacity-50">
                          Użyj
                        </button>
                      </div>
                      {kodBlad ? <p className="mt-1 text-[12px] text-akcent">{kodBlad}</p> : null}
                    </div>
                  )
                ) : null}
                <div className="mt-2 flex items-baseline justify-between border-t border-linia pt-2.5">
                  <span className="text-[16px] font-bold">Razem</span>
                  <span className="text-[21px] font-extrabold">{zl(razem)}</span>
                </div>
              </div>

              {brakujeDoDarmowej > 0 ? (
                <p className="mt-2.5 rounded-lg border border-dashed border-cena/60 bg-[oklch(97%_0.025_55)] px-3 py-2 text-[12.5px] leading-snug text-ink-2">
                  Do darmowej dostawy brakuje {zl(brakujeDoDarmowej)}.{" "}
                  <button type="button" onClick={doKoszyka} className="font-bold text-ink underline underline-offset-2 hover:text-akcent">
                    Dodaj do koszyka i wybierz coś jeszcze
                  </button>
                </p>
              ) : null}
            </section>
          </div>
        </div>

        {/* Stopka okna — zawsze widoczna: zgody, błąd, przycisk płatności */}
        <div className="border-t border-linia bg-white px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 md:px-7 md:pb-5">
          <div className="mb-2.5 flex flex-col gap-1.5 text-[12.5px] leading-snug text-ink-2 md:flex-row md:gap-6">
            <label className="flex cursor-pointer items-start gap-2">
              <input type="checkbox" checked={akceptacja} onChange={(e) => setAkceptacja(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--ink)]" />
              <span>
                Akceptuję{" "}
                <Link href="/regulamin" target="_blank" className="underline underline-offset-2 hover:text-akcent">
                  Regulamin
                </Link>{" "}
                i{" "}
                <Link href="/polityka-prywatnosci" target="_blank" className="underline underline-offset-2 hover:text-akcent">
                  Politykę prywatności
                </Link>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2">
              <input type="checkbox" checked={zapamietaj} onChange={(e) => setZapamietaj(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--ink)]" />
              <span>Zapamiętaj moje dane na tym urządzeniu</span>
            </label>
          </div>
          {blad ? <p className="mb-2.5 rounded-lg border border-akcent/40 bg-akcent/5 px-3 py-2 text-[13px] text-akcent">{blad}</p> : null}
          <button
            type="button"
            onClick={() => void zloz()}
            disabled={wysylka || ZAMOWIENIA_WYLACZONE || !metoda}
            className="block w-full rounded-xl bg-ink px-6 py-4 text-center text-[16px] font-extrabold text-white transition-colors hover:bg-akcent disabled:cursor-not-allowed disabled:opacity-60"
          >
            {wysylka ? "Przetwarzanie…" : platnosciOnline ? `Zamawiam i płacę ${zl(razem)}` : `Zamawiam · ${zl(razem)}`}
          </button>
          <p className="mt-2 text-center text-[12px] text-ink-2">
            {platnosciOnline ? "🔒 BLIK, szybki przelew lub karta — bezpieczna płatność Przelewy24" : "Płatności online chwilowo niedostępne — skontaktujemy się w sprawie zapłaty."}
          </p>
        </div>
      </div>
    </div>
  );
}
