"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ZAKLADKI = [
  { href: "/konto", label: "Przegląd" },
  { href: "/konto/zamowienia", label: "Zamówienia" },
  { href: "/ulubione", label: "Ulubione" },
  { href: "/kontakt", label: "Pomoc" },
];

// Poziomy pasek zakładek konta (styl jak w dużych sklepach: Przegląd / Zamówienia …).
// Podświetla aktywną stronę na podstawie ścieżki.
export function ZakladkiKonta() {
  const sciezka = usePathname();
  return (
    <nav className="-mx-5 mb-7 border-b border-linia px-5 sm:-mx-6 sm:px-6">
      <ul className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ZAKLADKI.map((z) => {
          const aktywna = z.href === "/konto" ? sciezka === "/konto" : sciezka.startsWith(z.href);
          return (
            <li key={z.href} className="shrink-0">
              <Link
                href={z.href}
                className={`relative -mb-px block whitespace-nowrap px-4 py-3.5 text-[14.5px] no-underline transition-colors ${
                  aktywna ? "font-bold text-ink" : "font-medium text-ink-2 hover:text-ink"
                }`}
              >
                {z.label}
                {aktywna ? <span className="absolute inset-x-3 -bottom-px h-[2.5px] rounded-full bg-ink" /> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
