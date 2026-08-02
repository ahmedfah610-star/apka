import Link from "next/link";
import { IkonaKoszyka } from "@/components/IkonaKoszyka";
import { Szukajka } from "@/components/Szukajka";

export function Nawigacja({ aktywna }: { aktywna?: "home" | "produkty" }) {
  return (
    <header className="sticky top-0 z-50 border-b border-linia bg-[oklch(99%_0.003_90/0.92)] backdrop-blur-md">
      <div className="flex items-center justify-between gap-4 px-6 py-4 md:px-12">
        <Link href="/" className="shrink-0 text-inherit no-underline">
          <span className="text-2xl font-bold tracking-tight">Fasolka</span>
        </Link>

        <div className="hidden flex-1 justify-center md:flex">
          <Szukajka />
        </div>

        <div className="flex items-center gap-6">
          <nav className="hidden items-center gap-6 sm:flex">
            <Link
              href="/"
              className={`text-sm tracking-wide no-underline transition-colors hover:text-akcent ${
                aktywna === "home" ? "font-bold text-akcent" : "text-ink"
              }`}
            >
              STRONA GŁÓWNA
            </Link>
            <Link
              href="/produkty"
              className={`text-sm tracking-wide no-underline transition-colors hover:text-akcent ${
                aktywna === "produkty" ? "font-bold text-akcent" : "text-ink"
              }`}
            >
              PRODUKTY
            </Link>
          </nav>
          <IkonaKoszyka />
        </div>
      </div>

      {/* Wyszukiwarka na mobile */}
      <div className="border-t border-linia px-6 py-2.5 md:hidden">
        <Szukajka mobilna />
      </div>
    </header>
  );
}
