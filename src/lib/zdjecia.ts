// Zdjęcia z Allegro są zapisane w pełnej rozdzielczości („/original/", 300–800 KB).
// Allegro serwuje te same zdjęcia w mniejszych wersjach — na kafelek wystarcza ~30 KB
// zamiast ~500 KB, co na telefonie (3G/LTE) robi ogromną różnicę.
export type RozmiarZdjecia = "s128" | "s360" | "s512" | "s720" | "s1024" | "original";

const ALLEGRO = /^(https:\/\/a\.allegroimg\.com\/)original\//;

export function zdjecie(url: string | null | undefined, rozmiar: RozmiarZdjecia): string {
  if (!url) return "";
  return rozmiar === "original" ? url : url.replace(ALLEGRO, `$1${rozmiar}/`);
}

/** srcSet dla kafelka/galerii — przeglądarka sama wybierze wersję do ekranu. */
export function zestawZdjec(url: string | null | undefined, rozmiary: Exclude<RozmiarZdjecia, "original">[]): string | undefined {
  if (!url || !ALLEGRO.test(url)) return undefined;
  return rozmiary.map((r) => `${zdjecie(url, r)} ${r.slice(1)}w`).join(", ");
}
