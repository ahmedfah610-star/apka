"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { sezonZimowy, SLUG_ZIMA } from "@/lib/sezon";
import { promocjaTrwa, zakresPromocji, type Promocja } from "@/lib/promocja";
import type { Kategoria } from "@/data/produkty";

// Boczne menu na telefonie — proste i zwarte: kod promocyjny w jednej linijce, lista działów
// i okazji (zimą „Na zimę" na górze), rodzaje jako małe przyciski, pomoc drobnym drukiem.
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

function Strzalka() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function MenuMobilne({ aktywna: _aktywna }: { aktywna?: "home" | "produkty" }) {
  const [otwarte, setOtwarte] = useState(false);
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
    const poprzedni = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOtwarte(false);
    window.addEventListener("keydown", esc);
    return () => {
      document.body.style.overflow = poprzedni;
      window.removeEventListener("keydown", esc);
    };
  }, [otwarte]);

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
          <nav className="absolute inset-y-0 left-0 flex w-[78%] max-w-[300px] flex-col bg-white shadow-2xl">
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

            <div className="flex-1 overflow-y-auto overscroll-contain pb-4">
              {/* Kod promocyjny — jedna cienka linijka */}
              {promo ? (
                <button
                  onClick={() => void kopiuj(promo.kod)}
                  className="flex w-full items-center justify-between gap-2 bg-[oklch(97%_0.025_55)] px-4 py-2 text-left text-[13px] text-cena"
                >
                  <span>
                    <strong>−{promo.procent}%</strong> {zakresPromocji(promo)} z kodem <strong>{promo.kod}</strong>
                  </span>
                  <span className="shrink-0 text-[12px] font-bold underline">{skopiowano ? "skopiowano ✓" : "kopiuj"}</span>
                </button>
              ) : null}

              <ul className="px-4 pt-1">
                {[
                  ...(zima ? [{ href: `/kolekcje/${SLUG_ZIMA}`, label: "❄ Na zimę", kolor: "text-akcent" }] : []),
                  { href: "/produkty", label: "Wszystkie produkty" },
                  ...DZIALY.map((d) => ({ href: `/produkty?kategoria=${d.kat}`, label: d.label })),
                  { href: "/produkty?sort=nowosci", label: "Nowości" },
                  { href: "/produkty?cena=do-20", label: "Do 20 zł", kolor: "text-cena" },
                ].map((l: { href: string; label: string; kolor?: string }) => (
                  <li key={l.href} className="border-b border-linia">
                    <Link
                      href={l.href}
                      onClick={zamknij}
                      className={`flex items-center justify-between py-2.5 text-[15px] font-semibold no-underline ${l.kolor ?? "text-ink"}`}
                    >
                      {l.label}
                      <span className="text-ink-3/60"><Strzalka /></span>
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Rodzaje — małe przyciski */}
              <div className="flex flex-wrap gap-1.5 px-4 pt-3">
                {RODZAJE.map((r) => (
                  <Link
                    key={r.href}
                    href={r.href}
                    onClick={zamknij}
                    className="rounded-full border border-linia-2 px-3 py-1 text-[13px] font-medium text-ink no-underline active:bg-szary"
                  >
                    {r.label}
                  </Link>
                ))}
              </div>

              {/* Pomoc, konto, telefon — drobnym drukiem */}
              <div className="mt-4 grid grid-cols-2 gap-x-3 border-t border-linia px-4 pt-3 text-[13px]">
                {wlaczone ? (
                  <Link href={user ? "/konto" : "/konto/logowanie"} onClick={zamknij} className="col-span-2 py-1.5 font-bold text-ink no-underline">
                    {user ? "Moje konto i zamówienia" : "Zaloguj się / Załóż konto"}
                  </Link>
                ) : null}
                {POMOC.map((l) => (
                  <Link key={l.href} href={l.href} onClick={zamknij} className="py-1.5 text-ink-2 no-underline">
                    {l.label}
                  </Link>
                ))}
                <a href="tel:+48793878222" className="col-span-2 pt-2 text-ink-2 no-underline">
                  Pytanie o rozmiar? <strong className="text-ink">+48 793 878 222</strong>
                </a>
              </div>
            </div>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
