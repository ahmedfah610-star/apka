"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { pobierzKatalog } from "@/lib/katalogKlient";
import { zdjecie } from "@/lib/zdjecia";
import { sezonZimowy, czyCieply, SLUG_ZIMA } from "@/lib/sezon";
import { promocjaTrwa, type Promocja } from "@/lib/promocja";
import type { Kategoria, Produkt } from "@/data/produkty";

// Boczne menu na telefonie: kafelki działów ze zdjęciami, rodzaje jako przyciski,
// okazje (zimą „Na zimę"), kod promocyjny, a na końcu krótka pomoc i kontakt.
const DZIALY: { kat: Kategoria; label: string }[] = [
  { kat: "niemowleta", label: "Niemowlęta" },
  { kat: "dziewczynki", label: "Dziewczynki" },
  { kat: "chlopcy", label: "Chłopcy" },
  { kat: "dorosli", label: "Męskie" },
];

const RODZAJE = [
  { href: "/kolekcje/body-niemowlece", label: "Body" },
  { href: "/kolekcje/pajacyki-i-spiochy-niemowlece", label: "Pajacyki" },
  { href: "/kolekcje/komplety-dzieciece", label: "Komplety" },
  { href: "/kolekcje/dresy-dzieciece", label: "Dresy" },
  { href: "/kolekcje/spodnie-dla-dziewczynki", label: "Legginsy" },
  { href: "/kolekcje/sukienki-dla-dziewczynki", label: "Sukienki" },
  { href: "/kolekcje/czapki-dzieciece", label: "Czapki" },
];

const POMOC = [
  { href: "/rozmiary", label: "Tabela rozmiarów" },
  { href: "/dostawa-i-zwroty", label: "Dostawa i zwroty" },
  { href: "/status-zamowienia", label: "Status zamówienia" },
  { href: "/kontakt", label: "Kontakt" },
  { href: "/blog", label: "Blog" },
  { href: "/faq", label: "Pytania i odpowiedzi" },
];

// Okładka działu: najnowszy produkt na stanie ze zdjęciem (zimą — ciepły), bez powtórek zdjęć.
function okladki(katalog: Produkt[], zima: boolean): Partial<Record<Kategoria, string>> {
  const wynik: Partial<Record<Kategoria, string>> = {};
  const zajete = new Set<string>();
  for (const { kat } of DZIALY) {
    const lista = [...katalog].reverse().filter((p) => p.kategoria === kat && p.zdjecie && (p.stan ?? 1) > 0 && !zajete.has(p.zdjecie));
    const p = (zima ? lista.find((x) => czyCieply(x) && (x.zdjecia?.length ?? 0) >= 2) : undefined) ?? lista.find((x) => (x.zdjecia?.length ?? 0) >= 2) ?? lista[0];
    if (p?.zdjecie) {
      zajete.add(p.zdjecie);
      wynik[kat] = zdjecie(p.zdjecie, "s360");
    }
  }
  return wynik;
}

