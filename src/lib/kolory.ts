// Rodzina koloru — wspólny słownik dla nazwy koloru produktu („niebieski (granatowy)")
// i wyniku analizy zdjęcia (tabela zdjecia_kolory). Dzięki temu scalanie może
// ustawić jako główne zdjęcie, na którym naprawdę widać kolor wybranego wariantu.
// Ten sam podział stosuje skrypt analizy obrazu — zmieniaj oba naraz.

export type RodzinaKoloru =
  | "biały" | "czarny" | "szary" | "beż/brąz" | "czerwony" | "różowy"
  | "fioletowy" | "niebieski" | "zielony" | "żółty" | "pomarańczowy";

const SLOWNIK: [RegExp, RodzinaKoloru][] = [
  [/biał|ecru|kremow|mleczn/, "biały"],
  [/czarn/, "czarny"],
  [/szar|grafit|siw|srebr|popiel/, "szary"],
  [/beż|brąz|kawow|karmel|camel|czekolad/, "beż/brąz"],
  [/różow|róż|malin|fuks|łosos|pudrow/, "różowy"],
  [/czerwon|bordo|wiśni/, "czerwony"],
  [/fiolet|lawend|liliow|śliw/, "fioletowy"],
  [/niebiesk|granat|chabr|błękit|turkus|morsk/, "niebieski"],
  [/zielon|khaki|oliw|miętow|butel/, "zielony"],
  [/żółt|musztard|cytryn/, "żółty"],
  [/pomarańcz|brzoskw|koral/, "pomarańczowy"],
];

/** Rodzina z nazwy koloru produktu. Bierze barwę główną (przed nawiasem z odcieniem). */
export function rodzinaKoloru(kolor: string | null | undefined): RodzinaKoloru | null {
  const barwa = (kolor || "").toLowerCase().split("(")[0];
  if (!barwa.trim() || /wielokolor|inny|mix/.test(barwa)) return null;
  for (const [re, r] of SLOWNIK) if (re.test(barwa)) return r;
  return null;
}
