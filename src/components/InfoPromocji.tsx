"use client";

import { useEffect, useState } from "react";
import { promocjaPrzyProduktach, warunkiPromocji, zakresPromocji, type Promocja } from "@/lib/promocja";
import { kodAutomatyczny } from "@/lib/kodAutomatyczny";
import { doKiedy } from "@/components/PasekPromocji";

// Informacja o trwającym kodzie rabatowym przy produktach (karta na liście i strona produktu).
// Liczona w przeglądarce — strony z cache nie pokażą kodu po końcu promocji.
// Kod dodawany automatycznie (test): „doda się sam w koszyku”; gdy klient go usunął — jak zwykły kod do wpisania.
type PromocjaInfo = Promocja & { automatyczny: boolean };
function useTrwajacaPromocja(): PromocjaInfo | null {
  const [promo, setPromo] = useState<PromocjaInfo | null>(null);
  useEffect(() => {
    const ustaw = () => {
      const p = promocjaPrzyProduktach();
      setPromo(p && p.automatyczny ? { ...p, automatyczny: kodAutomatyczny() !== null || !localStorage.getItem("bobas-kod-auto") } : p);
    };
    ustaw();
    const t = setInterval(ustaw, 60_000);
    return () => clearInterval(t);
  }, []);
  return promo;
}
const dataPl = (iso: string) => new Intl.DateTimeFormat("pl-PL", { timeZone: "Europe/Warsaw", day: "numeric", month: "numeric", year: "numeric" }).format(new Date(iso));

/** Krótka linijka pod ceną na karcie produktu. */
export function PromocjaNaKarcie() {
  const promo = useTrwajacaPromocja();
  if (!promo) return null;
  return (
    <p className="-mt-0.5 mb-1 truncate text-[11.5px] font-bold text-cena md:text-[12px]" title={`${warunkiPromocji(promo)}. Kod: ${promo.kod}`}>
      {promo.automatyczny ? `−${promo.procent}% z kodem ${promo.kod} w koszyku` : `${promo.kod}: −${promo.procent}% ${zakresPromocji(promo)}`}
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
        {promo.automatyczny ? null : (
        <button
          type="button"
          onClick={() => void kopiuj()}
          className="rounded-lg bg-cena px-3 py-1.5 text-[12.5px] font-bold text-white hover:opacity-90"
        >
          {skopiowano ? "Skopiowano ✓" : "Kopiuj kod"}
        </button>
        )}
      </div>
      <p className="mt-1.5 text-[13px] leading-snug text-ink-2">
        {promo.automatyczny ? (
          <>
            Kod dodamy sam, gdy włożysz produkt do koszyka — rabat zobaczysz od razu w koszyku. Na wszystkie produkty, bez minimalnej
            kwoty (rabat nie obejmuje dostawy).{promo.do ? ` Ważny do ${dataPl(promo.do)}.` : ""}
          </>
        ) : (
          <>
            {promo.minKoszyk > 0 ? `Przy zakupie produktów za min. ${promo.minKoszyk} zł (bez kosztu dostawy).` : "Na wszystkie produkty, bez minimalnej kwoty (rabat nie obejmuje dostawy)."} Kod wpisz przy
            składaniu zamówienia.
            {promo.do ? ` Ważny ${doKiedy(new Date(promo.do).getTime(), Date.now()).replace(/^tylko /, "")}.` : ""}
          </>
        )}
      </p>
    </div>
  );
}
