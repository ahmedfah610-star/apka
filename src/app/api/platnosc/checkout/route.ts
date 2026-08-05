import { sbService, supabaseWlaczony } from "@/lib/supabase";
import { stripe, stripeWlaczony, bazowyUrl } from "@/lib/platnosci";
import { p24Wlaczony, p24Rejestruj } from "@/lib/przelewy24";
import { wyslijMaileZamowienia } from "@/lib/mail";

export const dynamic = "force-dynamic";

interface Pozycja {
  id: string;
  nazwa: string;
  cena: number;
  ilosc: number;
  rozmiar?: string;
}
interface Body {
  pozycje: Pozycja[];
  dostawa: number;
  metoda: string;
  klient?: Record<string, unknown>;
}

export async function POST(req: Request) {
  const b = (await req.json()) as Body;
  const pozycje = Array.isArray(b.pozycje) ? b.pozycje : [];
  if (pozycje.length === 0) return Response.json({ ok: false, blad: "Pusty koszyk" }, { status: 400 });

  // Kwoty liczone po stronie serwera (nie ufamy klientowi).
  const suma = pozycje.reduce((s, p) => s + (Number(p.cena) || 0) * (Number(p.ilosc) || 0), 0);
  const dostawa = Number(b.dostawa) || 0;
  const razem = suma + dostawa;

  // ── Płatność online (Przelewy24) — priorytet, wymaga bazy do zapisu ──
  if (p24Wlaczony() && supabaseWlaczony()) {
    const sb = sbService();
    if (!sb) return Response.json({ ok: false, blad: "Błąd konfiguracji" }, { status: 500 });

    // 1) Zapis zamówienia jako oczekującego (bez zdejmowania stanu).
    const { data, error } = await sb
      .from("zamowienia")
      .insert({ pozycje, suma, dostawa, razem, metoda: b.metoda, klient: b.klient ?? {}, status: "oczekuje_na_platnosc" })
      .select("id")
      .single();
    if (error || !data) return Response.json({ ok: false, blad: error?.message || "Zapis nieudany" }, { status: 500 });
    const zamowienieId = data.id as string;

    // 2) Rejestracja transakcji w Przelewy24 → URL do przekierowania.
    const baza = bazowyUrl(req);
    const rej = await p24Rejestruj({
      sessionId: zamowienieId,
      amount: Math.round(razem * 100),
      email: (b.klient?.email as string) || "",
      description: `Zamowienie ${zamowienieId.slice(0, 8)} - bobas-shopping`,
      urlReturn: `${baza}/zamowienie/dziekujemy?zamowienie=${zamowienieId}`,
      urlStatus: `${baza}/api/platnosc/p24/webhook`,
    });
    if (!rej.ok || !rej.url) return Response.json({ ok: false, blad: rej.blad || "Błąd płatności" }, { status: 500 });

    await sb.from("zamowienia").update({ platnosc_id: zamowienieId }).eq("id", zamowienieId);
    return Response.json({ ok: true, url: rej.url });
  }

  // ── Płatność online (Stripe) — wymaga też bazy do zapisu zamówienia ──
  if (stripeWlaczony() && supabaseWlaczony()) {
    const sb = sbService();
    const sk = stripe();
    if (!sb || !sk) return Response.json({ ok: false, blad: "Błąd konfiguracji" }, { status: 500 });

    // 1) Zapis zamówienia jako oczekującego (bez zdejmowania stanu).
    const { data, error } = await sb
      .from("zamowienia")
      .insert({ pozycje, suma, dostawa, razem, metoda: b.metoda, klient: b.klient ?? {}, status: "oczekuje_na_platnosc" })
      .select("id")
      .single();
    if (error || !data) return Response.json({ ok: false, blad: error?.message || "Zapis nieudany" }, { status: 500 });
    const zamowienieId = data.id as string;

    // 2) Sesja Stripe Checkout (BLIK, Przelewy24, karta).
    const baza = bazowyUrl(req);
    const line_items = pozycje.map((p) => ({
      quantity: p.ilosc,
      price_data: {
        currency: "pln",
        unit_amount: Math.round(p.cena * 100),
        product_data: { name: `${p.nazwa}${p.rozmiar ? ` (rozm. ${p.rozmiar})` : ""}` },
      },
    }));
    if (dostawa > 0) {
      line_items.push({
        quantity: 1,
        price_data: { currency: "pln", unit_amount: Math.round(dostawa * 100), product_data: { name: `Dostawa — ${b.metoda}` } },
      });
    }

    try {
      const sesja = await sk.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card", "blik", "p24"],
        line_items,
        customer_email: (b.klient?.email as string) || undefined,
        metadata: { zamowienie_id: zamowienieId },
        success_url: `${baza}/zamowienie/dziekujemy?zamowienie=${zamowienieId}`,
        cancel_url: `${baza}/zamowienie`,
      });
      await sb.from("zamowienia").update({ platnosc_id: sesja.id }).eq("id", zamowienieId);
      return Response.json({ ok: true, url: sesja.url });
    } catch (e) {
      return Response.json({ ok: false, blad: e instanceof Error ? e.message : "Błąd płatności" }, { status: 500 });
    }
  }

  // ── Tryb bez płatności online: zapis + zdjęcie stanu od razu (demo/na próbę) ──
  if (supabaseWlaczony()) {
    const sb = sbService();
    if (sb) {
      const { data, error } = await sb.rpc("zloz_zamowienie", {
        p_pozycje: pozycje,
        p_suma: suma,
        p_dostawa: dostawa,
        p_razem: razem,
        p_metoda: b.metoda,
        p_klient: b.klient ?? {},
      });
      if (error) return Response.json({ ok: false, blad: error.message }, { status: 500 });
      await wyslijMaileZamowienia({
        id: String(data),
        pozycje,
        razem,
        dostawa,
        metoda: b.metoda,
        klient: (b.klient ?? {}) as never,
      });
      return Response.json({ ok: true, id: data });
    }
  }

  // Brak bazy — czysta atrapa.
  return Response.json({ ok: true, demo: true });
}
