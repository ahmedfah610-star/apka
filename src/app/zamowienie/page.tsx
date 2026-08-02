"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Nawigacja } from "@/components/Nawigacja";
import { Stopka } from "@/components/Stopka";
import { WyborPaczkomatu, type Paczkomat } from "@/components/WyborPaczkomatu";
import { useKoszyk } from "@/components/KoszykContext";
import { dodajZamowienie } from "@/lib/sklepStore";
import { znajdzProdukt } from "@/data/produkty";
import { formatCena } from "@/lib/filtrowanie";
import { METODY_DOSTAWY, kosztDostawy } from "@/lib/dostawa";

export default function StronaZamowienia() {
  const router = useRouter();
  const { pozycje, suma, wyczysc } = useKoszyk();

  const [metodaId, setMetodaId] = useState(METODY_DOSTAWY[0].id);
  const [paczkomat, setPaczkomat] = useState<Paczkomat | null>(null);
  const [dane, setDane] = useState({ imie: "", email: "", telefon: "", adres: "", miasto: "", kod: "" });
  const [blad, setBlad] = useState("");

  const metoda = METODY_DOSTAWY.find((m) => m.id === metodaId)!;
  const dostawa = kosztDostawy(metoda, suma);
  const razem = suma + dostawa;

  const pozycjeZDanymi = pozycje
    .map((poz) => ({ poz, produkt: znajdzProdukt(poz.id) }))
    .filter((x) => x.produkt);

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

  function zloz(e: React.FormEvent) {
    e.preventDefault();
    if (!dane.imie || !dane.email) {
      setBlad("Uzupełnij imię i e-mail.");
      return;
    }
    if (metoda.paczkomat && !paczkomat) {
      setBlad("Wybierz paczkomat InPost.");
      return;
    }
    if (!metoda.paczkomat && (!dane.adres || !dane.miasto || !dane.kod)) {
      setBlad("Uzupełnij adres dostawy.");
      return;
    }
    // Demo: brak realnej płatności/etykiety. Czyścimy koszyk i pokazujemy potwierdzenie.
    dodajZamowienie({
      id: Date.now().toString(36),
      data: new Date().toISOString(),
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
      metoda: metoda.nazwa,
    });
    wyczysc();
    router.push("/zamowienie/dziekujemy");
  }

  const input = "w-full border border-linia-2 bg-white px-3.5 py-2.5 text-[14px] outline-none focus:border-ink";

  return (
    <div className="overflow-x-hidden">
      <Nawigacja />

      <form onSubmit={zloz} className="mx-auto grid max-w-content grid-cols-1 gap-12 px-6 py-10 md:px-12 lg:grid-cols-[1fr_360px]">
        <div>
          <h1 className="mb-8 text-[32px] font-bold tracking-tight">Dostawa i dane</h1>

          {/* Dane kontaktowe */}
          <section className="mb-10">
            <h2 className="mb-4 text-[13px] font-semibold tracking-wide text-ink-2">DANE KONTAKTOWE</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input className={input} placeholder="Imię i nazwisko" value={dane.imie} onChange={(e) => setDane({ ...dane, imie: e.target.value })} />
              <input className={input} placeholder="E-mail" type="email" value={dane.email} onChange={(e) => setDane({ ...dane, email: e.target.value })} />
              <input className={input} placeholder="Telefon" value={dane.telefon} onChange={(e) => setDane({ ...dane, telefon: e.target.value })} />
            </div>
          </section>

          {/* Metoda dostawy */}
          <section className="mb-10">
            <h2 className="mb-4 text-[13px] font-semibold tracking-wide text-ink-2">SPOSÓB DOSTAWY</h2>
            <div className="flex flex-col gap-3">
              {METODY_DOSTAWY.map((m) => {
                const on = metodaId === m.id;
                const koszt = kosztDostawy(m, suma);
                return (
                  <div key={m.id}>
                    <button
                      type="button"
                      onClick={() => setMetodaId(m.id)}
                      className={`flex w-full items-center justify-between border px-4 py-3.5 text-left transition-colors ${
                        on ? "border-ink" : "border-linia-2 hover:border-ink-2"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className={`flex h-4 w-4 items-center justify-center rounded-full border-[1.5px] ${on ? "border-ink" : "border-linia-2"}`}>
                          {on ? <span className="h-2 w-2 rounded-full bg-ink" /> : null}
                        </span>
                        <span>
                          <span className="block text-[14px] font-semibold">{m.nazwa}</span>
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
          </section>

          {/* Adres — tylko dla kuriera */}
          {!metoda.paczkomat ? (
            <section className="mb-10">
              <h2 className="mb-4 text-[13px] font-semibold tracking-wide text-ink-2">ADRES DOSTAWY</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input className={`${input} sm:col-span-2`} placeholder="Ulica i numer" value={dane.adres} onChange={(e) => setDane({ ...dane, adres: e.target.value })} />
                <input className={input} placeholder="Kod pocztowy" value={dane.kod} onChange={(e) => setDane({ ...dane, kod: e.target.value })} />
                <input className={input} placeholder="Miejscowość" value={dane.miasto} onChange={(e) => setDane({ ...dane, miasto: e.target.value })} />
              </div>
            </section>
          ) : null}
        </div>

        {/* Podsumowanie */}
        <aside className="h-fit bg-szary p-6">
          <h2 className="mb-4 text-[18px] font-bold">Twoje zamówienie</h2>
          <div className="flex flex-col gap-3 border-b border-linia pb-4">
            {pozycjeZDanymi.map(({ poz, produkt }) => (
              <div key={`${poz.id}-${poz.rozmiar ?? ""}`} className="flex justify-between gap-3 text-[13.5px]">
                <span className="text-ink-2">
                  {produkt!.nazwa}
                  {poz.rozmiar ? ` · rozm. ${poz.rozmiar}` : ""} × {poz.ilosc}
                </span>
                <span className="whitespace-nowrap">{formatCena(produkt!.cena * poz.ilosc)} zł</span>
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
          <div className="flex justify-between py-4 text-[17px] font-bold">
            <span>Razem</span>
            <span>{formatCena(razem)} zł</span>
          </div>

          {blad ? <p className="mb-3 text-[13px] text-akcent">{blad}</p> : null}

          <button type="submit" className="block w-full bg-ink px-8 py-4 text-center text-[13px] font-semibold tracking-wide text-tlo transition-colors hover:bg-akcent">
            ZAMAWIAM I PŁACĘ
          </button>
          <p className="mt-3 text-[11px] leading-relaxed text-ink-2">
            To wersja demonstracyjna — zamówienie nie jest realnie przetwarzane ani opłacane.
          </p>
        </aside>
      </form>

      <Stopka />
    </div>
  );
}
