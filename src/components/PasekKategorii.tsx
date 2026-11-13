"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { sezonZimowy, SLUG_ZIMA } from "@/lib/sezon";
import { MESKIE_PODKATEGORIE } from "@/data/meskiePodkategorie";

// Pasek kategorii pod nagłówkiem (każda strona). Aktywna zakładka z adresu.
// „Męskie" ma podkategorie (swetry, bluzy, dresy): na komputerze rozwijane menu,
// na telefonie — osobne zakładki zaraz za „Męskie" (pasek i tak przewija się w bok).
type Zakladka = { label: string; href: string; cena?: boolean; tylkoTelefon?: boolean };
// Zimą (paź–lut) zaraz po „Wszystko" — wyróżniona jak „Do 20 zł".
const ZIMA: Zakladka = { label: "❄ Na zimę", href: `/kolekcje/${SLUG_ZIMA}`, cena: true };
const MESKIE_HREF = "/produkty?kategoria=dorosli";
const ZAKLADKI: Zakladka[] = [
  { label: "Wszystko", href: "/produkty" },
  { label: "Niemowlęta", href: "/produkty?kategoria=niemowleta" },
  { label: "Dziewczynki", href: "/produkty?kategoria=dziewczynki" },
  { label: "Chłopcy", href: "/produkty?kategoria=chlopcy" },
  { label: "Męskie", href: MESKIE_HREF },
  ...MESKIE_PODKATEGORIE.filter((m) => m.wPasku).map((m) => ({ label: m.label, href: m.href, tylkoTelefon: true })),
  { label: "Body", href: "/kolekcje/body-niemowlece" },
  { label: "Komplety", href: "/kolekcje/komplety-dzieciece" },
  { label: "Dresy", href: "/kolekcje/dresy-dzieciece" },
  { label: "Nowości", href: "/produkty?sort=nowosci" },
  { label: "Do 20 zł", href: "/produkty?cena=do-20", cena: true },
  { label: "Blog", href: "/blog" },
];

const klasaZakladki = (on: boolean, cena?: boolean) =>
  `-mb-px shrink-0 whitespace-nowrap border-b-[3px] py-2.5 text-[13.5px] font-bold no-underline transition-colors md:py-3 md:text-[14px] ${
    on ? "border-akcent text-akcent" : `border-transparent ${cena ? "text-cena" : "text-ink"} hover:text-akcent`
  }`;

