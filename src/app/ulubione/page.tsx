"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Nawigacja } from "@/components/Nawigacja";
import { Stopka } from "@/components/Stopka";
import { KartaProduktu } from "@/components/KartaProduktu";
import { useUlubione } from "@/components/UlubioneContext";
import { PRODUKTY, type Produkt } from "@/data/produkty";
import { pobierzKatalog } from "@/lib/katalogKlient";

export default function StronaUlubionych() {
  const { ids } = useUlubione();
  const [katalog, setKatalog] = useState<Produkt[]>(PRODUKTY);

  useEffect(() => {
    pobierzKatalog().then((k) => {
      if (k) {
        setKatalog(k);
      }
    });
  }, []);

  const produkty = useMemo(() => {
    const mapa = new Map(katalog.map((p) => [p.id, p]));
    return ids.map((id) => mapa.get(id)).filter((p): p is Produkt => !!p);
  }, [ids, katalog]);

  return (
    <div className="overflow-x-clip">
      <Nawigacja />

      <div className="mx-auto max-w-content px-4 py-10 sm:px-6 md:px-12">
        <h1 className="mb-2 text-[28px] font-extrabold tracking-tight md:text-[34px]">Ulubione</h1>
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
                <path d="M12 20.5C12 20.5 3 14.8 3 8.9 3 6.2 5.1 4.2 7.6 4.2c1.8 0 3.5 1.1 4.4 2.7.9-1.6 2.6-2.7 4.4-2.7 2.5 0 4.6 2 4.6 4.7 0 5.9-9 11.6-9 11.6Z" />
              </svg>
            </div>
            <p className="mb-2 text-[18px] font-semibold">Brak ulubionych</p>
            <p className="mb-6 text-sm text-ink-2">Klikaj serduszko przy produktach, aby zapisać je na później.</p>
            <Link href="/produkty" className="rounded-lg inline-block bg-ink px-8 py-3.5 text-[14.5px] font-bold text-white no-underline transition-colors hover:bg-akcent">
              Przeglądaj produkty
            </Link>
          </div>
        )}
      </div>

      <Stopka />
    </div>
  );
}
