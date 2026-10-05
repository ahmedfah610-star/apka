import { katalogWidoczny, opisyRozmiarowTekst } from "@/lib/produktyDb";
import { opisProduktu, KATEGORIE_LABEL, type Produkt } from "@/data/produkty";
import { BAZA_URL, NAZWA_SKLEPU, OPIS_SKLEPU } from "@/lib/seo";
import { pobierzDostawe } from "@/lib/dostawaDb";
import type { UstawieniaDostawy } from "@/lib/dostawa";

// Feed produktowy w formacie Google Merchant (RSS 2.0 + namespace g:).
// Ten sam plik działa w Meta (Facebook/Instagram) katalog.
// URL do wklejenia w Merchant Center / Meta: https://bobas-shopping.pl/feed.xml
export const revalidate = 3600; // odświeżany co godzinę

function cdata(s: string): string {
  return `<![CDATA[${String(s ?? "").replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}
function txt(s: string): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Odzież w Google/Meta wymaga płci i grupy wiekowej.
function plec(p: Produkt): string {
  if (p.kategoria === "dziewczynki") return "female";
  if (p.kategoria === "chlopcy" || p.kategoria === "dorosli") return "male"; // „dorosli" = kolekcja męska
  return "unisex";
}
function grupaWiekowa(p: Produkt): string {
  if (p.kategoria === "dorosli") return "adult";
  if (p.kategoria === "niemowleta") return "infant";
  if (p.wiek === "6-12") return "kids";
  return "toddler";
}

function opisFeed(p: Produkt): string {
  const s = opisProduktu(p).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return (s || `${p.nazwa} — ${KATEGORIE_LABEL[p.kategoria]}. ${OPIS_SKLEPU}`).slice(0, 4900);
}

// Koszt dostawy w Google = najtańsza aktywna metoda (0 zł od progu darmowej dostawy),
// czas: wysyłka 0–1 dzień roboczy + 1–2 dni przewoźnika (jak „Dostawa …" na stronie produktu).
function wysylka(p: Produkt, d: UstawieniaDostawy): string {
  const aktywne = d.metody.filter((m) => m.aktywna !== false);
  if (!aktywne.length) return "";
  const najtansza = aktywne.reduce((a, m) => (m.cena < a.cena ? m : a));
  const cena = p.cena >= d.darmowaOd ? 0 : najtansza.cena;
  return `    <g:shipping>
      <g:country>PL</g:country>
      <g:service>${cdata(najtansza.nazwa)}</g:service>
      <g:price>${cena.toFixed(2)} PLN</g:price>
      <g:min_handling_time>0</g:min_handling_time>
      <g:max_handling_time>1</g:max_handling_time>
      <g:min_transit_time>1</g:min_transit_time>
      <g:max_transit_time>2</g:max_transit_time>
    </g:shipping>
`;
}

function pozycja(
  p: Produkt,
  dostawa: UstawieniaDostawy,
  wariant: { id: string; rozmiar?: string; dostepny: boolean; grupa?: string; opis?: string },
): string {
  const link = `${BAZA_URL}/produkty/${p.id}`;
  const zdj = (p.zdjecia?.length ? p.zdjecia : p.zdjecie ? [p.zdjecie] : []).filter(Boolean);
  const dodatkowe = zdj.slice(1, 11).map((u) => `    <g:additional_image_link>${txt(u)}</g:additional_image_link>`).join("\n");
  return `  <item>
    <g:id>${txt(wariant.id)}</g:id>
    <g:title>${cdata(p.nazwa)}</g:title>
    <g:description>${cdata(wariant.opis ? wariant.opis.slice(0, 4900) : opisFeed(p))}</g:description>
    <g:link>${txt(link)}</g:link>
    <g:image_link>${txt(zdj[0]!)}</g:image_link>
${dodatkowe ? dodatkowe + "\n" : ""}    <g:availability>${wariant.dostepny ? "in_stock" : "out_of_stock"}</g:availability>
    <g:price>${p.cena.toFixed(2)} PLN</g:price>
    <g:brand>${txt(NAZWA_SKLEPU)}</g:brand>
    <g:condition>new</g:condition>
    <g:identifier_exists>no</g:identifier_exists>
    <g:google_product_category>1604</g:google_product_category>
    <g:product_type>${cdata(KATEGORIE_LABEL[p.kategoria])}</g:product_type>
    <g:gender>${plec(p)}</g:gender>
    <g:age_group>${grupaWiekowa(p)}</g:age_group>
${p.kolor ? `    <g:color>${cdata(p.kolor.slice(0, 100))}</g:color>\n` : ""}${wysylka(p, dostawa)}${
    wariant.rozmiar
      ? `    <g:size>${txt(wariant.rozmiar)}</g:size>\n    <g:size_system>EU</g:size_system>\n    <g:item_group_id>${txt(p.id)}</g:item_group_id>\n`
      : ""
  }  </item>`;
}

export async function GET() {
  const [katalog, opisyRozm, dostawa] = await Promise.all([katalogWidoczny(), opisyRozmiarowTekst(), pobierzDostawe()]);
  const pozycje: string[] = [];

  for (const p of katalog) {
    const zdjecie = p.zdjecie || p.zdjecia?.[0];
    if (!zdjecie) continue; // Google/Meta wymaga zdjęcia

    const rozmiary = p.rozmiary?.length ? p.rozmiary : [];
    if (rozmiary.length) {
      for (const r of rozmiary) {
        const stanR = p.stanRozmiary ? p.stanRozmiary[r] ?? 0 : p.stan;
        const dostepny = stanR === undefined || stanR === null || stanR > 0;
        // Opis z wymiarami TEGO rozmiaru (jeśli jest), inaczej wspólny opis produktu.
        pozycje.push(pozycja(p, dostawa, { id: `${p.id}-${r}`, rozmiar: r, dostepny, opis: opisyRozm.get(p.id)?.[r] }));
      }
    } else {
      const dostepny = p.stan === undefined || p.stan === null || p.stan > 0;
      pozycje.push(pozycja(p, dostawa, { id: p.id, dostepny }));
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
  <title>${txt(NAZWA_SKLEPU)}</title>
  <link>${BAZA_URL}</link>
  <description>${txt(OPIS_SKLEPU)}</description>
${pozycje.join("\n")}
</channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
