"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthContext";

// Boczne menu na telefonie: najpierw zakupy (działy, rodzaje, okazje), potem pomoc.
const SEKCJE: { tytul: string; linki: { href: string; label: string; cena?: boolean }[] }[] = [
  {
    tytul: "Działy",
    linki: [
      { href: "/produkty", label: "Wszystkie produkty" },
      { href: "/produkty?kategoria=niemowleta", label: "Niemowlęta" },
      { href: "/produkty?kategoria=dziewczynki", label: "Dziewczynki" },
      { href: "/produkty?kategoria=chlopcy", label: "Chłopcy" },
      { href: "/produkty?kategoria=dorosli", label: "Męskie" },
    ],
  },
  {
    tytul: "Rodzaje",
    linki: [
      { href: "/kolekcje/body-niemowlece", label: "Body" },
      { href: "/kolekcje/pajacyki-i-spiochy-niemowlece", label: "Pajacyki" },
      { href: "/kolekcje/komplety-dzieciece", label: "Komplety" },
      { href: "/kolekcje/dresy-dzieciece", label: "Dresy" },
      { href: "/kolekcje/spodnie-dla-dziewczynki", label: "Legginsy" },
      { href: "/kolekcje/sukienki-dla-dziewczynki", label: "Sukienki" },
      { href: "/kolekcje/czapki-dzieciece", label: "Czapki" },
    ],
  },
  {
    tytul: "Okazje",
    linki: [
      { href: "/produkty?sort=nowosci", label: "Nowości" },
      { href: "/produkty?cena=do-20", label: "Do 20 zł", cena: true },
    ],
  },
  {
    tytul: "Pomoc",
    linki: [
      { href: "/rozmiary", label: "Tabela rozmiarów" },
      { href: "/dostawa-i-zwroty", label: "Dostawa i zwroty" },
      { href: "/status-zamowienia", label: "Status zamówienia" },
      { href: "/kontakt", label: "Kontakt" },
      { href: "/blog", label: "Blog" },
    ],
  },
];

export function MenuMobilne({ aktywna: _aktywna }: { aktywna?: "home" | "produkty" }) {
  const [otwarte, setOtwarte] = useState(false);
  const { user, wlaczone } = useAuth();
  const sciezka = usePathname();

  // Zamknij po przejściu na inną stronę; zablokuj przewijanie strony pod menu.
  useEffect(() => setOtwarte(false), [sciezka]);
  useEffect(() => {
    if (!otwarte) return;
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
          <nav className="absolute inset-y-0 left-0 flex w-[86%] max-w-[340px] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-linia px-4 py-2.5">
              <Link href="/" onClick={zamknij} className="flex items-center gap-2 text-inherit no-underline">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/img/logo.png" alt="" className="h-9 w-auto" />
                <span className="text-[16px] font-extrabold tracking-tight">bobas-shopping</span>
              </Link>
              <button onClick={zamknij} aria-label="Zamknij menu" className="-mr-1.5 flex h-10 w-10 items-center justify-center text-ink">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-6">
              {SEKCJE.map((s) => (
                <div key={s.tytul} className="border-b border-linia py-3 last:border-b-0">
                  <p className="pb-1 text-[11.5px] font-bold uppercase tracking-wider text-ink-2">{s.tytul}</p>
                  <div className={s.tytul === "Rodzaje" ? "grid grid-cols-2 gap-x-3" : "flex flex-col"}>
                    {s.linki.map((l) => (
                      <Link
                        key={l.href}
                        href={l.href}
                        onClick={zamknij}
                        className={`py-2.5 text-[15px] font-semibold no-underline ${l.cena ? "text-cena" : "text-ink"}`}
                      >
                        {l.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}

              {wlaczone ? (
                <Link
                  href={user ? "/konto" : "/konto/logowanie"}
                  onClick={zamknij}
                  className="mt-3 block rounded-lg border border-linia-2 px-4 py-3 text-center text-[14.5px] font-bold text-ink no-underline"
                >
                  {user ? "Moje konto" : "Zaloguj się / Załóż konto"}
                </Link>
              ) : null}

              <a href="tel:+48793878222" className="mt-3 block rounded-lg bg-akcent-2 px-4 py-3 text-[14px] text-ink no-underline">
                <span className="block text-[12px] text-ink-2">Pytanie o rozmiar? Zadzwoń</span>
                <span className="font-bold">+48 793 878 222</span>
              </a>
            </div>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
