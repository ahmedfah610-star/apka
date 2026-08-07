import Link from "next/link";
import { IkonaKoszyka } from "@/components/IkonaKoszyka";
import { IkonaUlubione } from "@/components/IkonaUlubione";
import { IkonaKonta } from "@/components/IkonaKonta";
import { Szukajka } from "@/components/Szukajka";
import { MenuMobilne } from "@/components/MenuMobilne";

export function Nawigacja({ aktywna }: { aktywna?: "home" | "produkty" }) {
  return (
    <header className="sticky top-0 z-50 border-b border-linia bg-[oklch(99%_0.003_90/0.92)] backdrop-blur-md">
      <div className="mx-auto flex max-w-content items-center gap-3 px-4 py-3 sm:px-6 md:gap-6 md:px-12 md:py-3.5">
        {/* Lewa kolumna — logo (równa szerokość jak prawa dla wyśrodkowania) */}
        <div className="flex flex-1 basis-0 items-center gap-1.5">
          <MenuMobilne aktywna={aktywna} />
          <Link href="/" className="flex shrink-0 items-center gap-2 text-inherit no-underline sm:gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/img/logo.png"
              alt="bobas-shopping — sklep z ubrankami dla dzieci"
              className="h-11 w-auto shrink-0 sm:h-14"
            />
            <span className="hidden text-[19px] font-bold tracking-tight sm:inline md:text-[22px]">bobas-shopping</span>
          </Link>
        </div>

        {/* Środek — wyszukiwarka (desktop), wyśrodkowana */}
        <div className="hidden min-w-0 flex-[1.6] justify-center md:flex">
          <Szukajka />
        </div>

        {/* Prawa kolumna — nawigacja + ikony (równa szerokość jak lewa) */}
        <div className="flex flex-1 basis-0 items-center justify-end gap-5 md:gap-7">
          <nav className="hidden items-center gap-5 sm:flex md:gap-6">
            <Link
              href="/"
              className={`whitespace-nowrap text-[13px] tracking-wide no-underline transition-colors hover:text-akcent ${
                aktywna === "home" ? "font-bold text-akcent" : "text-ink"
              }`}
            >
              STRONA GŁÓWNA
            </Link>
            <Link
              href="/produkty"
              className={`whitespace-nowrap text-[13px] tracking-wide no-underline transition-colors hover:text-akcent ${
                aktywna === "produkty" ? "font-bold text-akcent" : "text-ink"
              }`}
            >
              PRODUKTY
            </Link>
            <Link
              href="/blog"
              className="whitespace-nowrap text-[13px] tracking-wide text-ink no-underline transition-colors hover:text-akcent"
            >
              BLOG
            </Link>
          </nav>
          <div className="flex items-center gap-4 sm:gap-5">
            <IkonaKonta />
            <IkonaUlubione />
            <IkonaKoszyka />
          </div>
        </div>
      </div>

      {/* Wyszukiwarka na mobile */}
      <div className="border-t border-linia px-4 py-2.5 sm:px-6 md:hidden">
        <Szukajka mobilna />
      </div>
    </header>
  );
}
