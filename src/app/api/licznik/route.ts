import { sbService, supabaseWlaczony } from "@/lib/supabase";
import { ipZadania, wLimicie } from "@/lib/rateLimit";
import { czyAdmin } from "@/lib/adminAuth";
import { dzien, zapiszZdarzenie, type TypZdarzenia } from "@/lib/licznik";

export const dynamic = "force-dynamic";

const BOT = /bot|crawl|spider|slurp|facebookexternalhit|headless|lighthouse|preview|curl|wget|python|node-fetch|axios/i;
const ID = /^[a-z0-9-]{2,60}$/i;
// Ta sama osoba odświeżająca kartę — liczymy raz dziennie na instancję (bez cookies).
const widziane = new Set<string>();

// Anonimowy licznik: wejście na kartę produktu (w) i dodanie do koszyka (k). Zawsze 204.
export async function POST(req: Request) {
  const pusta = () => new Response(null, { status: 204 });
  if (!supabaseWlaczony() || czyAdmin()) return pusta();
  if (BOT.test(req.headers.get("user-agent") ?? "")) return pusta();
  const ip = ipZadania(req);
  if (!wLimicie(`licznik:${ip}`, 60, 60 * 1000)) return pusta();

  const b = (await req.text().then((t) => JSON.parse(t)).catch(() => ({}))) as { id?: unknown; typ?: unknown };
  const id = String(b.id ?? "");
  const typ = b.typ === "k" ? "k" : b.typ === "w" ? "w" : null;
  if (!typ || !ID.test(id)) return pusta();

  const klucz = `${ip}|${id}|${typ}|${dzien()}`;
  if (widziane.has(klucz)) return pusta();
  if (widziane.size > 20000) widziane.clear();
  widziane.add(klucz);

  const sb = sbService();
  if (sb) await zapiszZdarzenie(sb, id, typ as TypZdarzenia).catch(() => false);
  return pusta();
}
