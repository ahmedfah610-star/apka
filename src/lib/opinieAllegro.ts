import { revalidateTag, unstable_cache } from "next/cache";
import { aktualnyToken, allegroGet, bezTokenow } from "@/lib/allegro";
import { sbService } from "@/lib/supabase";

// Opinie o sklepie z Allegro (oceny sprzedawcy) — na stronie jako dowód, że jesteśmy solidni.
// Pobieranie raz dziennie (cron allegro-stany) albo przyciskiem w panelu; zapis w jednym wierszu
// `ustawienia` (klucz „allegro_opinie”). Strony czytają go z pamięci podręcznej — baza oddaje
// ten wiersz najwyżej kilka razy na dobę.
//
// Zasady (prawo konsumenckie): pokazujemy wszystkie opinie z treścią, także negatywne,
// z informacją o źródle; loginy kupujących maskujemy. Nie robimy z nich gwiazdek w danych
// strukturalnych Google (Google zabrania przenoszenia ocen z innych serwisów).

export const KLUCZ_OPINII_ALLEGRO = "allegro_opinie";
export const TAG_OPINII_ALLEGRO = "allegro-opinie";
const MAX_OPINII = 150; // tyle najnowszych opinii z treścią trzymamy
const MAX_STRON = 5; // po 100 ocen — najnowsze 500 wystarczy, by zebrać 150 z komentarzem

export interface OpiniaAllegro {
  id: string;
  data: string; // ISO
  login: string; // zamaskowany, np. „k***a”
  polecam: boolean;
  tekst: string;
  odpowiedz: string | null; // odpowiedź sklepu
  produkty: string[]; // id produktów w sklepie (z ofert zamówienia), jeśli udało się dopasować
}

export interface PodsumowanieAllegro {
  procentPolecen: string; // jak na Allegro, np. „99,6”
  ocen: number; // wszystkie otrzymane oceny
  polecajacych: number;
  niepolecajacych: number;
  odKiedy: string | null; // data założenia konta sprzedawcy
}

export interface OpinieAllegro {
  czas: string;
  podsumowanie: PodsumowanieAllegro;
  opinie: OpiniaAllegro[];
}

