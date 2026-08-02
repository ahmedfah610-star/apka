"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Nawigacja } from "@/components/Nawigacja";
import { Stopka } from "@/components/Stopka";
import { WyborPaczkomatu, type Paczkomat } from "@/components/WyborPaczkomatu";
import { useKoszyk } from "@/components/KoszykContext";
import { PRODUKTY, znajdzProdukt, type Produkt } from "@/data/produkty";
import { formatCena } from "@/lib/filtrowanie";
import { METODY_DOSTAWY, kosztDostawy } from "@/lib/dostawa";

const PLATNOSCI = [
  { id: "blik", nazwa: "BLIK" },
  { id: "karta", nazwa: "Karta płatnicza" },
  { id: "przelewy24", nazwa: "Przelewy24" },
];

function Kroki() {
  const kroki = ["Koszyk", "Dane i dostawa", "Gotowe"];
  const aktywny = 1;
  return (
    <ol className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
      {kroki.map((k, i) => (
        <li key={k} className="flex items-center gap-3">
          <span className={`flex items-center gap-2 ${i === aktywny ? "font-semibold text-ink" : "text-ink-2"}`}>
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                i < aktywny ? "bg-[oklch(72%_0.12_150)] text-tlo" : i === aktywny ? "bg-ink text-tlo" : "bg-szary text-ink-2"
              }`}
            >
              {i < aktywny ? "✓" : i + 1}
            </span>
            {k}
          </span>
          {i < kroki.length - 1 ? <span className="text-ink-2">—</span> : null}
        </li>
      ))}
    </ol>
  );
}

export default function StronaZamowienia() {
  const router = useRouter();
  const { pozycje, wyczysc } = useKoszyk();

  const [katalog, setKatalog] = useState<Produkt[]>(PRODUKTY);
  const [metodaId, setMetodaId] = useState(METODY_DOSTAWY[0].id);
  const [paczkomat, setPaczkomat] = useState<Paczkomat | null>(null);
  const [platnoscId, setPlatnoscId] = useState(PLATNOSCI[0].id);
  const [dane, setDane] = useState({ imie: "", email: "", telefon: "", adres: "", miasto: "", kod: "" });
  const [blad, setBlad] = useState("");
  const [wysylka, setWysylka] = useState(false);

  useEffect(() => {
    fetch("/api/katalog")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.items) && d.items.length) setKatalog(d.items);
      })
      .catch(() => {});
  }, []);

  // Katalog z bazy (lub kodu) — wyszukiwanie po id pozycji koszyka.
  const znajdz = useMemo(() => {
    const mapa = new Map(katalog.map((p) => [p.id, p]));
    return (id: string): Produkt | null => mapa.get(id) ?? znajdzProdukt(id) ?? null;
  }, [katalog]);

  const pozycjeZDanymi = pozycje.map((poz) => ({ poz, produkt: znajdz(poz.id) })).filter((x) => x.produkt);
  const suma = pozycjeZDanymi.reduce((s, { poz, produkt }) => s + produkt!.cena * poz.ilosc, 0);

  const metoda = METODY_DOSTAWY.find((m) => m.id === metodaId)!;
  const platnosc = PLATNOSCI.find((p) => p.id === platnoscId)!;
  const dostawa = kosztDostawy(metoda, suma);
  const razem = suma + dostawa;

  if (pozycjeZDanymi.length === 0) {
    return (
      <div className="overflow-x-hidden">
        <Nawigacja />
        <div className="mx-auto max-w-content px-6 py-20 text-center md:px-12">
          <p className="mb-2 text-[17px] font-semibold">Koszyk jest pusty</p>
          <p className="mb-6 text-sm text-ink-2">Dodaj produkty, zanim przejdziesz do zamówienia.</p>
          <Link href="/produkty" className="inline-block bg-ink px-8 py-3.5 text-[13px] font-semibold tracking-wide text-tlo no-underline hover:bg-akcent">
            PRZEGLĄDAJ PRODUKTY
          </Link>
        </div>
        <Stopka />
      </div>
    );
  }

  async function zloz(e: React.FormEvent) {
    e.preventDefault();
    if (!dane.imie || !dane.email) return setBlad("Uzupełnij imię i e-mail.");
    if (metoda.paczkomat && !paczkomat) return setBlad("Wybierz paczkomat InPost.");
    if (!metoda.paczkomat && (!dane.adres || !dane.miasto || !dane.kod)) return setBlad("Uzupełnij adres dostawy.");
    setBlad("");
    setWysylka(true);
    try {
      const res = await fetch("/api/zamowienia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pozycje: pozycjeZDanymi.map(({ poz, produkt }) => ({
            id: produkt!.id,
            nazwa: produkt!.nazwa,
            cena: produkt!.cena,
            ilosc: poz.ilosc,
            rozmiar: poz.rozmiar,
          })),
          suma,
          dostawa,
          razem,
          metoda: `${metoda.nazwa} · ${platnosc.nazwa}`,
          klient: {
            imie: dane.imie,
            email: dane.email,
            telefon: dane.telefon,
            ...(metoda.paczkomat
              ? { paczkomat: paczkomat?.kod, paczkomatOpis: paczkomat?.opis }
              : { adres: dane.adres, miasto: dane.miasto, kod: dane.kod }),
          },
        }),
      });
      const dane2 = (await res.json().catch(() => ({}))) as { ok?: boolean; blad?: string };
      if (!res.ok || dane2.ok === false) {
        setWysylka(false);
        return setBlad(dane2.blad || "Nie udało się złożyć zamówienia. Spróbuj ponownie.");
      }
    } catch {
      setWysylka(false);
      return setBlad("Błąd połączenia. Spróbuj ponownie.");
    }
    wyczysc();
    router.push("/zamowienie/dziekujemy");
  }

  const input = "w-full border border-linia-2 bg-white px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-ink";
  const naglowek = "mb-4 text-[13px] font-semibold uppercase tracking-wide text-ink-2";

  return (
    <div className="overflow-x-hidden">
      <Nawigacja />

      <form onSubmit={zloz} className="mx-auto grid max-w-content grid-cols-1 gap-10 px-6 py-10 md:px-12 lg:grid-cols-[1fr_380px]">
        <div>
          <Kroki />
          <h1 className="mb-8 text-[30px] font-bold tracking-tight">Dane i dostawa</h1>

          {/* Dane kontaktowe */}
          <section className="mb-8 border border-linia bg-white p-5">
            <h2 className={naglowek}>Dane kontaktowe</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input className={`${input} sm:col-span-2`} placeholder="Imię i nazwisko" value={dane.imie} onChange={(e) => setDane({ ...dane, imie: e.target.value })} />
              <input className={input} placeholder="E-mail" type="email" value={dane.email} onChange={(e) => setDane({ ...dane, email: e.target.value })} />
              <input className={input} placeholder="Telefon" value={dane.telefon} onChange={(e) => setDane({ ...dane, telefon: e.target.value })} />
            </div>
          </section>

          {/* Dostawa */}
          <section className="mb-8 border border-linia bg-white p-5">
            <h2 className={naglowek}>Sposób dostawy</h2>
            <div className="flex flex-col gap-3">
              {METODY_DOSTAWY.map((m) => {
                const on = metodaId === m.id;
                const koszt = kosztDostawy(m, suma);
                return (
                  <div key={m.id}>
                    <button
                      type="button"
                      onClick={() => setMetodaId(m.id)}
                      className={`flex w-full items-center justify-between border px-4 py-3.5 text-left transition-colors ${on ? "border-ink bg-szary/40" : "border-linia-2 hover:border-ink-2"}`}
                    >
                      <span className="flex items-center gap-3">
                        <span className={`flex h-4 w-4 items-center justify-center rounded-full border-[1.5px] ${on ? "border-ink" : "border-linia-2"}`}>
                          {on ? <span className="h-2 w-2 rounded-full bg-ink" /> : null}
                        </span>
                        <span>
                          <span className="flex items-center gap-2 text-[14px] font-semibold">
                            {m.paczkomat ? <span className="bg-[oklch(85%_0.16_95)] px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-ink">InPost</span> : null}
                            {m.nazwa}
                          </span>
                          <span className="block text-[13px] text-ink-2">{m.opis}</span>
                        </span>
                      </span>
                      <span className="text-[14px] font-medium">{koszt === 0 ? "gratis" : `${formatCena(koszt)} zł`}</span>
                    </button>
                    {on && m.paczkomat ? <WyborPaczkomatu wybrany={paczkomat} onWybierz={setPaczkomat} /> : null}
                  </div>
                );
              })}
            </div>

            {!metoda.paczkomat ? (
              <div className="mt-5 border-t border-linia pt-5">
                <h3 className={naglowek}>Adres dostawy</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input className={`${input} sm:col-span-2`} placeholder="Ulica i numer" value={dane.adres} onChange={(e) => setDane({ ...dane, adres: e.target.value })} />
                  <input className={input} placeholder="Kod pocztowy" value={dane.kod} onChange={(e) => setDane({ ...dane, kod: e.target.value })} />
                  <input className={input} placeholder="Miejscowość" value={dane.miasto} onChange={(e) => setDane({ ...dane, miasto: e.target.value })} />
                </div>
              </div>
            ) : null}
          </section>

          {/* Płatność */}
          <section className="border border-linia bg-white p-5">
            <h2 className={naglowek}>Płatność</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {PLATNOSCI.map((p) => {
                const on = platnoscId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlatnoscId(p.id)}
                    className={`border px-4 py-3 text-[14px] font-medium transition-colors ${on ? "border-ink bg-szary/40" : "border-linia-2 hover:border-ink-2"}`}
                  >
                    {p.nazwa}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Podsumowanie */}
        <aside className="h-fit border border-linia bg-white p-6 lg:sticky lg:top-24">
          <h2 className="mb-4 text-[18px] font-bold">Twoje zamówienie</h2>
          <div className="flex max-h-64 flex-col gap-3 overflow-y-auto border-b border-linia pb-4">
            {pozycjeZDanymi.map(({ poz, produkt }) => (
              <div key={`${poz.id}-${poz.rozmiar ?? ""}`} className="flex items-center gap-3 text-[13.5px]">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-linia bg-white">
                  {produkt!.zdjecie ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={produkt!.zdjecie} alt="" className="h-full w-full object-contain p-0.5" />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-ink">{produkt!.nazwa}</span>
                  <span className="block text-[12px] text-ink-2">
                    {poz.rozmiar ? `rozm. ${poz.rozmiar} · ` : ""}× {poz.ilosc}
                  </span>
                </span>
                <span className="whitespace-nowrap font-medium">{formatCena(produkt!.cena * poz.ilosc)} zł</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between py-3 text-[14px]">
            <span className="text-ink-2">Produkty</span>
            <span>{formatCena(suma)} zł</span>
          </div>
          <div className="flex justify-between border-b border-linia pb-3 text-[14px]">
            <span className="text-ink-2">Dostawa</span>
            <span>{dostawa === 0 ? "gratis" : `${formatCena(dostawa)} zł`}</span>
          </div>
          <div className="flex justify-between py-4 text-[18px] font-bold">
            <span>Razem</span>
            <span>{formatCena(razem)} zł</span>
          </div>

          {blad ? <p className="mb-3 text-[13px] text-akcent">{blad}</p> : null}

          <button
            type="submit"
            disabled={wysylka}
            className="block w-full bg-ink px-8 py-4 text-center text-[13px] font-semibold tracking-wide text-tlo transition-colors hover:bg-akcent disabled:cursor-not-allowed disabled:opacity-60"
          >
            {wysylka ? "PRZETWARZANIE…" : "ZAMAWIAM I PŁACĘ"}
          </button>
          <p className="mt-3 text-[11px] leading-relaxed text-ink-2">
            Wersja demonstracyjna — zamówienie nie jest realnie przetwarzane ani opłacane.
          </p>
        </aside>
      </form>

      <Stopka />
    </div>
  );
}