function Strzalka() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function MenuMobilne({ aktywna: _aktywna }: { aktywna?: "home" | "produkty" }) {
  const [otwarte, setOtwarte] = useState(false);
  const [foty, setFoty] = useState<Partial<Record<Kategoria, string>>>({});
  const [promo, setPromo] = useState<Promocja | null>(null);
  const [skopiowano, setSkopiowano] = useState(false);
  const { user, wlaczone } = useAuth();
  const sciezka = usePathname();
  const zima = sezonZimowy();

  // Zamknij po przejściu na inną stronę; zablokuj przewijanie strony pod menu.
  useEffect(() => setOtwarte(false), [sciezka]);
  useEffect(() => {
    if (!otwarte) return;
    setPromo(promocjaTrwa());
    // Zdjęcia działów dopiero przy otwarciu (katalog z pamięci przeglądarki / CDN).
    if (!Object.keys(foty).length) void pobierzKatalog().then((k) => k && setFoty(okladki(k, zima)));
    const poprzedni = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOtwarte(false);
    window.addEventListener("keydown", esc);
    return () => {
      document.body.style.overflow = poprzedni;
      window.removeEventListener("keydown", esc);
    };
  }, [otwarte]); // eslint-disable-line react-hooks/exhaustive-deps

  const zamknij = () => setOtwarte(false);
  const kopiuj = async (kod: string) => {
    try {
      await navigator.clipboard.writeText(kod);
      setSkopiowano(true);
      setTimeout(() => setSkopiowano(false), 2000);
    } catch {
      /* ignoruj */
    }
  };

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOtwarte(true)}
        aria-label="Otwórz menu"
        aria-expanded={otwarte}
        className="-ml-1.5 flex h-10 w-10 items-center justify-center text-ink"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      {otwarte ? (
        <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-black/40" onClick={zamknij} />
          <nav className="absolute inset-y-0 left-0 flex w-[88%] max-w-[360px] flex-col bg-strona shadow-2xl">
            <div className="flex items-center justify-between border-b border-linia bg-white px-4 py-2">
              <Link href="/" onClick={zamknij} className="flex items-center gap-2 text-inherit no-underline">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/img/logo.png" alt="" className="h-8 w-auto" />
                <span className="text-[15.5px] font-extrabold tracking-tight">bobas-shopping</span>
              </Link>
              <button onClick={zamknij} aria-label="Zamknij menu" className="-mr-1.5 flex h-10 w-10 items-center justify-center text-ink">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 py-3">
              {/* Kod promocyjny */}
              {promo ? (
                <div className="flex items-center justify-between gap-2 rounded-xl bg-cena px-3.5 py-2.5 text-white">
                  <div className="min-w-0 text-[13px] font-semibold leading-snug">
                    <span className="block text-[15px] font-extrabold">−{promo.procent}% z kodem {promo.kod}</span>
                    na produkty od {promo.minKoszyk} zł
                  </div>
                  <button
                    onClick={() => void kopiuj(promo.kod)}
                    className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-[12.5px] font-extrabold text-cena"
                  >
                    {skopiowano ? "Skopiowano ✓" : "Kopiuj"}
                  </button>
                </div>
              ) : null}

              {/* Działy — kafelki ze zdjęciami */}
              <div className="grid grid-cols-2 gap-2">
                {DZIALY.map((d) => (
                  <Link
                    key={d.kat}
                    href={`/produkty?kategoria=${d.kat}`}
                    onClick={zamknij}
                    className="flex flex-col overflow-hidden rounded-xl border border-linia bg-white text-ink no-underline active:scale-[.98]"
                  >
                    <span className="flex aspect-[3/2] items-center justify-center bg-white p-1.5">
                      {foty[d.kat] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={foty[d.kat]} alt="" className="h-full w-full object-contain" />
                      ) : (
                        <span className="h-full w-full rounded-lg bg-szary" />
                      )}
                    </span>
                    <span className="border-t border-linia px-2.5 py-2 text-[14px] font-bold">{d.label}</span>
                  </Link>
                ))}
              </div>
              <Link
                href="/produkty"
                onClick={zamknij}
                className="flex items-center justify-between rounded-xl border border-linia bg-white px-3.5 py-3 text-[14.5px] font-bold text-ink no-underline"
              >
                Wszystkie produkty <Strzalka />
              </Link>

              {/* Okazje */}
              <div className="grid grid-cols-2 gap-2">
                {zima ? (
                  <Link
                    href={`/kolekcje/${SLUG_ZIMA}`}
                    onClick={zamknij}
                    className="col-span-2 flex items-center justify-between rounded-xl bg-akcent px-3.5 py-3 text-white no-underline"
                  >
                    <span>
                      <span className="block text-[15px] font-extrabold">❄ Ciepło na zimę</span>
                      <span className="text-[12.5px] text-white/85">Sweterki, ocieplane spodnie, czapki</span>
                    </span>
                    <Strzalka />
                  </Link>
                ) : null}
                <Link href="/produkty?sort=nowosci" onClick={zamknij} className="rounded-xl border border-linia bg-white px-3.5 py-3 text-[14px] font-bold text-ink no-underline">
                  ✨ Nowości
                </Link>
                <Link href="/produkty?cena=do-20" onClick={zamknij} className="rounded-xl border border-linia bg-white px-3.5 py-3 text-[14px] font-bold text-cena no-underline">
                  Do 20 zł
                </Link>
              </div>

              {/* Rodzaje — przyciski */}
              <div className="rounded-xl border border-linia bg-white p-3">
                <p className="mb-2 text-[11.5px] font-bold uppercase tracking-wider text-ink-2">Rodzaje</p>
                <div className="flex flex-wrap gap-1.5">
                  {RODZAJE.map((r) => (
                    <Link
                      key={r.href}
                      href={r.href}
                      onClick={zamknij}
                      className="rounded-full border border-linia-2 px-3.5 py-1.5 text-[13.5px] font-semibold text-ink no-underline active:bg-szary"
                    >
                      {r.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Konto i kontakt */}
              {wlaczone ? (
                <Link
                  href={user ? "/konto" : "/konto/logowanie"}
                  onClick={zamknij}
                  className="flex items-center justify-between rounded-xl bg-ink px-3.5 py-3 text-[14.5px] font-bold text-white no-underline"
                >
                  {user ? "Moje konto i zamówienia" : "Zaloguj się / Załóż konto"} <Strzalka />
                </Link>
              ) : null}

              <div className="rounded-xl border border-linia bg-white px-3 py-2">
                <p className="pb-1 pt-1 text-[11.5px] font-bold uppercase tracking-wider text-ink-2">Pomoc</p>
                <div className="grid grid-cols-2 gap-x-2">
                  {POMOC.map((l) => (
                    <Link key={l.href} href={l.href} onClick={zamknij} className="py-2 text-[13.5px] font-medium text-ink no-underline">
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>

              <a href="tel:+48793878222" className="flex items-center gap-3 rounded-xl bg-akcent-2 px-3.5 py-3 text-ink no-underline">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0 text-akcent" aria-hidden>
                  <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
                </svg>
                <span>
                  <span className="block text-[12px] text-ink-2">Pytanie o rozmiar? Zadzwoń</span>
                  <span className="text-[15px] font-bold">+48 793 878 222</span>
                </span>
              </a>
            </div>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
