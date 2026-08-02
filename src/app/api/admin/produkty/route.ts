import type { Produkt } from "@/data/produkty";
import { czyAdmin, odmowa } from "@/lib/adminAuth";
import { doRzedu, katalogWszystko } from "@/lib/produktyDb";
import { sbService, supabaseWlaczony } from "@/lib/supabase";
import { bazowyUrl } from "@/lib/platnosci";
import { powiadomOOdblokowaniu } from "@/lib/restock";

export const dynamic = "force-dynamic";

function brakBazy() {
  return Response.json({ ok: false, powod: "brak_bazy" }, { status: 501 });
}

// Lista wszystkich produktów (także wyłączonych) — panel.
export async function GET() {
  if (!czyAdmin()) return odmowa();
  return Response.json({ items: await katalogWszystko() });
}

// Dodanie produktu.
export async function POST(req: Request) {
  if (!czyAdmin()) return odmowa();
  if (!supabaseWlaczony()) return brakBazy();
  const sb = sbService();
  if (!sb) return brakBazy();
  const p = (await req.json()) as Produkt;
  const { error } = await sb.from("produkty").insert(doRzedu(p));
  if (error) return Response.json({ ok: false, blad: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

// Edycja pól (cena / stan / badge / ukryty).
export async function PATCH(req: Request) {
  if (!czyAdmin()) return odmowa();
  if (!supabaseWlaczony()) return brakBazy();
  const sb = sbService();
  if (!sb) return brakBazy();
  const { id, zmiany } = (await req.json()) as {
    id: string;
    zmiany: Partial<Pick<Produkt, "cena" | "stan" | "badge" | "ukryty" | "stanRozmiary">>;
  };
  const map: Record<string, unknown> = {};
  if ("cena" in zmiany) map.cena = zmiany.cena;
  if ("stan" in zmiany) map.stan = zmiany.stan ?? null;
  if ("badge" in zmiany) map.badge = zmiany.badge ?? null;
  if ("ukryty" in zmiany) map.ukryty = zmiany.ukryty;
  const zmianaStanu = "stan" in zmiany || "stanRozmiary" in zmiany;
  if ("stanRozmiary" in zmiany) {
    map.stan_rozmiary = zmiany.stanRozmiary ?? null;
    // utrzymaj łączny stan w zgodzie z sumą po rozmiarach
    if (zmiany.stanRozmiary) {
      map.stan = Object.values(zmiany.stanRozmiary).reduce((s, v) => s + (Number(v) || 0), 0);
    }
  }

  // Stan sprzed zmiany — do wykrycia „znów dostępne".
  const stary = zmianaStanu
    ? (await sb.from("produkty").select("stan, stan_rozmiary, nazwa").eq("id", id).maybeSingle()).data
    : null;

  const { error } = await sb.from("produkty").update(map).eq("id", id);
  if (error) return Response.json({ ok: false, blad: error.message }, { status: 500 });

  // Powiadomienia o dostępności (nie blokują odpowiedzi przy błędzie).
  if (zmianaStanu && stary) {
    try {
      await powiadomOOdblokowaniu(
        sb,
        id,
        (stary.nazwa as string) ?? "Produkt",
        bazowyUrl(req),
        (stary.stan as number) ?? null,
        (stary.stan_rozmiary as Record<string, number> | null) ?? null,
        (map.stan as number) ?? null,
        (map.stan_rozmiary as Record<string, number> | null) ?? null,
      );
    } catch {
      /* nie przerywaj zapisu z powodu maila */
    }
  }
  return Response.json({ ok: true });
}

// Usunięcie produktu.
export async function DELETE(req: Request) {
  if (!czyAdmin()) return odmowa();
  if (!supabaseWlaczony()) return brakBazy();
  const sb = sbService();
  if (!sb) return brakBazy();
  const { id } = (await req.json()) as { id: string };
  const { error } = await sb.from("produkty").delete().eq("id", id);
  if (error) return Response.json({ ok: false, blad: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