/** „Męskie ▾" na komputerze: link do całego działu + menu z podkategoriami (najechanie lub kliknięcie strzałki). */
function MeskieZMenu({ aktualny }: { aktualny: string }) {
  const [otwarte, setOtwarte] = useState(false);
  const [poz, setPoz] = useState<{ top: number; left: number } | null>(null);
  const kotwica = useRef<HTMLDivElement>(null);
  const zamykanie = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wDziale = aktualny.startsWith(MESKIE_HREF) || MESKIE_PODKATEGORIE.some((m) => aktualny.startsWith(m.href));

  const otworz = () => {
    if (zamykanie.current) clearTimeout(zamykanie.current);
    const r = kotwica.current?.getBoundingClientRect();
    if (r) setPoz({ top: r.bottom, left: r.left });
    setOtwarte(true);
  };
  const zamknijZaChwile = () => {
    if (zamykanie.current) clearTimeout(zamykanie.current);
    zamykanie.current = setTimeout(() => setOtwarte(false), 150);
  };

  useEffect(() => setOtwarte(false), [aktualny]);
  useEffect(() => {
    if (!otwarte) return;
    const zamknij = () => setOtwarte(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && zamknij();
    window.addEventListener("scroll", zamknij, { passive: true });
    window.addEventListener("resize", zamknij);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("scroll", zamknij);
      window.removeEventListener("resize", zamknij);
      window.removeEventListener("keydown", esc);
    };
  }, [otwarte]);

  return (
    <div ref={kotwica} className="flex shrink-0 items-stretch" onMouseEnter={otworz} onMouseLeave={zamknijZaChwile}>
      <Link href={MESKIE_HREF} data-aktywna={wDziale ? "" : undefined} className={klasaZakladki(wDziale)}>
        Męskie
      </Link>
      <button
        type="button"
        aria-label="Podkategorie męskie"
        aria-expanded={otwarte}
        // Myszką menu otwiera się już po najechaniu — kliknięcie strzałki go nie zamyka (inaczej szybkie
        // ponowne kliknięcie zaznaczało tekst menu). Dotykiem (tablet) strzałka otwiera i zamyka.
        onPointerDown={(e) => {
          if (e.pointerType === "mouse") e.preventDefault();
        }}
        onClick={(e) => {
          const mysz = (e.nativeEvent as PointerEvent).pointerType === "mouse";
          if (otwarte && !mysz) setOtwarte(false);
          else otworz();
        }}
        className={`-mb-px select-none border-b-[3px] pl-1 ${wDziale ? "border-akcent text-akcent" : "border-transparent text-ink-2 hover:text-akcent"}`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden className={`transition-transform ${otwarte ? "rotate-180" : ""}`}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {otwarte && poz ? (
        // fixed — pasek ma przewijanie w poziomie, które ucięłoby zwykłe menu pod spodem.
        <div
          role="menu"
          style={{ top: poz.top, left: Math.max(8, poz.left - 12) }}
          className="fixed z-[80] w-[250px] select-none rounded-xl border border-linia bg-white p-1.5 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.25)]"
          onMouseEnter={otworz}
          onMouseLeave={zamknijZaChwile}
        >
          {[{ label: "Wszystkie męskie", href: MESKIE_HREF, opis: "swetry, bluzy i dresy" }, ...MESKIE_PODKATEGORIE].map((m) => {
            const on = m.href === MESKIE_HREF ? aktualny === MESKIE_HREF : aktualny.startsWith(m.href);
            return (
              <Link
                key={m.href}
                href={m.href}
                role="menuitem"
                className={`block rounded-lg px-3 py-2 no-underline hover:bg-szary ${on ? "text-akcent" : "text-ink"}`}
              >
                <span className="block text-[14px] font-bold">{m.label}</span>
                {m.opis ? <span className="block text-[12px] text-ink-2">{m.opis}</span> : null}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function PasekKategorii() {
  const sciezka = usePathname() ?? "";
  const params = useSearchParams();
  const aktualny = sciezka + (params?.toString() ? `?${params.toString()}` : "");
  const pasek = useRef<HTMLDivElement>(null);

  // Na telefonie aktywna zakładka bywa poza ekranem — przewiń pasek (tylko w poziomie).
  useEffect(() => {
    const el = pasek.current;
    const on = [...(el?.querySelectorAll<HTMLElement>("[data-aktywna]") ?? [])].find((x) => x.offsetParent);
    if (!el || !on || el.scrollWidth <= el.clientWidth) return;
    el.scrollLeft = on.offsetLeft - (el.clientWidth - on.offsetWidth) / 2;
  }, [aktualny]);

  return (
    <nav className="relative border-linia bg-white md:border-t" aria-label="Kategorie">
      <div ref={pasek} className="mx-auto flex max-w-content gap-5 overflow-x-auto px-4 sm:px-6 md:gap-7 md:px-10 [&::-webkit-scrollbar]:hidden">
        {(sezonZimowy() ? [ZAKLADKI[0], ZIMA, ...ZAKLADKI.slice(1)] : ZAKLADKI).map((z) => {
          const on = z.href === "/produkty" ? aktualny === "/produkty" : aktualny.startsWith(z.href);
          const link = (
            <Link
              key={z.href}
              href={z.href}
              data-aktywna={on ? "" : undefined}
              className={`${klasaZakladki(on, z.cena)} ${z.tylkoTelefon ? "md:hidden" : ""} ${z.href === MESKIE_HREF ? "md:hidden" : ""}`}
            >
              {z.label}
            </Link>
          );
          if (z.href !== MESKIE_HREF) return link;
          return (
            <span key={z.href} className="contents">
              {link}
              <span className="hidden md:contents">
                <MeskieZMenu aktualny={aktualny} />
              </span>
            </span>
          );
        })}
        <span className="w-4 shrink-0 md:hidden" aria-hidden />
      </div>
      {/* Sygnał, że pasek przewija się w bok */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent md:hidden" aria-hidden />
    </nav>
  );
}
