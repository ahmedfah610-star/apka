"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Nawigacja } from "@/components/Nawigacja";
import { Stopka } from "@/components/Stopka";
import { WyborPaczkomatu, type Paczkomat } from "@/components/WyborPaczkomatu";
import { WyborPunktu, type PunktOdbioru } from "@/components/WyborPunktu";
import { useKoszyk } from "@/components/KoszykContext";
import { useAuth } from "@/components/AuthContext";
import { KrokiZamowienia } from "@/components/KrokiZamowienia";
import { TerminDostawy } from "@/components/TerminDostawy";
import { sbBrowser } from "@/lib/supabaseBrowser";
import { ZAMOWIENIA_WYLACZONE, KOMUNIKAT_PRZERWY } from "@/lib/sklep";
import { PrzerwaTechniczna } from "@/components/PrzerwaTechniczna";
import { PRODUKTY, znajdzProdukt, type Produkt } from "@/data/produkty";
import { formatCena } from "@/lib/filtrowanie";
import { METODY_DOSTAWY, kosztDostawy } from "@/lib/dostawa";

// Płatności obsługuje w całości Przelewy24 — to na jego bezpiecznej stronie
// klient wybiera BLIK / przelew / kartę. Nie dublujemy tu tego wyboru.
const PLATNOSCI = [{ id: "przelewy24", nazwa: "Przelewy24", opis: "BLIK, szybki przelew, karta" }];

