// Dziennik wysłanych maili (podgląd w panelu: Zamówienia → Maile). Każdy mail jako wpis
// w tabeli `ustawienia` (klucz „mail:<czas>-<los>"), z pełną treścią HTML — tylko dla admina
// (RLS: tabela niedostępna publicznie). Wpisy starsze niż 180 dni są usuwane.

import { sbService } from "@/lib/supabase";

export const PREFIKS_MAILA = "mail:";
const RETENCJA_DNI = 180;

export type TypMaila =
  | "zamowienie"
  | "sklep"
  | "wysylka"
  | "opinia"
  | "koszyk"
  | "dostepnosc"
  | "powitanie"
  | "konto"
  | "kontakt"
  | "newsletter"
  | "test"
  | "inny";

export interface WpisMaila {
  do: string;
  temat: string;
  typ: TypMaila;
  ok: boolean;
  blad?: string;
  idResend?: string;
  czas: string;
  html: string;
}

/** Zapis do dziennika — nigdy nie przerywa wysyłki (błąd zapisu jest tylko logowany). */
export async function zapiszMail(w: Omit<WpisMaila, "czas">): Promise<void> {
  const sb = sbService();
  if (!sb) return;
  const teraz = new Date();
  const klucz = `${PREFIKS_MAILA}${teraz.toISOString()}-${Math.random().toString(36).slice(2, 7)}`;
  try {
    const { error } = await sb
      .from("ustawienia")
      .insert({ klucz, wartosc: { ...w, czas: teraz.toISOString(), html: w.html.slice(0, 400_000) }, zaktualizowano: teraz.toISOString() });
    if (error) console.error("[mailLog] zapis:", error.message);
    // Sprzątanie starych wpisów od czasu do czasu.
    if (Math.random() < 0.05) {
      const granica = new Date(teraz.getTime() - RETENCJA_DNI * 86400000).toISOString();
      await sb.from("ustawienia").delete().like("klucz", `${PREFIKS_MAILA}%`).lt("klucz", PREFIKS_MAILA + granica);
    }
  } catch (e) {
    console.error("[mailLog] wyjątek:", e instanceof Error ? e.message : e);
  }
}
