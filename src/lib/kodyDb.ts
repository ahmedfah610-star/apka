import { sbService, supabaseWlaczony } from "@/lib/supabase";

// Kody rabatowe — warstwa danych. Walidacja zawsze po stronie serwera.

export interface Kod {
  kod: string;
  typ: "procent" | "kwota";
  wartosc: number;
  minKoszyk: number;
  aktywny: boolean;
  waznyDo: string | null;
  limitUzyc: number | null;
  uzyto: number;
  createdAt: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function zRzedu(r: any): Kod {
  return {
    kod: r.kod,
    typ: r.typ,
    wartosc: Number(r.wartosc),
    minKoszyk: Number(r.min_koszyk ?? 0),
    aktywny: !!r.aktywny,
    waznyDo: r.wazny_do ?? null,
    limitUzyc: r.limit_uzyc ?? null,
    uzyto: Number(r.uzyto ?? 0),
    createdAt: r.created_at,
  };
}

export async function listaKodow(): Promise<Kod[]> {
  if (!supabaseWlaczony()) return [];
  const sb = sbService();
  if (!sb) return [];
  const { data, error } = await sb.from("kody_rabatowe").select("*").order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(zRzedu);
}

export interface WynikWaznosci {
  ok: boolean;
  blad?: string;
  kod?: Kod;
  rabat?: number; // kwota rabatu w zł dla podanej sumy
}

/** Sprawdza kod względem sumy koszyka i zwraca kwotę rabatu (zł). */
export async function sprawdzKod(kodTekst: string, suma: number): Promise<WynikWaznosci> {
  if (!supabaseWlaczony()) return { ok: false, blad: "Kody są chwilowo niedostępne." };
  const sb = sbService();
  if (!sb) return { ok: false, blad: "Brak konfiguracji." };
  const kodU = (kodTekst || "").trim().toUpperCase();
  if (!kodU) return { ok: false, blad: "Podaj kod." };

  const { data, error } = await sb.from("kody_rabatowe").select("*").eq("kod", kodU).maybeSingle();
  if (error) return { ok: false, blad: "Błąd sprawdzania kodu." };
  if (!data) return { ok: false, blad: "Nieprawidłowy kod." };
  const k = zRzedu(data);

  if (!k.aktywny) return { ok: false, blad: "Kod jest nieaktywny." };
  if (k.waznyDo && new Date(k.waznyDo).getTime() < Date.now()) return { ok: false, blad: "Kod wygasł." };
  if (k.limitUzyc !== null && k.uzyto >= k.limitUzyc) return { ok: false, blad: "Kod został już wykorzystany." };
  if (suma < k.minKoszyk) return { ok: false, blad: `Kod działa od ${k.minKoszyk.toFixed(2).replace(".", ",")} zł w koszyku.` };

  const surowy = k.typ === "procent" ? (suma * k.wartosc) / 100 : k.wartosc;
  const rabat = Math.min(Math.round(surowy * 100) / 100, suma); // nie więcej niż wartość koszyka
  return { ok: true, kod: k, rabat };
}

/** Zwiększa licznik użyć kodu (po opłaceniu zamówienia). */
export async function zuzyjKod(kodTekst: string): Promise<void> {
  const sb = sbService();
  if (!sb) return;
  await sb.rpc("uzyj_kodu", { p_kod: (kodTekst || "").trim().toUpperCase() }).then(
    () => {},
    () => {},
  );
}
