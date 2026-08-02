"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Nawigacja } from "@/components/Nawigacja";
import { Stopka } from "@/components/Stopka";
import { WidokProduktu } from "@/components/WidokProduktu";
import { katalog } from "@/lib/sklepStore";
import type { Produkt } from "@/data/produkty";

/** Wariant strony produktu dla pozycji dodanych w panelu (localStorage). */
export function ProduktLokalny({ id }: { id: string }) {
  const [stan, setStan] = useState<{ lista: Produkt[]; p?: Produkt } | null>(null);

  useEffect(() => {
    const lista = katalog();
    setStan({ lista, p: lista.find((x) => x.id === id) });
  }, [id]);

  if (!stan) return null;

  if (!stan.p) {
    return (
      <div className="overflow-x-hidden">
        <Nawigacja aktywna="produkty" />
        <div className="mx-auto max-w-content px-6 py-24 text-center md:px-12">
          <p className="mb-2 text-[17px] font-semibold">Nie znaleziono produktu</p>
          <p className="mb-6 text-sm text-ink-2">Ten produkt nie istnieje lub został usunięty.</p>
          <Link href="/produkty" className="inline-block bg-ink px-8 py-3.5 text-[13px] font-semibold tracking-wide text-tlo no-underline hover:bg-akcent">
            WRÓĆ DO PRODUKTÓW
          </Link>
        </div>
        <Stopka />
      </div>
    );
  }

  return <WidokProduktu produkt={stan.p} wszystkie={stan.lista} />;
}
