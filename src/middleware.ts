import { NextResponse, type NextRequest } from "next/server";
import { slugProduktu } from "@/lib/adresProduktu";
import { ladnaNazwa } from "@/lib/nazwa";

// Stare adresy produktów (/produkty/al-m-xxxx) → trwałe przekierowanie na czytelny adres
// (/produkty/nazwa-kolor-al-m-xxxx), z zachowaniem parametrów (np. link „oceń produkt" z maila).
// Działa wyłącznie dla adresów będących samym kodem — reszta sklepu nie przechodzi przez middleware.
export const config = {
  matcher: ["/produkty/:id(al-m-[a-z0-9]+|reczny-[a-z0-9]+|al-[a-z0-9]+)"],
};

export async function middleware(req: NextRequest) {
  const id = req.nextUrl.pathname.split("/").pop() ?? "";
  const baza = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const klucz = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!id || !baza || !klucz) return NextResponse.next();
  try {
    const r = await fetch(`${baza}/rest/v1/produkty?id=eq.${encodeURIComponent(id)}&select=nazwa,kolor,poprawki&limit=1`, {
      headers: { apikey: klucz, Authorization: `Bearer ${klucz}` },
    });
    if (!r.ok) return NextResponse.next();
    const [w] = (await r.json()) as { nazwa?: string; kolor?: string | null; poprawki?: { nazwa?: string; kolor?: string } | null }[];
    if (!w?.nazwa) return NextResponse.next(); // brak produktu — strona sama pokaże 404
    const tekst = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
    // Ta sama nazwa i kolor, co na karcie produktu (poprawki z panelu mają pierwszeństwo).
    const slug = slugProduktu({ id, nazwa: tekst(w.poprawki?.nazwa) ?? ladnaNazwa(w.nazwa), kolor: tekst(w.poprawki?.kolor) ?? w.kolor ?? null });
    if (slug === id) return NextResponse.next();
    const cel = req.nextUrl.clone();
    cel.pathname = `/produkty/${slug}`;
    return NextResponse.redirect(cel, 308);
  } catch {
    return NextResponse.next(); // baza chwilowo niedostępna — stary adres dalej działa
  }
}
