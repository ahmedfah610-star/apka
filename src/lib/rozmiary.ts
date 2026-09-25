// Rozmiary: dziecięce liczbowe (56, 104, „92-98") i dorosłe literowe (M, XL, „M/L", „2XL/3XL").

// Rozmiar dorosłego ubrania (litery: S/M/L/XL/XXL/3XL–6XL, także złożenia „M/L").
// UWAGA: nie mylić z rozmiarami niemowlęcymi w cm/zakresach liczbowych (np. „16-18", „26-30 cm").
export function rozmiarDorosly(r: string): boolean {
  return /^(x{0,3}s|x{0,3}l|m|[2-6]xl)(\s*\/\s*(x{0,3}s|x{0,3}l|m|[2-6]xl))?$/i.test((r || "").trim());
}

const KOLEJNOSC_LITER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "4XL", "5XL", "6XL"];

function rangaLiterowa(r: string): number {
  const t = r.split("/")[0].trim().toUpperCase().replace(/^2XL$/, "XXL").replace(/^3XL$/, "XXXL");
  const i = KOLEJNOSC_LITER.indexOf(t);
  return i < 0 ? KOLEJNOSC_LITER.length : i;
}

/** Sortowanie rozmiarów: liczbowe rosnąco, potem literowe S < M < L < XL < … */
export function porownajRozmiary(a: string, b: string): number {
  const la = rozmiarDorosly(a);
  const lb = rozmiarDorosly(b);
  if (la && lb) return rangaLiterowa(a) - rangaLiterowa(b);
  if (la !== lb) return la ? 1 : -1;
  return (parseInt(a, 10) || 0) - (parseInt(b, 10) || 0);
}
