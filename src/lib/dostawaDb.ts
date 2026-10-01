import { unstable_cache } from "next/cache";
import { sbAnon, sbService, supabaseWlaczony } from "@/lib/supabase";
import { DOMYSLNA_DOSTAWA, polaczUstawienia, type UstawieniaDostawy } from "@/lib/dostawa";

// Ustawienia dostawy z bazy (tabela `ustawienia`, klucz "dostawa"). Gdy bazy brak albo
// nic nie zapisano — wartości z kodu. Cache z tagiem: zapis w panelu go unieważnia.
export const TAG_DOSTAWY = "ustawienia-dostawa";

async function czytaj(): Promise<UstawieniaDostawy> {
  if (!supabaseWlaczony()) return DOMYSLNA_DOSTAWA;
  const sb = sbService() ?? sbAnon();
  if (!sb) return DOMYSLNA_DOSTAWA;
  const { data, error } = await sb.from("ustawienia").select("wartosc").eq("klucz", "dostawa").maybeSingle();
  if (error || !data) return polaczUstawienia(null);
  return polaczUstawienia(data.wartosc);
}

export const pobierzDostawe = unstable_cache(czytaj, ["ustawienia-dostawa"], { tags: [TAG_DOSTAWY], revalidate: 600 });
