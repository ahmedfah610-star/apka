import { aktualnyToken, allegroGet } from "@/lib/allegro";
import { czyDamski, kluczScalania, mapujOferte, szczegoly } from "@/lib/allegroImport";
import { porownajRozmiary } from "@/lib/rozmiary";
import { powiadomOOdblokowaniu } from "@/lib/restock";
import { odswiezPoZmianieStanu } from "@/lib/rewalidacja";
import { BAZA_URL } from "@/lib/seo";
import { sbService } from "@/lib/supabase";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Codzienna synchronizacja stanów: ilość sztuk na Allegro → ilość w sklepie.
// Allegro jest źródłem prawdy dla ilości. Każda oferta (= zwykle jeden rozmiar) jest raz
// powiązana z produktem i rozmiarem w sklepie (tabela allegro_oferty); potem wystarczy
// sama lista ofert z ilościami (kilka zapytań), bez pobierania szczegółów.
// Bezpieczniki: niepełna lista ofert albo podejrzanie dużo zer → nic nie zmieniamy.

export const KLUCZ_RAPORTU = "allegro_stany";

export interface ZmianaStanu { produkt: string; nazwa: string; rozmiar: string | null; z: number; na: number }
export interface RaportStanow {
  czas: string;
  ok: boolean;
  zrodlo: string;
  czasMs: number;
  aktywneOferty: number;
  pominieteDamskie: number;
  powiazane: number;
  nowoPowiazane: number;
  doPowiazaniaZostalo: number;
  niedopasowane: number;
  niedopasowaneLista: { oferta: string; nazwa: string; rozmiar: string | null }[];
  zmienione: number;
  zmianyLista: ZmianaStanu[];
  bezPowiazania: number; // rozmiary w sklepie, dla których nie znaleziono oferty na Allegro
  blad?: string;
}

interface OfertaLista { id: string; name?: string; stock?: { available?: number }; publication?: { status?: string } }
interface Powiazanie { oferta_id: string; produkt_id: string | null; rozmiar: string | null; nazwa: string | null; ostatni_stan: number | null; sprawdzono: string }

const ROZMIAR_BRAK = ""; // produkt bez rozmiarów — ilość trafia do `stan`
const PONOW_NIEDOPASOWANE_PO_DNIACH = 3;
const MAX_UDZIAL_ZER = 0.3; // więcej rozmiarów wyzerowanych naraz = coś nie tak po stronie Allegro/API

async function wszystkieAktywne(): Promise<OfertaLista[]> {
  const wynik: OfertaLista[] = [];
  const limit = 1000;
  let razem: number | null = null;
  for (let offset = 0; offset < 20000; offset += limit) {
    const d = await allegroGet<{ offers?: OfertaLista[]; totalCount?: number }>(
      `/sale/offers?limit=${limit}&offset=${offset}&publication.status=ACTIVE`,
    );
    const partia = d.offers ?? [];
    if (typeof d.totalCount === "number") razem = d.totalCount;
    wynik.push(...partia);
    if (partia.length < limit) break;
  }
  // Ta sama oferta dwa razy albo mniej ofert niż Allegro deklaruje = lista niepewna.
  const unikalne = new Set(wynik.map((o) => o.id)).size;
  if (unikalne !== wynik.length || (razem !== null && unikalne < razem)) {
    throw new Error(`Niepełna lista ofert z Allegro (${unikalne} z ${razem ?? "?"}) — stany bez zmian.`);
  }
  return wynik;
}

// Równoległe pobieranie szczegółów z limitem czasu (plan Hobby: funkcja do 60 s).
async function poKolei<T, W>(elementy: T[], rownolegle: number, koniecCzasu: number, f: (e: T) => Promise<W>): Promise<W[]> {
  const wyniki: W[] = [];
  let i = 0;
  const watek = async () => {
    while (i < elementy.length && Date.now() < koniecCzasu) {
      const e = elementy[i++];
      wyniki.push(await f(e));
    }
  };
  await Promise.all(Array.from({ length: rownolegle }, watek));
  return wyniki;
}

