"use client";

import { useEffect, useState } from "react";
import { promocjaTrwa, warunkiPromocji, type Promocja } from "@/lib/promocja";
import { formatCena } from "@/lib/filtrowanie";
import { doKiedy } from "@/components/PasekPromocji";

// Informacja o trwającym kodzie rabatowym przy produktach (karta na liście i strona produktu).
// Liczona w przeglądarce — strony z cache nie pokażą kodu po końcu promocji.
function useTrwajacaPromocja(): Promocja | null {
  const [promo, setPromo] = useState<Promocja | null>(null);
  useEffect(() => {
    setPromo(promocjaTrwa());
    const t = setInterval(() => setPromo(promocjaTrwa()), 60_000);
    return () => clearInterval(t);
  }, []);
  return promo;
}

/** Cena z kodem (zaokrąglona do grosza) — orientacyjna; rabat liczy się od całego koszyka. */
export function cenaZKodem(cena: number, p: Promocja): number {
  return Math.round(cena * (100 - p.procent)) / 100;
}

/** Cena na karcie produktu: zwykła, a w promocji przekreślona + cena z kodem i warunek. */
export function CenaKarty({ cena, od, dostepny = true }: { cena: number; od?: boolean; dostepny?: boolean }) {
  const promo = useTrwajacaPromocja();
  const przed = od ? <span className="text-[13px] font-semibold text-ink-2">od </span> : null;
  if (!promo || !dostepny) {
    return (
      <p className="text-[17px] font-extrabold tracking-tight text-ink md:text-[18px]">
        {przed}
        {formatCena(cena)} zł
      </p>
    );
  }
  return (
    <>
      <p className="flex flex-wrap items-baseline gap-x-1.5 text-[17px] font-extrabold tracking-tight text-cena md:text-[18px]">
        <span>
          {przed}
          {formatCena(cenaZKodem(cena, promo))} zł
        </span>
        <s className="text-[12.5px] font-semibold text-ink-2">{formatCena(cena)} zł</s>
      </p>
      <p className="-mt-0.5 mb-1 truncate text-[11.5px] font-bold text-cena md:text-[12px]" title={`${warunkiPromocji(promo)}. Kod: ${promo.kod}`}>
        z kodem {promo.kod} · od {promo.minKoszyk} zł
      </p>
    </>
  );
}

/** Cena na stronie produktu: w promocji przekreślona + cena z kodem i informacja o najniższej cenie z 30 dni. */
export function CenaProduktu({ cena }: { cena: number }) {
  const promo = useTrwajacaPromocja();
  if (!promo) return <p className="mb-2 text-[26px] font-extrabold text-ink">{formatCena(cena)} zł</p>;
  return (
    <div className="mb-2">
      <p className="flex flex-wrap items-baseline gap-x-2.5 text-[26px] font-extrabold text-cena">
        {formatCena(cenaZKodem(cena, promo))} zł
        <s className="text-[17px] font-semibold text-ink-2">{formatCena(cena)} zł</s>
        <span className="rounded-md bg-cena px-1.5 py-0.5 text-[12px] font-extrabold text-white">−{promo.procent}%</span>
      </p>
      <p className="text-[12.5px] leading-snug text-ink-2">
        Cena z kodem {promo.kod} (warunki poniżej). Najniższa cena z 30 dni przed obniżką: {formatCena(cena)} zł.
      </p>
    </div>
  );
}

/** Ramka z kodem i warunkami na stronie produktu. */
export function PromocjaProduktu() {
  const promo = useTrwajacaPromocja();
  const [skopiowano, setSkopiowano] = useState(false);
  if (!promo) return null;

  const kopiuj = async () => {
    try {
      await navigator.clipboard.writeText(promo.kod);
      setSkopiowano(true);
      setTimeout(() => setSkopiowano(false), 2000);
    } catch {
      /* ignoruj */
    }
  };

  return (
    <div className="mb-3 rounded-xl border-[1.5px] border-dashed border-cena/60 bg-[oklch(97%_0.025_55)] px-3.5 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[15px] font-extrabold text-cena">
          🎁 −{promo.procent}% z kodem{" "}
          <span className="rounded-md border-[1.5px] border-dashed border-cena px-1.5 py-0.5 tracking-wide">{promo.kod}</span>
        </p>
        <button
          type="button"
          onClick={() => void kopiuj()}
          className="rounded-lg bg-cena px-3 py-1.5 text-[12.5px] font-bold text-white hover:opacity-90"
        >
          {skopiowano ? "Skopiowano ✓" : "Kopiuj kod"}
        </button>
      </div>
      <p className="mt-1.5 text-[13px] leading-snug text-ink-2">
        Przy zakupie produktów za min. {promo.minKoszyk} zł (bez kosztu dostawy). Kod wpisz przy składaniu zamówienia. Ważny{" "}
        {doKiedy(new Date(promo.do).getTime(), Date.now()).replace(/^tylko /, "")}.
      </p>
    </div>
  );
}
