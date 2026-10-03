import { czyDamski, hash36, kluczScalania, mapujOferte, nazwaBezRozmiarow, szczegoly } from "@/lib/allegroImport";
import { wszystkieAktywne } from "@/lib/allegroStany";
import { ladnaNazwa } from "@/lib/nazwa";
import { porownajRozmiary } from "@/lib/rozmiary";
import { sbService } from "@/lib/supabase";

/* eslint-disable @typescript-eslint/no-explicit-any */

// „Pobierz nowe z Allegro": bez kasowania i bez pobierania wszystkiego od nowa.
// 1) lista aktywnych ofert vs. oferty już powiązane ze sklepem → kandydaci,
// 2) kandydaci porcjami: szczegóły oferty → jest już w sklepie? (powiąż / dołóż rozmiar)
//    : nowy produkt (wstaw). Istniejących produktów nie zmieniamy poza dołożeniem
//    brakującego rozmiaru; niejednoznaczne przypadki zostają do sprawdzenia ręcznie.

export interface Kandydat { id: string; nazwa: string }
export type WynikOferty = {
  oferta: string;
  nazwa: string;
  wynik: "dodany" | "nowy-rozmiar" | "brak-rozmiaru" | "jest" | "do-sprawdzenia" | "blad";
  produkt?: string;
  rozmiar?: string | null;
  info?: string;
};

