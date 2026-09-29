"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Pasek kategorii pod nagłówkiem (każda strona). Aktywna zakładka z adresu.
const ZAKLADKI: { label: string; href: string; cena?: boolean }[] = [
  { label: "Wszystko", href: "/produkty" },
  { label: "Niemowlęta", href: "/produkty?kategoria=niemowleta" },
  { label: "Dziewczynki", href: "/produkty?kategoria=dziewczynki" },
  { label: "Chłopcy", href: "/produkty?kategoria=chlopcy" },
  { label: "Męskie", href: "/produkty?kategoria=dorosli" },
  { label: "Body", href: "/kolekcje/body-niemowlece" },
  { label: "Komplety", href: "/kolekcje/komplety-dzieciece" },
  { label: "Dresy", href: "/kolekcje/dresy-dzieciece" },
  { label: "Nowości", href: "/produkty?sort=nowosci" },
  { label: "Do 20 zł", href: "/produkty?cena=do-20", cena: true },
  { label: "Blog", href: "/blog" },
];

export function PasekKategorii() {
  const sciezka = usePathname() ?? "";
  const params = useSearchParams();
  const aktualny = sciezka + (params?.toString() ? `?${params.toString()}` : "");
  const pasek = useRef<HTMLDivElement>(null);

  // Na telefonie aktywna zakładka bywa poza ekranem — przewiń pasek (tylko w poziomie).
  useEffect(() => {
    const el = pasek.current;
    const on = el?.querySelector<HTMLElement>("[data-aktywna]");
    if (!el || !on || el.scrollWidth <= el.clientWidth) return;
    el.scrollLeft = on.offsetLeft - (el.clientWidth - on.offsetWidth) / 2;
  }, [aktualny]);

  return (
    <nav className="relative border-linia bg-white md:border-t" aria-label="Kategorie">
      <div ref={pasek} className="mx-auto flex max-w-content gap-5 overflow-x-auto px-4 sm:px-6 md:gap-7 md:px-10 [&::-webkit-scrollbar]:hidden">
        {ZAKLADKI.map((z) => {
          const on = z.href === "/produkty" ? aktualny === "/produkty" : aktualny.startsWith(z.href);
          return (
            <Link
              key={z.href}
              href={z.href}
              data-aktywna={on ? "" : undefined}
              className={`-mb-px shrink-0 whitespace-nowrap border-b-[3px] py-2.5 text-[13.5px] font-bold no-underline transition-colors md:py-3 md:text-[14px] ${
                on
                  ? "border-akcent text-akcent"
                  : `border-transparent ${z.cena ? "text-cena" : "text-ink"} hover:text-akcent`
              }`}
            >
              {z.label}
            </Link>
          );
        })}
        <span className="w-4 shrink-0 md:hidden" aria-hidden />
      </div>
      {/* Sygnał, że pasek przewija się w bok */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent md:hidden" aria-hidden />
    </nav>
  );
}
