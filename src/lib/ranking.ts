import type { DopasowanaKarma, Karma, Oferta, ProfilPupila } from "@/types/domain";
import { ocenKarme, ogranicz3Powody } from "@/lib/matching";
import { liczDzienneKcal, liczKoszt, liczPorcje } from "@/lib/calculator";
import { fetchOffers } from "@/lib/offersService";

/**
 * Buduje pełny ranking dopasowania karm do profilu pupila: ocena, porcja,
 * koszt miesięczny i liczba dni na opakowanie — posortowane malejąco po score.
 */
export async function zbudujRanking(
  profil: ProfilPupila,
  katalog: Karma[]
): Promise<{
  dzienneKcal: number;
  wyniki: DopasowanaKarma[];
  ofertyWgKarmy: Record<string, Oferta[]>;
}> {
  const dzienneKcal = liczDzienneKcal(profil);

  const wyniki: DopasowanaKarma[] = [];
  const ofertyWgKarmy: Record<string, Oferta[]> = {};

  for (const karma of katalog) {
    const ocena = ocenKarme(karma, profil);
    if (!ocena) continue;

    const { porcjaGDzien, kgMiesiac } = liczPorcje(dzienneKcal, karma);
    const oferty = await fetchOffers(karma.id, karma.name);
    ofertyWgKarmy[karma.id] = oferty;
    const { kosztMiesiac, dniStarcza } = liczKoszt(karma, porcjaGDzien, kgMiesiac, oferty);
    const najtanszaOferta =
      oferty.length === 0
        ? null
        : oferty.reduce((best, o) => (o.price + o.delivery < best.price + best.delivery ? o : best));

    wyniki.push({
      karma,
      score: ocena.score,
      powody: ogranicz3Powody(ocena.powody),
      porcjaGDzien,
      kgMiesiac,
      najtanszaOferta,
      kosztMiesiac,
      dniStarcza,
    });
  }

  wyniki.sort((a, b) => b.score - a.score);

  return { dzienneKcal, wyniki, ofertyWgKarmy };
}
