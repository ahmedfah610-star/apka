import type { Cel, EtapZycia, Karma, ProfilPupila, Schorzenie } from "@/types/domain";

const NAZWY_CELOW: Record<Cel, string> = {
  coat: "sierść",
  sensitive: "trawienie",
  weight: "masa ciała",
  joints: "stawy",
};

/** Etap życia na podstawie gatunku i wieku w latach. */
export function ustalEtapZycia(gatunek: ProfilPupila["gatunek"], wiekLat: number): EtapZycia {
  if (gatunek === "pies") {
    if (wiekLat < 1) return "puppy";
    if (wiekLat >= 8) return "senior";
    return "adult";
  }
  // kot
  if (wiekLat < 1) return "puppy";
  if (wiekLat >= 11) return "senior";
  return "adult";
}

const NAZWA_ETAPU: Record<EtapZycia, string> = {
  puppy: "dla młodego",
  adult: "dla dorosłego",
  senior: "dla seniora",
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export interface WynikDopasowania {
  score: number;
  powody: string[];
}

/**
 * Liczy punktację dopasowania karmy do profilu pupila.
 * Zwraca null, jeśli karma jest odrzucona (gatunek/alergen/rodzaj karmy się nie zgadza).
 */
export function ocenKarme(karma: Karma, profil: ProfilPupila): WynikDopasowania | null {
  if (karma.species !== profil.gatunek) return null;

  const maAlergen = karma.contains.some((skladnik) => profil.alergeny.includes(skladnik));
  if (maAlergen) return null;

  if (profil.rodzajKarmy !== "obie" && karma.type !== profil.rodzajKarmy) return null;

  const etapPupila = ustalEtapZycia(profil.gatunek, profil.wiekLat);

  let score = 40;
  const powody: string[] = [];

  if (karma.stage.includes(etapPupila)) {
    score += 22;
    powody.push(NAZWA_ETAPU[etapPupila]);
  } else {
    score -= 15;
  }

  for (const cel of profil.cele) {
    if (karma.goals.includes(cel)) {
      score += 11;
      powody.push(NAZWY_CELOW[cel]);
    }
  }

  if (karma.activity === "all" || karma.activity === profil.aktywnosc) {
    score += 6;
  }

  if (profil.stanCiala === "nadwaga" && karma.goals.includes("weight")) {
    score += 10;
    powody.push("dla nadwagi");
  }

  if ((profil.rozmiar === "duza" || profil.rozmiar === "olbrzymia") && karma.goals.includes("joints")) {
    score += 6;
    powody.push("dla dużych ras");
  }

  if (profil.schorzenie !== "brak") {
    if (karma.vetFor === profil.schorzenie) {
      score += 18;
      powody.push(`dieta: ${nazwaSchorzenia(profil.schorzenie)}`);
    } else if (profil.schorzenie === "skora" && karma.goals.includes("coat")) {
      score += 8;
      powody.push("wspiera skórę");
    } else if (profil.schorzenie === "trawienie" && karma.goals.includes("sensitive")) {
      score += 8;
      powody.push("lekkostrawna");
    }
  }

  if (profil.alergeny.length > 0) {
    powody.push(`bez: ${profil.alergeny.join(", ")}`);
  }

  score = clamp(score, 35, 99);

  return { score, powody };
}

function nazwaSchorzenia(schorzenie: Schorzenie): string {
  const mapa: Record<Schorzenie, string> = {
    brak: "",
    nerki: "nerki",
    stawy: "stawy",
    skora: "skóra",
    trawienie: "trawienie",
  };
  return mapa[schorzenie];
}

/** Sortuje wyniki malejąco po score i ogranicza listę powodów do maksymalnie 3. */
export function ogranicz3Powody(powody: string[]): string[] {
  return powody.slice(0, 3);
}