export async function synchronizujStany(opcje: { zrodlo?: string; budzetMs?: number } = {}): Promise<RaportStanow> {
  const start = Date.now();
  const raport: RaportStanow = {
    czas: new Date().toISOString(),
    ok: false,
    zrodlo: opcje.zrodlo ?? "reczne",
    czasMs: 0,
    aktywneOferty: 0,
    pominieteDamskie: 0,
    powiazane: 0,
    nowoPowiazane: 0,
    doPowiazaniaZostalo: 0,
    niedopasowane: 0,
    niedopasowaneLista: [],
    zmienione: 0,
    zmianyLista: [],
    bezPowiazania: 0,
  };
  const sb = sbService();
  if (!sb) return { ...raport, blad: "Brak bazy." };

  const zakoncz = async (r: RaportStanow) => {
    r.czasMs = Date.now() - start;
    await sb.from("ustawienia").upsert({ klucz: KLUCZ_RAPORTU, wartosc: r, zaktualizowano: new Date().toISOString() });
    return r;
  };

  try {
    if (!(await aktualnyToken())) {
      return zakoncz({ ...raport, blad: "Brak połączenia z Allegro — połącz ponownie w panelu (Import z Allegro)." });
    }

    // 1. Aktywne oferty z ilościami.
    const oferty = await wszystkieAktywne();
    if (oferty.length === 0) return zakoncz({ ...raport, blad: "Allegro zwróciło 0 aktywnych ofert — stany bez zmian." });
    const wlasciwe = oferty.filter((o) => !czyDamski(String(o.name ?? "")));
    raport.aktywneOferty = oferty.length;
    raport.pominieteDamskie = oferty.length - wlasciwe.length;
    const aktywne = new Map(wlasciwe.map((o) => [o.id, o]));

    // 2. Produkty sklepu (z Allegro) — do dopasowania nowych ofert.
    const produkty: any[] = [];
    for (let from = 0; from < 30000; from += 1000) {
      const { data, error } = await sb
        .from("produkty")
        .select("id, nazwa, kolor, cena, opis, rozmiary")
        .like("id", "al-%")
        .order("id")
        .range(from, from + 999);
      if (error) throw new Error(error.message);
      produkty.push(...(data ?? []));
      if ((data ?? []).length < 1000) break;
    }
    const istnieje = new Set(produkty.map((p) => String(p.id)));
    const poKluczu = new Map<string, any[]>();
    const poNazwie = new Map<string, any[]>();
    const dodaj = (m: Map<string, any[]>, k: string, p: any) => m.set(k, [...(m.get(k) ?? []), p]);
    for (const p of produkty) {
      const k = kluczScalania(p);
      dodaj(poKluczu, k, p);
      dodaj(poNazwie, k.split("|").slice(0, 2).join("|"), p);
    }

    // 3. Powiązania oferta → produkt + rozmiar.
    const { data: zapisane, error: ePow } = await sb.from("allegro_oferty").select("*");
    if (ePow) throw new Error(ePow.message);
    const powiazania = new Map<string, Powiazanie>(((zapisane ?? []) as Powiazanie[]).map((p) => [p.oferta_id, p]));

    const ponowOd = Date.now() - PONOW_NIEDOPASOWANE_PO_DNIACH * 86400000;
    const doSprawdzenia = wlasciwe.filter((o) => {
      const p = powiazania.get(o.id);
      if (!p) return true;
      if (p.produkt_id) return !istnieje.has(p.produkt_id); // produkt scalony na nowo/usunięty
      return new Date(p.sprawdzono).getTime() < ponowOd;
    });

    const wybierz = (kandydaci: any[] | undefined, rozmiar: string | null): any | null => {
      if (!kandydaci?.length) return null;
      if (kandydaci.length === 1) return kandydaci[0];
      const zRozmiarem = rozmiar ? kandydaci.filter((p) => (p.rozmiary ?? []).map(String).includes(rozmiar)) : [];
      return zRozmiarem.length === 1 ? zRozmiarem[0] : null; // niejednoznaczne — lepiej nie zgadywać
    };

    const koniecCzasu = start + (opcje.budzetMs ?? 38000);
    const nowe = await poKolei(doSprawdzenia, 8, koniecCzasu, async (o): Promise<Powiazanie | null> => {
      try {
        const det = await szczegoly(o.id);
        const m = mapujOferte({ ...det, id: det?.id ?? o.id, name: det?.name ?? o.name });
        const klucz = kluczScalania(m.wiersz);
        const produkt =
          wybierz(poKluczu.get(klucz), m.rozmiar) ?? wybierz(poNazwie.get(klucz.split("|").slice(0, 2).join("|")), m.rozmiar);
        return {
          oferta_id: o.id,
          produkt_id: produkt ? String(produkt.id) : null,
          rozmiar: m.rozmiar,
          nazwa: String(o.name ?? det?.name ?? "").slice(0, 200),
          ostatni_stan: null,
          sprawdzono: new Date().toISOString(),
        };
      } catch {
        return null; // spróbujemy przy następnej synchronizacji
      }
    });
    const udane = nowe.filter((x): x is Powiazanie => x !== null);
    for (let i = 0; i < udane.length; i += 200) {
      const { error } = await sb.from("allegro_oferty").upsert(udane.slice(i, i + 200), { onConflict: "oferta_id" });
      if (error) throw new Error(error.message);
    }
    for (const p of udane) powiazania.set(p.oferta_id, p);
    raport.nowoPowiazane = udane.filter((p) => p.produkt_id).length;
    raport.doPowiazaniaZostalo = doSprawdzenia.length - udane.length;
    const kompletne = raport.doPowiazaniaZostalo === 0;

    for (const o of wlasciwe) {
      const p = powiazania.get(o.id);
      if (p && !p.produkt_id) {
        raport.niedopasowane++;
        if (raport.niedopasowaneLista.length < 40) raport.niedopasowaneLista.push({ oferta: o.id, nazwa: p.nazwa ?? String(o.name ?? ""), rozmiar: p.rozmiar });
      }
    }

    // 4. Docelowe ilości: produkt → rozmiar → sztuk (kilka ofert na ten sam rozmiar → większa, jak przy imporcie).
    const cel = new Map<string, Map<string, number>>();
    const ustaw = (produkt: string, rozmiar: string, ilosc: number) => {
      const m = cel.get(produkt) ?? new Map<string, number>();
      m.set(rozmiar, Math.max(m.get(rozmiar) ?? 0, ilosc));
      cel.set(produkt, m);
    };
    for (const p of powiazania.values()) {
      if (!p.produkt_id || !istnieje.has(p.produkt_id)) continue;
      const o = aktywne.get(p.oferta_id);
      const rozmiar = p.rozmiar ?? ROZMIAR_BRAK;
      if (o) {
        raport.powiazane++;
        ustaw(p.produkt_id, rozmiar, Math.max(0, Math.floor(Number(o.stock?.available) || 0)));
      } else if (kompletne) {
        // Oferta już nieaktywna (wyprzedana/zakończona). Zero tylko wtedy, gdy wszystkie
        // aktywne oferty są powiązane — inaczej mogła zostać wystawiona na nowo.
        ustaw(p.produkt_id, rozmiar, 0);
      }
    }

    // 5. Porównanie z aktualnym stanem sklepu (świeży odczyt — tuż przed zapisem).
    const ids = [...cel.keys()];
    const obecne: any[] = [];
    for (let i = 0; i < ids.length; i += 200) {
      const { data, error } = await sb.from("produkty").select("id, nazwa, rozmiary, stan, stan_rozmiary").in("id", ids.slice(i, i + 200));
      if (error) throw new Error(error.message);
      obecne.push(...(data ?? []));
    }

    let rozmiarowSklepu = 0;
    let doWyzerowania = 0;
    const aktualizacje: { p: any; sr: Record<string, number> | null; stan: number; rozmiary: string[]; zmiany: ZmianaStanu[] }[] = [];
    for (const p of obecne) {
      const docelowe = cel.get(p.id)!;
      const sr: Record<string, number> = { ...((p.stan_rozmiary as Record<string, number> | null) ?? {}) };
      const rozmiary = new Set<string>((p.rozmiary ?? []).map(String));
      const zmiany: ZmianaStanu[] = [];
      let stanBezRozmiaru: number | null = null;
      for (const [rozmiar, ilosc] of docelowe) {
        if (rozmiar === ROZMIAR_BRAK) {
          stanBezRozmiaru = ilosc;
          if ((p.stan ?? 0) !== ilosc) zmiany.push({ produkt: p.id, nazwa: p.nazwa, rozmiar: null, z: p.stan ?? 0, na: ilosc });
          continue;
        }
        const bylo = Number(sr[rozmiar] ?? 0);
        if (bylo !== ilosc || !(rozmiar in sr)) {
          if (bylo !== ilosc) zmiany.push({ produkt: p.id, nazwa: p.nazwa, rozmiar, z: bylo, na: ilosc });
          if (bylo > 0 && ilosc === 0) doWyzerowania++;
          sr[rozmiar] = ilosc;
        }
        if (ilosc > 0) rozmiary.add(rozmiar);
      }
      for (const r of Object.keys((p.stan_rozmiary as Record<string, number> | null) ?? {})) {
        rozmiarowSklepu++;
        if (!docelowe.has(r)) raport.bezPowiazania++;
      }
      if (!zmiany.length) continue;
      const maRozmiary = Object.keys(sr).length > 0;
      const stan = maRozmiary ? Object.values(sr).reduce((s, v) => s + (Number(v) || 0), 0) : (stanBezRozmiaru ?? p.stan ?? 0);
      aktualizacje.push({ p, sr: maRozmiary ? sr : null, stan, rozmiary: [...rozmiary].sort(porownajRozmiary), zmiany });
    }

    if (rozmiarowSklepu > 20 && doWyzerowania > rozmiarowSklepu * MAX_UDZIAL_ZER) {
      return zakoncz({
        ...raport,
        blad: `Wstrzymano: synchronizacja wyzerowałaby ${doWyzerowania} z ${rozmiarowSklepu} rozmiarów naraz — to wygląda na błąd po stronie Allegro. Stany bez zmian.`,
      });
    }

    // 6. Zapis tylko zmienionych produktów + maile „znów dostępne".
    for (let i = 0; i < aktualizacje.length; i += 10) {
      await Promise.all(
        aktualizacje.slice(i, i + 10).map(async (a) => {
          const { error } = await sb
            .from("produkty")
            .update({ stan_rozmiary: a.sr, stan: a.stan, rozmiary: a.rozmiary })
            .eq("id", a.p.id);
          if (error) return;
          raport.zmienione++;
          for (const z of a.zmiany) if (raport.zmianyLista.length < 80) raport.zmianyLista.push(z);
          try {
            await powiadomOOdblokowaniu(sb, a.p.id, a.p.nazwa ?? "Produkt", BAZA_URL, a.p.stan ?? null, a.p.stan_rozmiary ?? null, a.stan, a.sr);
          } catch {
            /* mail nie blokuje synchronizacji */
          }
        }),
      );
    }

    // Ostatnio widziana ilość na Allegro (podgląd w panelu / diagnostyka).
    const widziane = [...powiazania.values()]
      .filter((p) => p.produkt_id && aktywne.has(p.oferta_id))
      .map((p) => ({ ...p, ostatni_stan: Math.max(0, Math.floor(Number(aktywne.get(p.oferta_id)!.stock?.available) || 0)) }));
    for (let i = 0; i < widziane.length; i += 500) {
      await sb.from("allegro_oferty").upsert(widziane.slice(i, i + 500), { onConflict: "oferta_id" });
    }

    if (raport.zmienione > 0) odswiezPoZmianieStanu();
    return zakoncz({ ...raport, ok: true });
  } catch (e) {
    return zakoncz({ ...raport, blad: e instanceof Error ? e.message : "Nieznany błąd synchronizacji." });
  }
}

export async function ostatniRaport(): Promise<RaportStanow | null> {
  const sb = sbService();
  if (!sb) return null;
  const { data } = await sb.from("ustawienia").select("wartosc").eq("klucz", KLUCZ_RAPORTU).maybeSingle();
  return (data?.wartosc as RaportStanow | undefined) ?? null;
}
