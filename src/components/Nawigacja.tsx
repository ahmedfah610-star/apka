import Link from "next/link";
import { Suspense } from "react";
import { IkonaKoszyka } from "@/components/IkonaKoszyka";
import { IkonaUlubione } from "@/components/IkonaUlubione";
import { IkonaKonta } from "@/components/IkonaKonta";
import { Szukajka } from "@/components/Szukajka";
import { MenuMobilne } from "@/components/MenuMobilne";
import { PasekKategorii } from "@/components/PasekKategorii";

export function Nawigacja({ aktywna }: { aktywna?: "home" | "produkty" }) {
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-linia bg-white md:border-b-0">
        <div className="mx-auto flex max-w-content items-center gap-3 px-4 py-2 sm:px-6 md:gap-8 md:px-10 md:py-3">
          <div className="flex shrink-0 items-center gap-1.5">
            <MenuMobilne aktywna={aktywna} />
            <Link href="/" className="flex shrink-0 items-center gap-2 text-inherit no-underline sm:gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img/logo.png" alt="bobas-shopping — sklep z ubrankami dla dzieci" className="h-10 w-auto shrink-0 sm:h-12" />
              <span className="hidden text-[20px] font-extrabold tracking-tight sm:inline">bobas-shopping</span>
            </Link>
          </div>

          {/* Wyszukiwarka — główny element nagłówka (komputer) */}
          <div className="hidden min-w-0 flex-1 md:block">
            <div className="max-w-[760px]">
              <Szukajka />
            </div>
          </div>

          <div className="-mr-2 ml-auto flex items-center gap-0.5 sm:gap-1.5">
            <IkonaKonta />
            <IkonaUlubione />
            <IkonaKoszyka />
          </div>
        </div>

        {/* Wyszukiwarka na telefonie */}
        <div className="px-4 pb-2.5 sm:px-6 md:hidden">
          <Szukajka mobilna />
        </div>

        {/* Komputer: kategorie w przyklejonym nagłówku */}
        <div className="hidden md:block">
          <Suspense fallback={<div className="h-[46px] border-t border-linia" />}>
            <PasekKategorii />
          </Suspense>
          <div className="border-b border-linia" />
        </div>
      </header>

      {/* Telefon: kategorie przewijają się ze stroną — przyklejone zostają logo, koszyk i wyszukiwarka */}
      <div className="border-b border-linia md:hidden">
        <Suspense fallback={<div className="h-[42px] bg-white" />}>
          <PasekKategorii />
        </Suspense>
      </div>
    </>
  );
}
