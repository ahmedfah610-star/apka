"use client";

import Link from "next/link";
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

  return (
    <nav className="border-t border-linia" aria-label="Kategorie">
      <div className="mx-auto flex max-w-content gap-6 overflow-x-auto px-4 sm:px-6 md:gap-7 md:px-10 [&::-webkit-scrollbar]:hidden">
        {ZAKLADKI.map((z) => {
          const on = z.href === "/produkty" ? aktualny === "/produkty" : aktualny.startsWith(z.href);
          return (
            <Link
              key={z.href}
              href={z.href}
              className={`-mb-px shrink-0 whitespace-nowrap border-b-[3px] py-3 text-[14px] font-bold no-underline transition-colors ${
                on
                  ? "border-akcent text-akcent"
                  : `border-transparent ${z.cena ? "text-cena" : "text-ink"} hover:text-akcent`
              }`}
            >
              {z.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
