"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Nawigacja } from "@/components/Nawigacja";
import { Stopka } from "@/components/Stopka";
import { KartaProduktu } from "@/components/KartaProduktu";
import { useUlubione } from "@/components/UlubioneContext";
import { PRODUKTY, type Produkt } from "@/data/produkty";

export default function StronaUlubionych() {
  const { ids } = useUlubione();
  const [katalog, setKatalog] = useState<Produkt[]>(PRODUKTY);

  useEffect(() => {
    fetch("/api/katalog")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.items) && d.items.length) setKatalog(d.items);
      })
      .catch(() => {});
  }, []);

  const produkty = useMemo(() => {
    const mapa = new Map(katalog.map((p) => [p.id, p]));
    return ids.map((id) => mapa.get(id)).filter((p): p is Produkt => !!p);
  }, [ids, katalog]);

  return (
    <div className="overflow-x-hidden">
      <Nawigacja />

      <div className="mx-auto max-w-content px-4 py-10 sm:px-6 md:px-12">
        <h1 className="mb-2 text-[28px] font-bold tracking-tight md:text-[34px]">Ulubione</h1>
        <p className="mb-8 text-[15px] text-ink-2">
          {produkty.length > 0
            ? `${produkty.length} ${produkty.length === 1 ? "produkt" : "produktów"} zapisanych`
            : "Twoja lista jest pusta"}
        </p>

        {produkty.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
            {produkty.map((p) => (
              <KartaProduktu key={p.id} produkt={p} />
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-md border border-linia bg-white px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-szary">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-2">
                <path d="M12 21s-7.5-4.9-9.7-9.2C.9 8.9 2.3 5.5 5.5 5.1c1.9-.2 3.4.8 4.5 2.3 1.1-1.5 2.6-2.5 4.5-2.3 3.2.4 4.6 3.8 3.2 6.7C19.5 16.1 12 21 12 21Z" />
              </svg>
            </div>
            <p className="mb-2 text-[18px] font-semibold">Brak ulubionych</p>
            <p className="mb-6 text-sm text-ink-2">Klikaj serduszko przy produktach, aby zapisać je na później.</p>
            <Link href="/produkty" className="inline-block bg-ink px-8 py-3.5 text-[13px] font-semibold tracking-wide text-tlo no-underline transition-colors hover:bg-akcent">
              PRZEGLĄDAJ PRODUKTY
            </Link>
          </div>
        )}
      </div>

      <Stopka />
    </div>
  );
}