/** „kasia_123” → „k***3” — bez publikowania pełnego loginu kupującego. */
export function maskujLogin(login: string): string {
  const l = (login || "").trim();
  if (l.length <= 2) return `${l.charAt(0) || "k"}***`;
  return `${l.charAt(0)}***${l.charAt(l.length - 1)}`;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Ocena z API Allegro → opinia do pokazania (null, gdy bez treści). Eksport do testów. */
export function zOceny(r: any, produktyOfert: Map<string, string>): OpiniaAllegro | null {
  const tekst = String(r?.comment?.text ?? "").replace(/\s+/g, " ").trim();
  if (!tekst) return null;
  const produkty = [
    ...new Set(((r?.order?.offers ?? []) as any[]).map((o) => produktyOfert.get(String(o?.id))).filter((x): x is string => !!x)),
  ];
  return {
    id: String(r.id),
    data: String(r.createdAt ?? r.lastChangedAt ?? ""),
    login: maskujLogin(String(r?.buyer?.login ?? "")),
    polecam: r.recommended === true,
    tekst: tekst.slice(0, 1200),
    odpowiedz: r?.answer?.text ? String(r.answer.text).replace(/\s+/g, " ").trim().slice(0, 1200) : null,
    produkty,
  };
}

export function zPodsumowania(s: any): PodsumowanieAllegro {
  const pol = Number(s?.recommended?.total ?? 0);
  const niepol = Number(s?.notRecommended?.total ?? 0);
  const otrzymane = Number(s?.statistics?.received?.total);
  return {
    procentPolecen: String(s?.recommendedPercentage ?? "").trim(),
    ocen: Number.isFinite(otrzymane) && otrzymane > 0 ? otrzymane : pol + niepol,
    polecajacych: pol,
    niepolecajacych: niepol,
    odKiedy: s?.user?.createdAt ? String(s.user.createdAt) : null,
  };
}

export type WynikOdswiezenia = { ok: true; opinii: number; ocen: number } | { ok: false; blad: string };

/** Pobiera z Allegro podsumowanie i najnowsze opinie, zapisuje w bazie. Przy błędzie stare dane zostają. */
export async function odswiezOpinieAllegro(): Promise<WynikOdswiezenia> {
  const sb = sbService();
  if (!sb) return { ok: false, blad: "Brak bazy." };
  try {
    if (!(await aktualnyToken())) return { ok: false, blad: "Brak połączenia z Allegro." };
    const ja = await allegroGet<{ id?: string }>("/me");
    if (!ja?.id) return { ok: false, blad: "Allegro nie podało identyfikatora konta." };
    const podsumowanie = zPodsumowania(await allegroGet(`/users/${encodeURIComponent(ja.id)}/ratings-summary`));

    const oceny: any[] = [];
    for (let strona = 0; strona < MAX_STRON; strona++) {
      const d = await allegroGet<{ ratings?: any[] }>(`/sale/user-ratings?limit=100&offset=${strona * 100}`);
      const partia = d?.ratings ?? [];
      oceny.push(...partia);
      if (partia.length < 100 || oceny.filter((r) => String(r?.comment?.text ?? "").trim()).length >= MAX_OPINII) break;
    }

    // Oferty z zamówień → produkty w sklepie (tylko te oferty — lekkie zapytanie).
    const idOfert = [...new Set(oceny.flatMap((r) => ((r?.order?.offers ?? []) as any[]).map((o) => String(o?.id))).filter(Boolean))];
    const produktyOfert = new Map<string, string>();
    for (let i = 0; i < idOfert.length; i += 200) {
      const { data } = await sb.from("allegro_oferty").select("oferta_id, produkt_id").in("oferta_id", idOfert.slice(i, i + 200));
      for (const w of data ?? []) if (w.produkt_id) produktyOfert.set(String(w.oferta_id), String(w.produkt_id));
    }

    const opinie = oceny
      .map((r) => zOceny(r, produktyOfert))
      .filter((o): o is OpiniaAllegro => o !== null)
      .sort((a, b) => b.data.localeCompare(a.data))
      .slice(0, MAX_OPINII);

    const wartosc: OpinieAllegro = { czas: new Date().toISOString(), podsumowanie, opinie };
    const { error } = await sb.from("ustawienia").upsert({ klucz: KLUCZ_OPINII_ALLEGRO, wartosc, zaktualizowano: wartosc.czas });
    if (error) return { ok: false, blad: error.message };
    revalidateTag(TAG_OPINII_ALLEGRO);
    return { ok: true, opinii: opinie.length, ocen: podsumowanie.ocen };
  } catch (e) {
    // Najczęściej 403 = połączenie z Allegro bez uprawnienia do ocen (trzeba połączyć ponownie).
    return { ok: false, blad: bezTokenow(e instanceof Error ? e.message : "Nieznany błąd").slice(0, 300) };
  }
}

async function czytaj(): Promise<OpinieAllegro | null> {
  const sb = sbService();
  if (!sb) return null;
  const { data } = await sb.from("ustawienia").select("wartosc").eq("klucz", KLUCZ_OPINII_ALLEGRO).maybeSingle();
  const w = data?.wartosc as OpinieAllegro | undefined;
  return w && Array.isArray(w.opinie) && w.podsumowanie ? w : null;
}

/** Opinie z Allegro z pamięci podręcznej (odświeżane po każdym pobraniu z Allegro, najpóźniej co 12 h). */
export const opinieAllegro = unstable_cache(czytaj, ["allegro-opinie"], { tags: [TAG_OPINII_ALLEGRO], revalidate: 43200 });

/** Opinie na kartę produktu: najpierw o tym produkcie (i jego wariantach), potem najnowsze. */
export function opinieDoProduktu(wszystkie: OpiniaAllegro[], idProduktow: string[], ile = 4): OpiniaAllegro[] {
  const ids = new Set(idProduktow);
  const oTym = wszystkie.filter((o) => o.produkty.some((p) => ids.has(p)));
  const reszta = wszystkie.filter((o) => !oTym.includes(o));
  return [...oTym, ...reszta].slice(0, ile);
}
