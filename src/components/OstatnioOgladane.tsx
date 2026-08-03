"use client";

import { useEffect, useMemo, useState } from "react";
import { KartaProduktu } from "@/components/KartaProduktu";
import { PRODUKTY, type Produkt } from "@/data/produkty";

const KLUCZ = "fasolka-ostatnio";
const LIMIT = 12;

export function OstatnioOgladane({ aktualnyId }: { aktualnyId: string }) {
  const [ids, setIds] = useState<string[]>([]);
  const [katalog, setKatalog] = useState<Produkt[]>(PRODUKTY);

  // Zapis bieżącego produktu na górę listy i odczyt reszty.
  useEffect(() => {
    let poprzednie: string[] = [];
    try {
      poprzednie = JSON.parse(localStorage.getItem(KLUCZ) || "[]");
    } catch {
      /* ignoruj */
    }
    setIds(poprzednie.filter((id) => id !== aktualnyId));
    const nowe = [aktualnyId, ...poprzednie.filter((id) => id !== aktualnyId)].slice(0, LIMIT);
    try {
      localStorage.setItem(KLUCZ, JSON.stringify(nowe));
    } catch {
      /* ignoruj */
    }
  }, [aktualnyId]);

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
    return ids.map((id) => mapa.get(id)).filter((p): p is Produkt => !!p).slice(0, 4);
  }, [ids, katalog]);

  if (produkty.length === 0) return null;

  return (
    <section className="px-6 pb-20 md:px-12">
      <div className="mx-auto max-w-content">
        <h2 className="mb-8 text-[22px] font-bold tracking-tight">Ostatnio oglądane</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
          {produkty.map((p) => (
            <KartaProduktu key={p.id} produkt={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
