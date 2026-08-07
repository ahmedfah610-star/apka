import { czyAdmin, odmowa } from "@/lib/adminAuth";
import { sbService } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const BUCKET = "produkty";
const DOZWOLONE_TYPY = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
const MAX_ROZMIAR = 6 * 1024 * 1024; // 6 MB

// Wgranie zdjęcia do Supabase Storage (bucket "produkty", publiczny).
export async function POST(req: Request) {
  if (!czyAdmin()) return odmowa();
  const sb = sbService();
  if (!sb) return Response.json({ ok: false, powod: "brak_bazy" }, { status: 501 });

  const form = await req.formData();
  const plik = form.get("plik") as File | null;
  if (!plik) return Response.json({ ok: false, powod: "brak_pliku" }, { status: 400 });

  // Tylko obrazy, rozsądny rozmiar — bez wykonywalnych/dowolnych plików.
  if (!DOZWOLONE_TYPY.includes(plik.type)) {
    return Response.json({ ok: false, blad: "Dozwolone są tylko obrazy (JPG, PNG, WEBP, AVIF, GIF)." }, { status: 400 });
  }
  if (plik.size > MAX_ROZMIAR) {
    return Response.json({ ok: false, blad: "Plik jest za duży (max 6 MB)." }, { status: 400 });
  }

  const bufor = new Uint8Array(await plik.arrayBuffer());
  const bezpieczna = (plik.name || "zdjecie").replace(/[^a-zA-Z0-9.]+/g, "-").slice(-40);
  const sciezka = `${Date.now()}-${bezpieczna}`;

  const { error } = await sb.storage.from(BUCKET).upload(sciezka, bufor, {
    contentType: plik.type,
    upsert: false,
  });
  if (error) return Response.json({ ok: false, blad: error.message }, { status: 500 });

  const { data } = sb.storage.from(BUCKET).getPublicUrl(sciezka);
  return Response.json({ ok: true, url: data.publicUrl });
}
