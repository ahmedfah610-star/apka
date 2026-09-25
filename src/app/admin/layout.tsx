"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { StrazAdmina, wyloguj } from "@/components/StrazAdmina";

// Panel: 5 działów zamiast 10 płaskich zakładek. Działy z kilkoma stronami
// dostają podzakładki nad treścią. Adresy stron się nie zmieniają.
type Dzial = {
  label: string;
  ikona: React.ReactNode;
  strony: { href: string; label: string }[];
};

const ikona = (d: string) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

const DZIALY: Dzial[] = [
  {
    label: "Pulpit",
    ikona: ikona("M3 11.5 12 4l9 7.5M5.5 9.5V20h13V9.5M10 20v-5.5h4V20"),
    strony: [{ href: "/admin", label: "Pulpit" }],
  },
  {
    label: "Zamówienia",
    ikona: ikona("M6 7h12l-1 13H7L6 7Zm3 0V5.5a3 3 0 0 1 6 0V7"),
    strony: [
      { href: "/admin/zamowienia", label: "Zamówienia" },
      { href: "/admin/klienci", label: "Klienci" },
    ],
  },
  {
    label: "Produkty",
    ikona: ikona("M4 8 12 4l8 4v8l-8 4-8-4V8Zm0 0 8 4 8-4M12 12v8"),
    strony: [
      { href: "/admin/produkty", label: "Lista produktów" },
      { href: "/admin/magazyn", label: "Stany magazynowe" },
      { href: "/admin/import", label: "Allegro" },
    ],
  },
  {
    label: "Statystyki",
    ikona: ikona("M4 20V10m6 10V4m6 16v-7m4 7H3"),
    strony: [
      { href: "/admin/statystyki", label: "Sprzedaż" },
      { href: "/admin/analityka", label: "Ruch na stronie" },
    ],
  },
  {
    label: "Marketing",
    ikona: ikona("M4 13V9l11-5v14L4 13Zm0 0 2 7h3l-1.5-6M18 9a3 3 0 0 1 0 4"),
    strony: [
      { href: "/admin/kody", label: "Kody rabatowe" },
      { href: "/admin/opinie", label: "Opinie" },
    ],
  },
];

function aktywnyDzial(sciezka: string): Dzial {
  return DZIALY.find((d) => d.strony.some((s) => s.href !== "/admin" && sciezka.startsWith(s.href))) ?? DZIALY[0];
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const sciezka = usePathname() ?? "/admin";
  const dzial = aktywnyDzial(sciezka);

  return (
    <StrazAdmina>
      <div className="min-h-screen bg-[oklch(97.5%_0.006_80)] md:flex">
        {/* Boczne menu — komputer */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-linia bg-white px-4 py-6 md:flex">
          <Link href="/admin" className="mb-8 px-3 text-[17px] font-bold tracking-tight text-ink no-underline">
            bobas-shopping
            <span className="mt-0.5 block text-[12px] font-medium text-ink-2">Panel sklepu</span>
          </Link>
          <nav className="flex flex-col gap-1">
            {DZIALY.map((d) => {
              const on = d === dzial;
              return (
                <Link
                  key={d.label}
                  href={d.strony[0].href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] no-underline transition-colors ${
                    on ? "bg-ink font-semibold text-tlo" : "text-ink-2 hover:bg-szary hover:text-ink"
                  }`}
                >
                  {d.ikona}
                  {d.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto flex flex-col gap-1 border-t border-linia pt-4 text-[13.5px]">
            <Link href="/" target="_blank" className="rounded-lg px-3 py-2 text-ink-2 no-underline hover:bg-szary hover:text-ink">
              Zobacz sklep ↗
            </Link>
            <button onClick={wyloguj} className="rounded-lg px-3 py-2 text-left text-ink-2 hover:bg-szary hover:text-ink">
              Wyloguj
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1 pb-24 md:pb-0">
          {/* Górny pasek — telefon */}
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-linia bg-white/95 px-4 py-3 backdrop-blur md:hidden">
            <Link href="/admin" className="text-[16px] font-bold tracking-tight text-ink no-underline">
              bobas-shopping <span className="font-medium text-ink-2">· panel</span>
            </Link>
            <div className="flex items-center gap-3 text-[13px]">
              <Link href="/" target="_blank" className="text-ink-2 no-underline">
                Sklep ↗
              </Link>
              <button onClick={wyloguj} className="text-ink-2">
                Wyloguj
              </button>
            </div>
          </header>

          <main className="mx-auto max-w-[1180px] px-4 py-6 md:px-10 md:py-9">
            {/* Podzakładki działu */}
            {dzial.strony.length > 1 ? (
              <div className="-mx-4 mb-7 overflow-x-auto px-4 md:mx-0 md:px-0">
                <div className="inline-flex gap-1 rounded-xl border border-linia bg-white p-1">
                  {dzial.strony.map((s) => {
                    const on = sciezka.startsWith(s.href);
                    return (
                      <Link
                        key={s.href}
                        href={s.href}
                        className={`whitespace-nowrap rounded-lg px-4 py-2 text-[13.5px] no-underline transition-colors ${
                          on ? "bg-ink font-semibold text-tlo" : "text-ink-2 hover:bg-szary hover:text-ink"
                        }`}
                      >
                        {s.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : null}
            {children}
          </main>
        </div>

        {/* Dolny pasek — telefon */}
        <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-linia bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
          {DZIALY.map((d) => {
            const on = d === dzial;
            return (
              <Link
                key={d.label}
                href={d.strony[0].href}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] no-underline ${on ? "font-semibold text-ink" : "text-ink-2"}`}
              >
                <span className={`rounded-full px-3 py-0.5 ${on ? "bg-szary" : ""}`}>{d.ikona}</span>
                {d.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </StrazAdmina>
  );
}
