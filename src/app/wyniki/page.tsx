"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useProfil } from "@/components/ProfilProvider";
import { zbudujRanking } from "@/lib/ranking";
import { liczKoszt } from "@/lib/calculator";
import { FOODS } from "@/data/foods";
import { KartaKarmy } from "@/components/KartaKarmy";
import { FILTRY_DOMYSLNE, PanelFiltrow, type Filtry } from "@/components/PanelFiltrow";
import { Przycisk } from "@/components/ui";
import type { DopasowanaKarma, Oferta } from "@/types/domain";

export default function WynikiPage() {
  const router = useRouter();
  const { profil } = useProfil();

  const [stan, setStan] = useState<"ladowanie" | "gotowe">("ladowanie");
  const [dzienneKcal, setDzienneKcal] = useState(0);
  const [wyniki, setWyniki] = useState<DopasowanaKarma[]>([]);
  const [ofertyWgKarmy, setOfertyWgKarmy] = useState<Record<string, Oferta[]>>({});
  const [filtry, setFiltry] = useState<Filtry>(FILTRY_DOMYSLNE);

  useEffect(() => {
    if (!profil.imie) {
      router.replace("/kreator");
      return;
    }
    zbudujRanking(profil, FOODS).then((wynik) => {
      setDzienneKcal(wynik.dzienneKcal);
      setWyniki(wynik.wyniki);
      setOfertyWgKarmy(wynik.ofertyWgKarmy);
      setStan("gotowe");
    });
    // profil bierzemy tylko raz, przy wejściu na ekran wyników
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wszystkieSklepy = useMemo(() => {
    const zbior = new Set<string>();
    Object.values(ofertyWgKarmy).forEach((lista) => lista.forEach((o) => zbior.add(o.shop)));
    return Array.from(zbior).sort();
  }, [ofertyWgKarmy]);

  function filtrujOferty(oferty: Oferta[]): Oferta[] {
    return oferty.filter((o) => {
      const cenaCalkowita = o.price + o.delivery;
      if (filtry.cenaOd != null && cenaCalkowita < filtry.cenaOd) return false;
      if (filtry.cenaDo != null && cenaCalkowita > filtry.cenaDo) return false;
      if (filtry.sklep && o.shop !== filtry.sklep) return false;
      if (filtry.tylkoDostawa24h && !o.fast) return false;
      if (filtry.tylkoDostepne && !o.inStock) return false;
      return true;
    });
  }

  const wynikiPoFiltrach = useMemo(() => {
    const przetworzone = wyniki
      .map((wynik) => {
        const wszystkieOferty = ofertyWgKarmy[wynik.karma.id] ?? [];
        const ofertyOdfiltrowane = filtrujOferty(wszystkieOferty);
        if (ofertyOdfiltrowane.length === 0) return null;

        const { porcjaGDzien, kgMiesiac } = wynik;
        const { kosztMiesiac, dniStarcza } = liczKoszt(wynik.karma, porcjaGDzien, kgMiesiac, ofertyOdfiltrowane);
        const najtanszaOferta = ofertyOdfiltrowane.reduce((best, o) =>
          o.price + o.delivery < best.price + best.delivery ? o : best
        );

        return {
          wynik: { ...wynik, kosztMiesiac, dniStarcza, najtanszaOferta },
          oferty: ofertyOdfiltrowane,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    if (filtry.sortowanie === "cena") {
      przetworzone.sort((a, b) => {
        const cenaA = (a.wynik.najtanszaOferta?.price ?? 0) + (a.wynik.najtanszaOferta?.delivery ?? 0);
        const cenaB = (b.wynik.najtanszaOferta?.price ?? 0) + (b.wynik.najtanszaOferta?.delivery ?? 0);
        return cenaA - cenaB;
      });
    } else {
      przetworzone.sort((a, b) => b.wynik.score - a.wynik.score);
    }

    return przetworzone;
  }, [wyniki, ofertyWgKarmy, filtry]);

  if (stan === "ladowanie") {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-primary/60">Dobieramy karmy dla {profil.imie || "pupila"}…</p>
      </main>
    );
  }

  return (
    <main className="py-6">
      <Link href="/kreator" className="mb-4 inline-block text-sm text-primary/60">
        ← wróć do profilu
      </Link>

      <div className="mb-5 rounded-2xl border border-linia bg-white p-4 shadow-sm">
        <p className="text-sm text-primary/50">Dzienne zapotrzebowanie kaloryczne</p>
        <p className="text-2xl font-bold text-primary">{dzienneKcal} kcal</p>
        <p className="mt-1 text-xs text-primary/50">dla {profil.imie}, {profil.wagaKg} kg</p>
      </div>

      <PanelFiltrow filtry={filtry} onChange={setFiltry} sklepy={wszystkieSklepy} />

      {wynikiPoFiltrach.length === 0 && (
        <p className="text-center text-sm text-primary/50">Brak karm spełniających kryteria.</p>
      )}

      {wynikiPoFiltrach.map(({ wynik, oferty }) => (
        <KartaKarmy key={wynik.karma.id} wynik={wynik} oferty={oferty} />
      ))}

      <p className="mt-4 text-center text-xs text-primary/40">
        Porcje są orientacyjne (model RER/MER). Przy schorzeniach skonsultuj dietę z weterynarzem.
      </p>

      <div className="mt-6">
        <Przycisk wariant="ghost" onClick={() => router.push("/kreator")}>
          Edytuj profil pupila
        </Przycisk>
      </div>
    </main>
  );
}
