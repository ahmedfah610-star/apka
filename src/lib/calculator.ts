import type { Karma, Oferta, ProfilPupila } from "@/types/domain";
import { ustalEtapZycia } from "@/lib/matching";
import { pickCheapestOffer } from "@/lib/offersService";

/** Resting Energy Requirement: 70 * waga_kg^0.75 */
export function liczRER(wagaKg: number): number {
  return 70 * Math.pow(wagaKg, 0.75);
}

function czynnikEtapuAktywnosci(profil: ProfilPupila): number {
  const etap = ustalEtapZycia(profil.gatunek, profil.wiekLat);

  let bazowy: number;
  if (profil.gatunek === "pies") {
    if (etap === "puppy") bazowy = 2.5;
    else if (etap === "senior") bazowy = 1.4;
    else bazowy = profil.sterylizowany ? 1.6 : 1.8;
  } else {
    if (etap === "puppy") bazowy = 2.5;
    else if (etap === "senior") bazowy = 1.1;
    else bazowy = profil.sterylizowany ? 1.2 : 1.4;
  }

  const aktywnoscMnoznik =
    profil.gatunek === "pies"
      ? { spokojny: 0.9, umiarkowany: 1.0, bardzo_aktywny: 1.3 }
      : { spokojny: 0.9, umiarkowany: 1.0, bardzo_aktywny: 1.2 };

  let czynnik = bazowy * aktywnoscMnoznik[profil.aktywnosc];

  if (profil.stanCiala === "nadwaga") czynnik *= 0.8;
  if (profil.stanCiala === "niedowaga") czynnik *= 1.15;

  return czynnik;
}

/** Dzienne zapotrzebowanie kaloryczne (MER) pupila, w kcal. */
export function liczDzienneKcal(profil: ProfilPupila): number {
  const rer = liczRER(profil.wagaKg);
  const czynnik = czynnikEtapuAktywnosci(profil);
  return Math.round(rer * czynnik);
}

export interface WynikPorcji {
  porcjaGDzien: number;
  kgMiesiac: number;
}

/** Dzienna porcja karmy w gramach i miesięczne zużycie w kg, dla danej karmy i dziennych kcal. */
export function liczPorcje(dzienneKcal: number, karma: Karma): WynikPorcji {
  const porcjaGDzien = (dzienneKcal / karma.kcalKg) * 1000;
  const kgMiesiac = (porcjaGDzien * 30) / 1000;
  return { porcjaGDzien, kgMiesiac };
}

export interface WynikKosztu {
  kosztMiesiac: number | null;
  dniStarcza: number | null;
}

/** Miesięczny koszt karmienia i liczba dni, na ile starcza jedno opakowanie, liczone z najtańszej oferty. */
export function liczKoszt(
  karma: Karma,
  porcjaGDzien: number,
  kgMiesiac: number,
  oferty: Oferta[]
): WynikKosztu {
  const najtansza = pickCheapestOffer(oferty);
  if (!najtansza) return { kosztMiesiac: null, dniStarcza: null };

  const cenaZaKg = najtansza.price / karma.packageKg;
  const kosztMiesiac = Math.round(kgMiesiac * cenaZaKg);
  const dniStarcza = Math.round((karma.packageKg * 1000) / porcjaGDzien);

  return { kosztMiesiac, dniStarcza };
}
