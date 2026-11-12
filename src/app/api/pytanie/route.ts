import { sbService, supabaseWlaczony } from "@/lib/supabase";
import { ipZadania, wLimicie, limitOdpowiedz } from "@/lib/rateLimit";
import { produktyPoIdSwieze } from "@/lib/produktyDb";
import { sprawdzPytanie, zapiszPytanie } from "@/lib/pytania";
import { wyslijKopiePytania, wyslijPytanieDoSklepu } from "@/lib/mail";

export const dynamic = "force-dynamic";

// „Masz pytanie o ten produkt?" — zapis pytania (panel → Pytania klientów) i powiadomienia mailem.
export async function POST(req: Request) {
  const ip = ipZadania(req);
  // Przed spamem: 3 pytania na 10 min i 10 na dobę z jednego adresu.
  if (!wLimicie(`pytanie:${ip}`, 3, 10 * 60 * 1000) || !wLimicie(`pytanie-dzien:${ip}`, 10, 24 * 3600 * 1000)) return limitOdpowiedz();

  const w = sprawdzPytanie(await req.json().catch(() => ({})));
  if (!w.ok) return Response.json({ ok: false, blad: w.blad }, { status: 400 });
  if (w.bot) return Response.json({ ok: true }); // pułapka na boty — udajemy sukces, nic nie zapisujemy

  const [produkt] = await produktyPoIdSwieze([w.dane.produktId]);
  if (!produkt) return Response.json({ ok: false, blad: "Nie znaleziono produktu." }, { status: 404 });
  const rozmiar = w.dane.rozmiar && (produkt.rozmiary ?? []).map(String).includes(w.dane.rozmiar) ? w.dane.rozmiar : null;

  if (!supabaseWlaczony()) return Response.json({ ok: true });
  const sb = sbService();
  if (!sb) return Response.json({ ok: false, blad: "Nie udało się wysłać pytania. Napisz na adres z zakładki Kontakt." }, { status: 503 });

  const pytanie = {
    produktId: produkt.id,
    nazwa: produkt.nazwa,
    zdjecie: produkt.zdjecie ?? null,
    cena: produkt.cena,
    rozmiar,
    email: w.dane.email,
    tresc: w.dane.tresc,
    czas: new Date().toISOString(),
    status: "nowe" as const,
  };
  try {
    await zapiszPytanie(sb, pytanie);
  } catch {
    return Response.json({ ok: false, blad: "Nie udało się wysłać pytania. Spróbuj za chwilę." }, { status: 500 });
  }
  // Maile nie blokują odpowiedzi przy błędzie — pytanie i tak jest w panelu.
  // Kopia do pytającego najwyżej 2× na dobę na adres — formularz nie posłuży do wysyłania
  // naszych maili z dowolną treścią na cudze adresy.
  const kopia = wLimicie(`pytanie-kopia:${pytanie.email.toLowerCase()}`, 2, 24 * 3600 * 1000);
  await Promise.allSettled([wyslijPytanieDoSklepu(pytanie), ...(kopia ? [wyslijKopiePytania(pytanie)] : [])]);
  return Response.json({ ok: true });
}