export default function StronaZamowienia() {
  const router = useRouter();
  const { pozycje, wyczysc } = useKoszyk();
  const { user } = useAuth();

  const [katalog, setKatalog] = useState<Produkt[]>(PRODUKTY);
  const [metodaId, setMetodaId] = useState(METODY_DOSTAWY[0].id);
  const [paczkomat, setPaczkomat] = useState<Paczkomat | null>(null);
  const [punkt, setPunkt] = useState<PunktOdbioru | null>(null);
  const [dane, setDane] = useState({ imie: "", email: "", telefon: "", adres: "", miasto: "", kod: "" });
  const [akceptacja, setAkceptacja] = useState(false);
  const [blad, setBlad] = useState("");
  const [wysylka, setWysylka] = useState(false);
  const [platnosciOnline, setPlatnosciOnline] = useState(false);

  // Kod rabatowy (nazwa pola „kod" w danych to kod pocztowy — tu inne).
  const [kodRabatu, setKodRabatu] = useState("");
  const [kodPrzyjety, setKodPrzyjety] = useState<{ kod: string; rabat: number } | null>(null);
  const [kodBlad, setKodBlad] = useState("");
  const [kodSprawdzanie, setKodSprawdzanie] = useState(false);

  useEffect(() => {
    fetch("/api/katalog")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.items) && d.items.length) setKatalog(d.items);
      })
      .catch(() => {});
    fetch("/api/konfiguracja")
      .then((r) => r.json())
      .then((d) => setPlatnosciOnline(!!d.platnosci))
      .catch(() => {});
  }, []);

  // Zalogowany klient — wstępnie wypełnij dane z profilu (tylko puste pola).
  useEffect(() => {
    if (!user) return;
    const meta = (user.user_metadata ?? {}) as { imie?: string; telefon?: string; adres?: string; kod?: string; miasto?: string };
    setDane((d) => ({
      imie: d.imie || (meta.imie ?? "").trim() || "",
      email: d.email || user.email || "",
      telefon: d.telefon || (meta.telefon ?? "").trim() || "",
      adres: d.adres || (meta.adres ?? "").trim() || "",
      kod: d.kod || (meta.kod ?? "").trim() || "",
      miasto: d.miasto || (meta.miasto ?? "").trim() || "",
    }));
  }, [user]);

  // Zalogowany klient — dane dostawy z ostatniego zamówienia (tylko puste pola).
  useEffect(() => {
    const sb = sbBrowser();
    if (!user || !sb) return;
    sb.from("zamowienia")
      .select("klient, created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        const k = (data?.klient ?? {}) as Record<string, string | undefined>;
        if (!k) return;
        setDane((d) => ({
          imie: d.imie || (k.imie ?? ""),
          email: d.email || (k.email ?? ""),
          telefon: d.telefon || (k.telefon ?? ""),
          adres: d.adres || (k.adres ?? ""),
          miasto: d.miasto || (k.miasto ?? ""),
          kod: d.kod || (k.kod ?? ""),
        }));
      });
  }, [user]);

  // Katalog z bazy (lub kodu) — wyszukiwanie po id pozycji koszyka.
  const znajdz = useMemo(() => {
    const mapa = new Map(katalog.map((p) => [p.id, p]));
    return (id: string): Produkt | null => mapa.get(id) ?? znajdzProdukt(id) ?? null;
  }, [katalog]);

  const pozycjeZDanymi = pozycje.map((poz) => ({ poz, produkt: znajdz(poz.id) })).filter((x) => x.produkt);
  const suma = pozycjeZDanymi.reduce((s, { poz, produkt }) => s + produkt!.cena * poz.ilosc, 0);

  const metoda = METODY_DOSTAWY.find((m) => m.id === metodaId)!;
  const platnosc = PLATNOSCI[0];
  const dostawa = kosztDostawy(metoda, suma);
  const rabat = kodPrzyjety ? Math.min(kodPrzyjety.rabat, suma) : 0;
  const razem = Math.max(0, suma - rabat) + dostawa;

  if (pozycjeZDanymi.length === 0) {
    return (
      <div className="overflow-x-hidden">
        <Nawigacja />
        <div className="mx-auto max-w-content px-6 py-20 text-center md:px-12">
          <p className="mb-2 text-[17px] font-semibold">Koszyk jest pusty</p>
          <p className="mb-6 text-sm text-ink-2">Dodaj produkty, zanim przejdziesz do zamówienia.</p>
          <Link href="/produkty" className="inline-block bg-ink px-8 py-3.5 text-[13px] font-semibold tracking-wide text-tlo no-underline hover:bg-akcent">
            PRZEGLĄDAJ PRODUKTY
          </Link>
        </div>
        <Stopka />
      </div>
    );
  }

  const numer = "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-[12px] font-bold text-tlo";

  async function sprawdzKod() {
    const kod = kodRabatu.trim();
    if (!kod) return;
    setKodSprawdzanie(true);
    setKodBlad("");
    try {
      const r = await fetch("/api/kod", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kod, suma }),
      });
      const d = (await r.json().catch(() => ({}))) as { ok?: boolean; kod?: string; rabat?: number; blad?: string };
      if (d.ok && d.kod && typeof d.rabat === "number") {
        setKodPrzyjety({ kod: d.kod, rabat: d.rabat });
        setKodBlad("");
      } else {
        setKodPrzyjety(null);
        setKodBlad(d.blad || "Nieprawidłowy kod.");
      }
    } catch {
      setKodBlad("Błąd połączenia.");
    } finally {
      setKodSprawdzanie(false);
    }
  }

  function usunKod() {
    setKodPrzyjety(null);
    setKodRabatu("");
    setKodBlad("");
  }

  async function zloz(e: React.FormEvent) {
    e.preventDefault();
    if (ZAMOWIENIA_WYLACZONE) return setBlad(KOMUNIKAT_PRZERWY);
    if (!dane.imie || !dane.email) return setBlad("Uzupełnij imię i e-mail.");
    if (metoda.paczkomat && !paczkomat) return setBlad("Wybierz paczkomat InPost.");
    if (metoda.punkt && !punkt) return setBlad("Wybierz punkt ORLEN Paczka.");
    if (!metoda.paczkomat && !metoda.punkt && (!dane.adres || !dane.miasto || !dane.kod)) return setBlad("Uzupełnij adres dostawy.");
    if (!akceptacja) return setBlad("Zaakceptuj Regulamin i Politykę prywatności.");
    setBlad("");
    setWysylka(true);
    try {
      const res = await fetch("/api/platnosc/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pozycje: pozycjeZDanymi.map(({ poz, produkt }) => ({
            id: produkt!.id,
            nazwa: produkt!.nazwa,
            cena: produkt!.cena,
            ilosc: poz.ilosc,
            rozmiar: poz.rozmiar,
          })),
          dostawa,
          metoda: `${metoda.nazwa} · ${platnosc.nazwa}`,
          kod: kodPrzyjety?.kod,
          klient: {
            imie: dane.imie,
            email: dane.email,
            telefon: dane.telefon,
            ...(metoda.paczkomat
              ? { paczkomat: paczkomat?.kod, paczkomatOpis: paczkomat?.opis }
              : metoda.punkt
              ? { punkt: punkt?.kod, punktOpis: punkt?.opis, miasto: punkt?.miasto }
              : { adres: dane.adres, miasto: dane.miasto, kod: dane.kod }),
          },
        }),
      });
      const dane2 = (await res.json().catch(() => ({}))) as { ok?: boolean; blad?: string; url?: string };
      if (!res.ok || dane2.ok === false) {
        setWysylka(false);
        return setBlad(dane2.blad || "Nie udało się złożyć zamówienia. Spróbuj ponownie.");
      }
      // Płatność online → przekierowanie do Stripe (BLIK / Przelewy24 / karta).
      if (dane2.url) {
        window.location.href = dane2.url;
        return;
      }
    } catch {
      setWysylka(false);
      return setBlad("Błąd połączenia. Spróbuj ponownie.");
    }
    // Tryb bez płatności online — od razu potwierdzenie.
    wyczysc();
    router.push("/zamowienie/dziekujemy");
  }

  const input = "w-full rounded-lg border border-linia-2 bg-white px-3.5 py-2.5 text-[16px] outline-none transition-colors focus:border-ink md:text-[14px]";

  return (
    <div className="overflow-x-hidden bg-szary/30">
      <Nawigacja />

      <form onSubmit={zloz} className="mx-auto grid max-w-content grid-cols-1 gap-6 px-4 py-8 sm:px-6 md:px-12 md:py-12 lg:grid-cols-[1fr_380px] lg:gap-10">
        <div>
          <KrokiZamowienia aktywny={2} />
          <h1 className="mb-7 text-[26px] font-bold tracking-tight md:text-[32px]">Dostawa i płatność</h1>
          {ZAMOWIENIA_WYLACZONE ? <PrzerwaTechniczna className="mb-6" /> : null}

          {/* Dane kontaktowe */}
          <section className="mb-5 rounded-2xl border border-linia bg-white p-5 md:p-6">
            <h2 className="mb-4 flex items-center gap-2.5 text-[15px] font-bold">
              <span className={numer}>1</span> Dane kontaktowe
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input className={`${input} sm:col-span-2`} placeholder="Imię i nazwisko" value={dane.imie} onChange={(e) => setDane({ ...dane, imie: e.target.value })} />
              <input className={input} placeholder="E-mail" type="email" value={dane.email} onChange={(e) => setDane({ ...dane, email: e.target.value })} />
              <input className={input} placeholder="Telefon" value={dane.telefon} onChange={(e) => setDane({ ...dane, telefon: e.target.value })} />
            </div>
          </section>

          {/* Dostawa */}
          <section className="mb-5 rounded-2xl border border-linia bg-white p-5 md:p-6">
            <h2 className="mb-4 flex items-center gap-2.5 text-[15px] font-bold">
              <span className={numer}>2</span> Sposób dostawy
            </h2>
            <div className="flex flex-col gap-3">
              {METODY_DOSTAWY.map((m) => {
                const on = metodaId === m.id;
                const koszt = kosztDostawy(m, suma);
                return (
                  <div key={m.id}>
                    <button
                      type="button"
                      onClick={() => setMetodaId(m.id)}
                      className={`flex w-full items-center justify-between rounded-lg border px-4 py-3.5 text-left transition-colors ${on ? "border-ink bg-szary/40" : "border-linia-2 hover:border-ink-2"}`}
                    >
                      <span className="flex items-center gap-3">
                        <span className={`flex h-4 w-4 items-center justify-center rounded-full border-[1.5px] ${on ? "border-ink" : "border-linia-2"}`}>
                          {on ? <span className="h-2 w-2 rounded-full bg-ink" /> : null}
                        </span>
                        <span>
                          <span className="flex flex-wrap items-center gap-2 text-[14px] font-semibold">
                            {m.paczkomat ? <span className="bg-[oklch(85%_0.16_95)] px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-ink">InPost</span> : null}
                            {m.nazwa}
                          </span>
                          <span className="block text-[13px] text-ink-2">
                            {m.opis}
                            {m.info ? (
                              <span title={m.info} className="ml-1 cursor-help underline decoration-dotted underline-offset-2">
                                co to?
                              </span>
                            ) : null}
                          </span>
                        </span>
                      </span>
                      <span className="text-[14px] font-medium">{koszt === 0 ? "gratis" : `${formatCena(koszt)} zł`}</span>
                    </button>
                    {on && m.info ? (
                      <p className="mt-2 border-l-2 border-linia-2 bg-szary/30 px-3 py-2 text-[12.5px] leading-relaxed text-ink-2">
                        {m.info}
                      </p>
                    ) : null}
                    {on && m.paczkomat ? <WyborPaczkomatu wybrany={paczkomat} onWybierz={setPaczkomat} /> : null}
                    {on && m.punkt ? (
                      <WyborPunktu operator={m.operator ?? "RUCH"} nazwa={m.operatorNazwa ?? m.nazwa} wybrany={punkt} onWybierz={setPunkt} />
                    ) : null}
                  </div>
                );
              })}
            </div>

            {!metoda.paczkomat && !metoda.punkt ? (
              <div className="mt-5 border-t border-linia pt-5">
                <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-ink-2">Adres dostawy</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input className={`${input} sm:col-span-2`} placeholder="Ulica i numer" value={dane.adres} onChange={(e) => setDane({ ...dane, adres: e.target.value })} />
                  <input className={input} placeholder="Kod pocztowy" value={dane.kod} onChange={(e) => setDane({ ...dane, kod: e.target.value })} />
                  <input className={input} placeholder="Miejscowość" value={dane.miasto} onChange={(e) => setDane({ ...dane, miasto: e.target.value })} />
                </div>
              </div>
            ) : null}
          </section>

          {/* Płatność */}
          <section className="rounded-2xl border border-linia bg-white p-5 md:p-6">
            <h2 className="mb-4 flex items-center gap-2.5 text-[15px] font-bold">
              <span className={numer}>3</span> Płatność
            </h2>
            {platnosciOnline ? (
              <div className="flex items-start gap-4 rounded-lg border border-linia-2 bg-szary/20 px-4 py-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink text-tlo">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" />
                  </svg>
                </span>
                <span className="min-w-0">
                  <span className="block text-[14.5px] font-semibold">Przelewy24 — bezpieczna płatność online</span>
                  <span className="mt-0.5 block text-[13px] leading-relaxed text-ink-2">
                    Po kliknięciu „Zamawiam i płacę" przejdziesz na bezpieczną stronę Przelewy24,
                    gdzie wybierzesz sposób zapłaty: <strong>BLIK</strong>, szybki przelew z banku lub kartę.
                  </span>
                </span>
              </div>
            ) : (
              <div className="rounded-lg border border-linia-2 bg-szary/20 px-4 py-4 text-[13px] leading-relaxed text-ink-2">
                Płatności online są chwilowo niedostępne — złóż zamówienie, a skontaktujemy się z Tobą w sprawie zapłaty.
              </div>
            )}
          </section>
        </div>

        {/* Podsumowanie */}
        <aside className="h-fit rounded-2xl border border-linia bg-white p-6 shadow-[0_2px_24px_-18px_rgba(0,0,0,0.35)] lg:sticky lg:top-24">
          <h2 className="mb-4 text-[17px] font-bold">Twoje zamówienie</h2>
          <div className="-mr-2 flex max-h-72 flex-col gap-3 overflow-y-auto border-b border-linia pb-4 pr-2">
            {pozycjeZDanymi.map(({ poz, produkt }) => (
              <div key={`${poz.id}-${poz.rozmiar ?? ""}`} className="flex items-center gap-3 text-[13.5px]">
                <span className="relative flex h-14 w-14 shrink-0 items-center justify-center border border-linia bg-szary/40">
                  {produkt!.zdjecie ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={produkt!.zdjecie} alt="" className="h-full w-full object-contain p-0.5" />
                  ) : null}
                  <span className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ink px-1 text-[11px] font-semibold text-tlo">
                    {poz.ilosc}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-ink">{produkt!.nazwa}</span>
                  {poz.rozmiar ? <span className="block text-[12px] text-ink-2">rozmiar {poz.rozmiar}</span> : null}
                </span>
                <span className="whitespace-nowrap font-semibold">{formatCena(produkt!.cena * poz.ilosc)} zł</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between py-3 text-[14px]">
            <span className="text-ink-2">Produkty</span>
            <span>{formatCena(suma)} zł</span>
          </div>
          <div className="flex justify-between pb-3 text-[14px]">
            <span className="text-ink-2">Dostawa{metoda ? ` · ${metoda.nazwa}` : ""}</span>
            <span className={dostawa === 0 ? "font-medium text-[oklch(52%_0.13_150)]" : ""}>{dostawa === 0 ? "gratis" : `${formatCena(dostawa)} zł`}</span>
          </div>

          {/* Kod rabatowy */}
          {kodPrzyjety ? (
            <div className="flex items-center justify-between border-t border-linia pt-3 text-[14px]">
              <span className="flex items-center gap-2 text-[oklch(45%_0.13_150)]">
                Rabat <span className="rounded bg-[oklch(94%_0.05_150)] px-1.5 py-0.5 font-mono text-[12px] font-semibold">{kodPrzyjety.kod}</span>
                <button type="button" onClick={usunKod} className="text-[12px] text-ink-2 underline underline-offset-2 hover:text-akcent">usuń</button>
              </span>
              <span className="font-medium text-[oklch(45%_0.13_150)]">−{formatCena(rabat)} zł</span>
            </div>
          ) : (
            <div className="border-t border-linia pt-3">
              <div className="flex gap-2">
                <input
                  value={kodRabatu}
                  onChange={(e) => setKodRabatu(e.target.value.toUpperCase())}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void sprawdzKod(); } }}
                  placeholder="Kod rabatowy"
                  className="min-w-0 flex-1 rounded-lg border border-linia-2 bg-white px-3 py-2 text-[13px] uppercase outline-none focus:border-ink"
                />
                <button
                  type="button"
                  onClick={() => void sprawdzKod()}
                  disabled={kodSprawdzanie || !kodRabatu.trim()}
                  className="shrink-0 rounded-lg border border-ink px-4 py-2 text-[12.5px] font-semibold text-ink transition-colors hover:bg-ink hover:text-tlo disabled:opacity-50"
                >
                  {kodSprawdzanie ? "…" : "Użyj"}
                </button>
              </div>
              {kodBlad ? <p className="mt-1.5 text-[12px] text-akcent">{kodBlad}</p> : null}
            </div>
          )}

          <div className="mt-3 flex items-baseline justify-between border-t border-linia py-4">
            <span className="text-[15px] font-semibold">Razem</span>
            <span className="text-[22px] font-bold">{formatCena(razem)} zł</span>
          </div>

          <TerminDostawy klasa="mb-4 flex items-center gap-2 rounded-lg bg-szary/40 px-3 py-2.5 text-[13px] text-ink-2" />

          <label className="mb-3 flex cursor-pointer items-start gap-2.5 text-[12.5px] leading-relaxed text-ink-2">
            <input
              type="checkbox"
              checked={akceptacja}
              onChange={(e) => setAkceptacja(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--ink)]"
            />
            <span>
              Akceptuję{" "}
              <Link href="/regulamin" target="_blank" className="underline underline-offset-2 hover:text-akcent">Regulamin</Link>{" "}
              oraz{" "}
              <Link href="/polityka-prywatnosci" target="_blank" className="underline underline-offset-2 hover:text-akcent">Politykę prywatności</Link>.
            </span>
          </label>

          {blad ? (
            <p className="mb-3 border border-akcent/40 bg-akcent/5 px-3 py-2 text-[13px] text-akcent">{blad}</p>
          ) : null}

          <button
            type="submit"
            disabled={wysylka || !akceptacja || ZAMOWIENIA_WYLACZONE}
            className="block w-full rounded-lg bg-ink px-8 py-4 text-center text-[13px] font-semibold tracking-wide text-tlo transition-colors hover:bg-akcent disabled:cursor-not-allowed disabled:opacity-60"
          >
            {ZAMOWIENIA_WYLACZONE ? "ZAMÓWIENIA WYŁĄCZONE" : wysylka ? "PRZETWARZANIE…" : platnosciOnline ? "ZAMAWIAM I PŁACĘ" : "ZAMAWIAM"}
          </button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-[12px] text-ink-2">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="5" y="11" width="14" height="10" rx="1" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
            {platnosciOnline ? "Bezpieczna płatność — BLIK, Przelewy24, karta" : "Bezpieczne zamówienie"}
          </p>
          {!platnosciOnline ? (
            <p className="mt-2 text-center text-[11px] leading-relaxed text-ink-2">
              Płatności online nie są jeszcze aktywne — zamówienie zostanie zapisane, a my skontaktujemy się w sprawie zapłaty.
            </p>
          ) : null}
        </aside>
      </form>

      <Stopka />
    </div>
  );
}