async function strony<T>(zapytanie: (od: number, doo: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const wynik: T[] = [];
  for (let od = 0; od < 50000; od += 1000) {
    const { data, error } = await zapytanie(od, od + 999);
    if (error) throw new Error(error.message);
    wynik.push(...(data ?? []));
    if ((data ?? []).length < 1000) break;
  }
  return wynik;
}

/** Aktywne oferty (bez damskich), których sklep jeszcze nie ma powiązanych z produktem. */
export async function kandydaciDoPobrania(): Promise<{ aktywne: number; kandydaci: Kandydat[] }> {
  const sb = sbService();
  if (!sb) throw new Error("Brak bazy.");
  const oferty = (await wszystkieAktywne()).filter((o) => !czyDamski(String(o.name ?? "")));
  const ids = new Set((await strony<{ id: string }>((od, doo) => sb.from("produkty").select("id").order("id").range(od, doo))).map((p) => p.id));
  const powiazane = new Set(
    (await strony<{ oferta_id: string; produkt_id: string | null }>((od, doo) => sb.from("allegro_oferty").select("oferta_id, produkt_id").order("oferta_id").range(od, doo)))
      .filter((p) => p.produkt_id && ids.has(p.produkt_id))
      .map((p) => p.oferta_id),
  );
  return { aktywne: oferty.length, kandydaci: oferty.filter((o) => !powiazane.has(o.id)).map((o) => ({ id: o.id, nazwa: String(o.name ?? "") })) };
}

/** Przetwarza porcję ofert (do ~15, mieści się w limicie funkcji). */
export async function pobierzPorcje(
  idOfert: string[],
  opcje: { dokladajRozmiary?: boolean; noweProdukty?: string[] } = {},
): Promise<WynikOferty[]> {
  const sb = sbService();
  if (!sb) throw new Error("Brak bazy.");
  // Istniejących produktów domyślnie NIE ruszamy. Rozmiary dokładamy tylko do produktów
  // dodanych w tym samym pobieraniu (kolejne rozmiary nowości) albo gdy admin to zaznaczy.
  const noweTeraz = new Set(opcje.noweProdukty ?? []);
  const wolnoDokladac = (pid: string) => !!opcje.dokladajRozmiary || noweTeraz.has(pid);

  // Indeks produktów sklepu do dopasowania (ten sam klucz co przy imporcie/synchronizacji).
  const produkty = await strony<any>((od, doo) => sb.from("produkty").select("id, nazwa, kolor, cena, opis, rozmiary").like("id", "al-%").order("id").range(od, doo));
  const poKluczu = new Map<string, any[]>();
  const poNazwie = new Map<string, any[]>();
  const dodaj = (m: Map<string, any[]>, k: string, p: any) => m.set(k, [...(m.get(k) ?? []), p]);
  for (const p of produkty) {
    const k = kluczScalania(p);
    dodaj(poKluczu, k, p);
    dodaj(poNazwie, k.split("|").slice(0, 2).join("|"), p);
  }
  const jedenZ = (kandydaci: any[] | undefined, rozmiar: string | null): any | null | "wiele" => {
    if (!kandydaci?.length) return null;
    if (kandydaci.length === 1) return kandydaci[0];
    const zRozmiarem = rozmiar ? kandydaci.filter((p) => (p.rozmiary ?? []).map(String).includes(rozmiar)) : [];
    return zRozmiarem.length === 1 ? zRozmiarem[0] : "wiele";
  };

  // Szczegóły ofert równolegle (po 4), zapisy po kolei — dwa rozmiary nowego produktu w jednej porcji nie zdublują go.
  const szczeg: { id: string; det?: any; blad?: string }[] = [];
  for (let i = 0; i < idOfert.length; i += 4) {
    szczeg.push(
      ...(await Promise.all(
        idOfert.slice(i, i + 4).map(async (id) => {
          try {
            return { id, det: await szczegoly(id) };
          } catch (e) {
            return { id, blad: e instanceof Error ? e.message.slice(0, 160) : "błąd pobierania" };
          }
        }),
      )),
    );
  }

  const wyniki: WynikOferty[] = [];
  for (const { id, det, blad } of szczeg) {
    if (!det) {
      wyniki.push({ oferta: id, nazwa: "", wynik: "blad", info: blad });
      continue;
    }
    const nazwaOferty = String(det?.name ?? "");
    try {
      if (czyDamski(nazwaOferty)) continue;
      const m = mapujOferte({ ...det, id: det?.id ?? id, name: nazwaOferty });
      const w = m.wiersz;
      const klucz = kluczScalania(w);
      const zKlucza = jedenZ(poKluczu.get(klucz), m.rozmiar);
      const zNazwy = zKlucza ? null : jedenZ(poNazwie.get(klucz.split("|").slice(0, 2).join("|")), m.rozmiar);
      const dopasowany = zKlucza && zKlucza !== "wiele" ? zKlucza : zNazwy && zNazwy !== "wiele" ? zNazwy : null;
      const opisRozmiaru = m.rozmiar ? (w.opis_rozmiary as Record<string, string> | null)?.[m.rozmiar] : undefined;
      const powiaz = (produktId: string) =>
        sb.from("allegro_oferty").upsert(
          { oferta_id: id, produkt_id: produktId, rozmiar: m.rozmiar, nazwa: nazwaOferty.slice(0, 200), sprawdzono: new Date().toISOString() },
          { onConflict: "oferta_id" },
        );

      // Produkt już jest: powiązujemy ofertę; brakujący rozmiar dokładamy tylko, gdy wolno.
      const istniejacy = async (pid: string) => {
        const brak = m.rozmiar ? !(await maRozmiar(sb, pid, m.rozmiar)) : false;
        const dolozony = brak && wolnoDokladac(pid) ? await dolozRozmiar(sb, pid, m.rozmiar, m.sztuk, opisRozmiaru) : false;
        await powiaz(pid);
        wyniki.push({
          oferta: id,
          nazwa: nazwaOferty,
          wynik: dolozony ? "nowy-rozmiar" : brak ? "brak-rozmiaru" : "jest",
          produkt: pid,
          rozmiar: m.rozmiar,
        });
      };
      if (dopasowany) {
        await istniejacy(String(dopasowany.id));
        continue;
      }
      if (zKlucza === "wiele" || zNazwy === "wiele") {
        // Kilka podobnych produktów — nie zgadujemy (mógłby powstać duplikat).
        wyniki.push({ oferta: id, nazwa: nazwaOferty, wynik: "do-sprawdzenia", rozmiar: m.rozmiar, info: "kilka podobnych produktów w sklepie" });
        continue;
      }

      // Nowy produkt — id jak przy scalaniu (kolejne rozmiary tego samego produktu trafią do niego).
      const idProduktu = "al-m-" + hash36(klucz);
      const { data: juz } = await sb.from("produkty").select("id").eq("id", idProduktu).maybeSingle();
      if (juz) {
        await istniejacy(idProduktu);
        continue;
      }
      const nowy = {
        id: idProduktu,
        allegro_id: idProduktu.slice(3),
        nazwa: ladnaNazwa(nazwaBezRozmiarow(String(w.nazwa ?? ""))) || String(w.nazwa ?? nazwaOferty),
        cena: w.cena,
        kategoria: w.kategoria,
        wiek: w.wiek,
        wiek_label: w.wiek_label,
        badge: null,
        rozmiary: w.rozmiary,
        kolor: w.kolor,
        zdjecie: w.zdjecie,
        zdjecia: w.zdjecia,
        opis: w.opis,
        opis_html: w.opis_html,
        opis_rozmiary: w.opis_rozmiary,
        stan: w.stan,
        stan_rozmiary: w.stan_rozmiary,
        ukryty: false,
        hue: w.hue,
      };
      const { error } = await sb.from("produkty").insert(nowy);
      if (error) throw new Error(error.message);
      await powiaz(idProduktu);
      // Kolejne oferty tej porcji mogą być innymi rozmiarami tego produktu.
      const wpis = { id: idProduktu, nazwa: w.nazwa, kolor: w.kolor, cena: w.cena, opis: w.opis, rozmiary: w.rozmiary };
      dodaj(poKluczu, klucz, wpis);
      noweTeraz.add(idProduktu);
      wyniki.push({ oferta: id, nazwa: nazwaOferty, wynik: "dodany", produkt: idProduktu, rozmiar: m.rozmiar });
    } catch (e) {
      wyniki.push({ oferta: id, nazwa: nazwaOferty, wynik: "blad", info: e instanceof Error ? e.message.slice(0, 160) : "błąd" });
    }
  }
  return wyniki;
}

async function maRozmiar(sb: any, produktId: string, rozmiar: string): Promise<boolean> {
  const { data } = await sb.from("produkty").select("rozmiary").eq("id", produktId).maybeSingle();
  return (data?.rozmiary ?? []).map(String).includes(rozmiar);
}

// Dokłada rozmiar, którego produkt jeszcze nie ma. Istniejących rozmiarów nie rusza
// (ich ilości ustawia codzienna synchronizacja). true = coś dołożono.
async function dolozRozmiar(sb: any, produktId: string, rozmiar: string | null, sztuk: number, opisHtml?: string): Promise<boolean> {
  if (!rozmiar) return false;
  const { data: p } = await sb.from("produkty").select("rozmiary, stan_rozmiary, opis_rozmiary").eq("id", produktId).maybeSingle();
  if (!p || (p.rozmiary ?? []).map(String).includes(rozmiar)) return false;
  const sr: Record<string, number> = { ...(p.stan_rozmiary ?? {}), [rozmiar]: Math.max(0, Math.floor(sztuk) || 0) };
  const opisy = { ...(p.opis_rozmiary ?? {}) };
  if (opisHtml && !opisy[rozmiar]) opisy[rozmiar] = opisHtml;
  const { error } = await sb
    .from("produkty")
    .update({
      rozmiary: [...(p.rozmiary ?? []), rozmiar].sort(porownajRozmiary),
      stan_rozmiary: sr,
      stan: Object.values(sr).reduce((s, v) => s + (Number(v) || 0), 0),
      opis_rozmiary: Object.keys(opisy).length ? opisy : null,
    })
    .eq("id", produktId);
  return !error;
}
