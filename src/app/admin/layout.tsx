"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { StrazAdmina, wyloguj } from "@/components/StrazAdmina";

const LINKI = [
  { href: "/admin", label: "Pulpit" },
  { href: "/admin/produkty", label: "Produkty" },
  { href: "/admin/zamowienia", label: "Zamówienia" },
  { href: "/admin/statystyki", label: "Statystyki" },
  { href: "/admin/opinie", label: "Opinie" },
  { href: "/admin/kody", label: "Kody rabatowe" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const sciezka = usePathname();
  return (
    <StrazAdmina>
      <div className="min-h-screen bg-tlo">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-linia px-6 py-4 md:px-10">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="text-[18px] font-bold tracking-tight no-underline text-ink">
              bobas-shopping <span className="text-ink-2">· admin</span>
            </Link>
            <nav className="flex items-center gap-5">
              {LINKI.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`text-[14px] no-underline transition-colors hover:text-akcent ${
                    sciezka === l.href ? "font-semibold text-ink" : "text-ink-2"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4 text-[13px]">
            <Link href="/" className="text-ink-2 no-underline hover:text-akcent">
              Zobacz sklep →
            </Link>
            <button onClick={wyloguj} className="text-ink-2 underline underline-offset-2 hover:text-akcent">
              Wyloguj
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-content px-6 py-8 md:px-10">{children}</main>
      </div>
    </StrazAdmina>
  );
}
