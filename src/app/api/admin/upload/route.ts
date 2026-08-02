import { czyAdmin, odmowa } from "@/lib/adminAuth";
import { sbService } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const BUCKET = "produkty";

// Wgranie zdjęcia do Supabase Storage (bucket "produkty", publiczny).
export async function POST(req: Request) {
  if (!czyAdmin()) return odmowa();
  const sb = sbService();
  if (!sb) return Response.json({ ok: false, powod: "brak_bazy" }, { status: 501 });

  const form = await req.formData();
  const plik = form.get("plik") as File | null;
  if (!plik) return Response.json({ ok: false, powod: "brak_pliku" }, { status: 400 });

  const bufor = new Uint8Array(await plik.arrayBuffer());
  const bezpieczna = (plik.name || "zdjecie").replace(/[^a-zA-Z0-9.]+/g, "-").slice(-40);
  const sciezka = `${Date.now()}-${bezpieczna}`;

  const { error } = await sb.storage.from(BUCKET).upload(sciezka, bufor, {
    contentType: plik.type || "image/jpeg",
    upsert: false,
  });
  if (error) return Response.json({ ok: false, blad: error.message }, { status: 500 });

  const { data } = sb.storage.from(BUCKET).getPublicUrl(sciezka);
  return Response.json({ ok: true, url: data.publicUrl });
}
