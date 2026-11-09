// Czytelne adresy produktów: /produkty/<nazwa>-<kolor>-<id> zamiast samego kodu.
// Kod (id) zostaje na końcu — po nim znajdujemy produkt, więc zmiana nazwy niczego nie psuje,
// a stare adresy /produkty/<id> przekierowują na nowe (middleware). Plik bez zależności od
// serwera — używany w przeglądarce, na serwerze i w middleware.

/** Formaty id, które umiemy wyciąć z końca adresu (Allegro: al-m-…, al-…; dodane ręcznie: reczny-…). */
const WZOR_ID = "al-m-[a-z0-9]+|reczny-[a-z0-9]+|al-[a-z0-9]+";
export const ID_PRODUKTU = new RegExp(`^(?:${WZOR_ID})$`);
const ID_NA_KONCU = new RegExp(`(?:^|-)(${WZOR_ID})$`);
/** Ten sam wzór dla next.config (rewrites) i matchera middleware. */
export const WZOR_ID_PRODUKTU = WZOR_ID;

const MAX_SLUG = 70;
const POMIN_KOLOR = new Set(["wielokolorowy", "inny", "mix", "wzor", "wzory"]);

export function slugTekstu(s: string): string {
  return String(s ?? "")
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type DaneAdresu = { id: string; nazwa: string; kolor?: string | null };

/** „pajacyk-bawelna-na-zatrzaski-fioletowy-al-m-9mibdz" (albo samo id, gdy nie da się zbudować nazwy). */
export function slugProduktu(p: DaneAdresu): string {
  if (!ID_PRODUKTU.test(p.id)) return p.id; // nieznany format id — zostaje stary adres
  let tekst = slugTekstu(p.nazwa);
  const kolor = slugTekstu(p.kolor ?? "");
  // Kolor dopisujemy, gdy coś mówi i nie ma go już w nazwie.
  if (kolor && !POMIN_KOLOR.has(kolor) && !`-${tekst}-`.includes(`-${kolor}-`)) tekst = tekst ? `${tekst}-${kolor}` : kolor;
  if (tekst.length > MAX_SLUG) tekst = tekst.slice(0, MAX_SLUG).replace(/-[^-]*$/, "");
  return tekst ? `${tekst}-${p.id}` : p.id;
}

export function urlProduktu(p: DaneAdresu): string {
  return `/produkty/${slugProduktu(p)}`;
}

/** Id produktu z końca adresu (także gdy adres to samo id). */
export function idZAdresu(param: string): string | null {
  const m = ID_NA_KONCU.exec(String(param ?? "").toLowerCase());
  return m ? m[1] : null;
}
