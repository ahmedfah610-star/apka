"use client";

import { useState } from "react";
import type { WynikOferty } from "@/lib/allegroNowe";

// Panel: „Pobierz nowe z Allegro" — sprawdza, czego na stronie brakuje, i dodaje tylko to.
// Nic nie jest kasowane ani pobierane od nowa.
const pracujeNaStart = (e: string) => e === "sprawdzam" || e === "pobieram";

export function NoweZAllegro() {
  const [etap, setEtap] = useState<"start" | "sprawdzam" | "pobieram" | "koniec">("start");
  const [postep, setPostep] = useState({ zrobione: 0, razem: 0 });
  const [wyniki, setWyniki] = useState<WynikOferty[]>([]);
  const [blad, setBlad] = useState("");
  const [dokladajRozmiary, setDokladajRozmiary] = useState(false); // domyślnie: istniejących produktów nie ruszamy

  const zapytaj = async (body: object) => {
    const r = await fetch("/api/admin/allegro", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || d.ok === false) throw new Error(d.blad || `Błąd serwera (${r.status})`);
    return d;
  };

  async function start() {
    setBlad("");
    setWyniki([]);
    setEtap("sprawdzam");
    try {
      const { kandydaci } = (await zapytaj({ akcja: "nowe_lista" })) as { kandydaci: { id: string }[] };
      setPostep({ zrobione: 0, razem: kandydaci.length });
      setEtap("pobieram");
      const zebrane: WynikOferty[] = [];
      for (let i = 0; i < kandydaci.length; i += 12) {
        const ids = kandydaci.slice(i, i + 12).map((k) => k.id);
        let porcja: WynikOferty[] = [];
        for (let proba = 0; proba < 2; proba++) {
          try {
            // Kolejne rozmiary nowości z wcześniejszych porcji trafiają do tego samego nowego produktu.
            const noweProdukty = [...new Set(zebrane.filter((x) => x.wynik === "dodany").map((x) => x.produkt!))];
            porcja = ((await zapytaj({ akcja: "nowe_porcja", ids, dokladajRozmiary, noweProdukty })) as { wyniki: WynikOferty[] }).wyniki;
            break;
          } catch (e) {
            if (proba === 1) porcja = ids.map((id) => ({ oferta: id, nazwa: "", wynik: "blad", info: e instanceof Error ? e.message : "błąd" }));
          }
        }
        zebrane.push(...porcja);
        setWyniki([...zebrane]);
        setPostep({ zrobione: Math.min(i + 12, kandydaci.length), razem: kandydaci.length });
      }
      setEtap("koniec");
    } catch (e) {
      setBlad(e instanceof Error ? e.message : "Nie udało się.");
      setEtap("start");
    }
  }

  const ile = (w: WynikOferty["wynik"]) => wyniki.filter((x) => x.wynik === w).length;
  const dodane = wyniki.filter((x) => x.wynik === "dodany");
  const rozmiary = wyniki.filter((x) => x.wynik === "nowy-rozmiar");
  const brakRozmiaru = wyniki.filter((x) => x.wynik === "brak-rozmiaru");
  const reczne = wyniki.filter((x) => x.wynik === "do-sprawdzenia" || x.wynik === "blad");
  // Ten sam nowy produkt w kilku rozmiarach = kilka ofert; na liście raz.
  const noweProdukty = [...new Map(dodane.map((x) => [x.produkt, x])).values()];
  const pracuje = etap === "sprawdzam" || etap === "pobieram";

  return (
    <section className="rounded-xl border-2 border-ink bg-white p-5">
      <h2 className="text-[16px] font-bold">Pobierz nowe produkty z Allegro</h2>
      <p className="mb-3 mt-1 text-[13.5px] text-ink-2">
        Sprawdza, które oferty z Allegro nie są jeszcze w sklepie, i dodaje tylko nowe produkty. Nic nie jest kasowane, a istniejące produkty zostają
        nietknięte (nazwy, opisy, zdjęcia, ceny, Twoje poprawki).
      </p>
      <label className="mb-3 flex cursor-pointer items-start gap-2 text-[13.5px] text-ink">
        <input type="checkbox" className="mt-0.5" checked={dokladajRozmiary} disabled={pracujeNaStart(etap)} onChange={(e) => setDokladajRozmiary(e.target.checked)} />
        <span>
          Dokładaj od razu brakujące rozmiary do istniejących produktów
          <span className="block text-[12.5px] text-ink-2">
            Wyłączone: teraz tylko pokażę je na liście. Nocna synchronizacja stanów i tak dołoży rozmiar, który jest w sprzedaży na Allegro (z jego
            ilością i opisem) — nazwy, opisy, zdjęcia i ceny starych produktów zostają bez zmian.
          </span>
        </span>
      </label>
      <button
        onClick={start}
        disabled={pracuje}
        className="rounded-lg bg-ink px-6 py-2.5 text-[13.5px] font-bold text-tlo transition-colors hover:bg-akcent disabled:opacity-60"
      >
        {etap === "sprawdzam" ? "Porównuję z Allegro…" : etap === "pobieram" ? `Pobieram… ${postep.zrobione}/${postep.razem}` : "Sprawdź i pobierz nowe"}
      </button>
      {blad ? <p className="mt-3 text-[13.5px] text-akcent">{blad}</p> : null}

      {etap === "pobieram" && postep.razem ? (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-szary">
          <div className="h-full bg-ink transition-all" style={{ width: `${Math.round((postep.zrobione / postep.razem) * 100)}%` }} />
        </div>
      ) : null}

      {etap === "koniec" && postep.razem === 0 ? <p className="mt-3 text-[14px] font-semibold">✓ Sklep ma już wszystko, co jest na Allegro.</p> : null}

      {wyniki.length && !pracuje ? (
        <div className="mt-4 text-[14px]">
          <ul className="grid gap-1 text-[13.5px]">
            <li>
              Nowe produkty dodane do sklepu: <strong>{noweProdukty.length}</strong>
            </li>
            <li>
              Nowe rozmiary w istniejących produktach: <strong>{rozmiary.length - rozmiary.filter((r) => dodane.some((d) => d.produkt === r.produkt)).length}</strong>
            </li>
            <li>
              Były już w sklepie (teraz powiązane z Allegro): <strong>{ile("jest")}</strong>
            </li>
            {brakRozmiaru.length ? (
              <li>
                Rozmiary z Allegro, których brakuje w istniejących produktach (dojdą w nocy): <strong>{brakRozmiaru.length}</strong>
              </li>
            ) : null}
            {reczne.length ? (
              <li className="text-akcent">
                Do sprawdzenia ręcznie: <strong>{reczne.length}</strong>
              </li>
            ) : null}
          </ul>

          {noweProdukty.length ? (
            <div className="mt-3">
              <p className="mb-1 font-semibold">Dodane produkty</p>
              <ul className="max-h-72 overflow-y-auto rounded-lg border border-linia">
                {noweProdukty.map((x) => (
                  <li key={x.produkt} className="border-b border-linia px-3 py-1.5 last:border-0">
                    <a href={`/produkty/${x.produkt}`} target="_blank" rel="noreferrer" className="hover:underline">
                      {x.nazwa}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {brakRozmiaru.length ? (
            <div className="mt-3">
              <p className="mb-1 font-semibold">Brakujące rozmiary w istniejących produktach</p>
              <p className="mb-1 text-[13px] text-ink-2">Teraz nie zmieniałem tych produktów — rozmiar dojdzie przy nocnej synchronizacji (albo od razu, z zaznaczoną opcją wyżej).</p>
              <ul className="max-h-60 overflow-y-auto rounded-lg border border-linia">
                {brakRozmiaru.map((x) => (
                  <li key={x.oferta} className="border-b border-linia px-3 py-1.5 last:border-0">
                    <a href={`/produkty/${x.produkt}`} target="_blank" rel="noreferrer" className="hover:underline">
                      {x.nazwa}
                    </a>
                    {x.rozmiar ? <span className="text-ink-2"> · brak rozm. {x.rozmiar}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {reczne.length ? (
            <div className="mt-3">
              <p className="mb-1 font-semibold">Do sprawdzenia</p>
              <p className="mb-1 text-[13px] text-ink-2">
                W sklepie jest kilka podobnych produktów albo oferta się nie pobrała — nie dodajemy na ślepo, żeby nie zrobić duplikatu.
              </p>
              <ul className="max-h-60 overflow-y-auto rounded-lg border border-linia">
                {reczne.map((x) => (
                  <li key={x.oferta} className="border-b border-linia px-3 py-1.5 last:border-0">
                    <a href={`https://allegro.pl/oferta/${x.oferta}`} target="_blank" rel="noreferrer" className="hover:underline">
                      {x.nazwa || `Oferta ${x.oferta}`}
                    </a>
                    {x.rozmiar ? <span className="text-ink-2"> · rozm. {x.rozmiar}</span> : null}
                    {x.info ? <span className="text-ink-2"> — {x.info}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
