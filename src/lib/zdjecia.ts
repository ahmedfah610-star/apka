import { BAZA_URL } from "@/lib/seo";

// Zdjęcia z Allegro są zapisane w pełnej rozdzielczości („/original/", 300–800 KB).
// Allegro serwuje te same zdjęcia w mniejszych wersjach — na kafelek wystarcza ~30 KB
// zamiast ~500 KB, co na telefonie (3G/LTE) robi ogromną różnicę.
export type RozmiarZdjecia = "s128" | "s360" | "s512" | "s720" | "s1024" | "original";

const ALLEGRO = /^(https:\/\/a\.allegroimg\.com\/)original\//;

// Zdjęcia wgrane w panelu (Supabase Storage) to pełne PNG/JPG, często 1–2 MB, a Supabase podaje je
// bez pamięci podręcznej („private, no-cache”) — każde wyświetlenie szło z limitu transferu bazy.
// Przepuszczamy je przez optymalizator obrazów Vercela: WebP w potrzebnej szerokości, trzymany
// 30 dni w CDN (next.config.js → minimumCacheTTL), więc Supabase oddaje plik raz na miesiąc.
// Adres absolutny — ten sam działa na stronie i w mailach.
const SUPABASE = /^https:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\//;
// Szerokości z domyślnych list Next.js (imageSizes/deviceSizes) — innych optymalizator nie przyjmie.
const SZEROKOSC: Record<Exclude<RozmiarZdjecia, "original">, number> = { s128: 128, s360: 384, s512: 640, s720: 750, s1024: 1080 };

export const zSupabase = (url: string) => SUPABASE.test(url);

export function zdjecie(url: string | null | undefined, rozmiar: RozmiarZdjecia): string {
  if (!url) return "";
  if (rozmiar === "original") return url;
  if (SUPABASE.test(url)) return `${BAZA_URL}/_next/image?url=${encodeURIComponent(url)}&w=${SZEROKOSC[rozmiar]}&q=75`;
  return url.replace(ALLEGRO, `$1${rozmiar}/`);
}

/** srcSet dla kafelka/galerii — przeglądarka sama wybierze wersję do ekranu. */
export function zestawZdjec(url: string | null | undefined, rozmiary: Exclude<RozmiarZdjecia, "original">[]): string | undefined {
  if (!url) return undefined;
  if (SUPABASE.test(url)) return rozmiary.map((r) => `${zdjecie(url, r)} ${SZEROKOSC[r]}w`).join(", ");
  if (!ALLEGRO.test(url)) return undefined;
  return rozmiary.map((r) => `${zdjecie(url, r)} ${r.slice(1)}w`).join(", ");
}
