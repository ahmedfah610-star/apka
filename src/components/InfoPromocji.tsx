"use client";

import { useEffect, useState } from "react";
import { promocjaTrwa, warunkiPromocji, zakresPromocji, type Promocja } from "@/lib/promocja";
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

/** Krótka linijka pod ceną na karcie produktu. */
export function PromocjaNaKarcie() {
  const promo = useTrwajacaPromocja();
  if (!promo) return null;
  return (
    <p className="-mt-0.5 mb-1 truncate text-[11.5px] font-bold text-cena md:text-[12px]" title={`${warunkiPromocji(promo)}. Kod: ${promo.kod}`}>
      {promo.kod}: −{promo.procent}% {zakresPromocji(promo)}
    </p>
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
        {promo.minKoszyk > 0 ? `Przy zakupie produktów za min. ${promo.minKoszyk} zł (bez kosztu dostawy).` : "Na wszystkie produkty, bez minimalnej kwoty (rabat nie obejmuje dostawy)."} Kod wpisz przy
        składaniu zamówienia. Ważny{" "}
        {doKiedy(new Date(promo.do).getTime(), Date.now()).replace(/^tylko /, "")}.
      </p>
    </div>
  );
}
