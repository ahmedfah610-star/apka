import type { Produkt } from "@/data/produkty";
import { czyAdmin, odmowa } from "@/lib/adminAuth";
import { doRzedu, katalogWszystko } from "@/lib/produktyDb";
import { sbService, supabaseWlaczony } from "@/lib/supabase";
import { bazowyUrl } from "@/lib/platnosci";
import { powiadomOOdblokowaniu } from "@/lib/restock";
import { odswiezPoZmianieStanu } from "@/lib/rewalidacja";

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
  odswiezPoZmianieStanu();
  return Response.json({ ok: true });
}

const WIEK_LABEL: Record<string, string> = { "0-2": "0-2 lata", "2-6": "2-6 lat", "6-12": "6-12 lat" };

// Edycja pól (pełna: nazwa, cena, opis, kategoria, wiek, badge, rozmiary,
// zdjęcia, stan, stanRozmiary, ukryty).
export async function PATCH(req: Request) {
  if (!czyAdmin()) return odmowa();
  if (!supabaseWlaczony()) return brakBazy();
  const sb = sbService();
  if (!sb) return brakBazy();
  const { id, zmiany } = (await req.json()) as {
    id: string;
    zmiany: Partial<Produkt>;
  };
  const map: Record<string, unknown> = {};
  if ("nazwa" in zmiany) map.nazwa = zmiany.nazwa;
  if ("cena" in zmiany) map.cena = zmiany.cena;
  if ("opis" in zmiany) map.opis = zmiany.opis ?? null;
  if ("kategoria" in zmiany) map.kategoria = zmiany.kategoria;
  if ("wiek" in zmiany) {
    map.wiek = zmiany.wiek;
    map.wiek_label = WIEK_LABEL[zmiany.wiek as string] ?? zmiany.wiek;
  }
  if ("badge" in zmiany) map.badge = zmiany.badge ?? null;
  if ("ukryty" in zmiany) map.ukryty = zmiany.ukryty;
  if ("rozmiary" in zmiany) map.rozmiary = zmiany.rozmiary ?? [];
  if ("zdjecia" in zmiany) {
    map.zdjecia = zmiany.zdjecia ?? [];
    map.zdjecie = zmiany.zdjecia?.[0] ?? null;
  }
  if ("zdjecie" in zmiany && !("zdjecia" in zmiany)) map.zdjecie = zmiany.zdjecie ?? null;
  const zmianaStanu = "stan" in zmiany || "stanRozmiary" in zmiany;
  if ("stan" in zmiany) map.stan = zmiany.stan ?? null;
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
  odswiezPoZmianieStanu();

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
  odswiezPoZmianieStanu();
  return Response.json({ ok: true });
}
