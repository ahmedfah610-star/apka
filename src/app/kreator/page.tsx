"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useProfil } from "@/components/ProfilProvider";
import { IdentyfikatorPupila } from "@/components/IdentyfikatorPupila";
import { KartaOpcji, Naglowek, Podtytul, Przycisk } from "@/components/ui";
import type { Cel, RozmiarPsa, Schorzenie } from "@/types/domain";

const LICZBA_KROKOW = 6;

function rozmiarZWagi(wagaKg: number): RozmiarPsa {
  if (wagaKg < 10) return "mala";
  if (wagaKg < 25) return "srednia";
  if (wagaKg < 45) return "duza";
  return "olbrzymia";
}

const CELE: { id: Cel; etykieta: string }[] = [
  { id: "coat", etykieta: "Lepsza sierść" },
  { id: "sensitive", etykieta: "Lekkostrawność" },
  { id: "weight", etykieta: "Kontrola masy ciała" },
  { id: "joints", etykieta: "Wsparcie stawów" },
];

const SCHORZENIA: { id: Schorzenie; etykieta: string }[] = [
  { id: "brak", etykieta: "Brak" },
  { id: "nerki", etykieta: "Nerki" },
  { id: "stawy", etykieta: "Stawy" },
  { id: "skora", etykieta: "Skóra" },
  { id: "trawienie", etykieta: "Trawienie" },
];

const ALERGENY_DO_WYBORU = ["kurczak", "wołowina", "indyk", "ryba", "zboża"];

export default function KreatorPage() {
  const router = useRouter();
  const { profil, setProfil } = useProfil();
  const [krok, setKrok] = useState(1);

  const rozmiarPodpowiedz = useMemo(
    () => rozmiarZWagi(profil.wagaKg || 0),
    [profil.wagaKg]
  );

  function dalej() {
    if (krok < LICZBA_KROKOW) setKrok(krok + 1);
    else router.push("/wyniki");
  }

  function wstecz() {
    if (krok > 1) setKrok(krok - 1);
    else router.push("/");
  }

  const mozeDalej = useMemo(() => {
    if (krok === 1) return !!profil.gatunek;
    if (krok === 2) return profil.imie.trim().length > 0;
    if (krok === 3) return profil.wiekLat > 0 && profil.wagaKg > 0;
    if (krok === 5) return !!profil.aktywnosc;
    return true;
  }, [krok, profil]);

  function toggleZTablicy<T extends string>(tablica: T[], wartosc: T): T[] {
    return tablica.includes(wartosc) ? tablica.filter((x) => x !== wartosc) : [...tablica, wartosc];
  }

  return (
    <main>
      <IdentyfikatorPupila profil={profil} krok={krok} liczbaKrokow={LICZBA_KROKOW} />

      {krok === 1 && (
        <section>
          <Naglowek>Kim jest Twój pupil?</Naglowek>
          <Podtytul>Wybierz gatunek, żeby dopasować dalsze pytania.</Podtytul>
          <div className="flex flex-col gap-3">
            <KartaOpcji aktywna={profil.gatunek === "pies"} onClick={() => setProfil({ gatunek: "pies" })}>
              🐶 Pies
            </KartaOpcji>
            <KartaOpcji aktywna={profil.gatunek === "kot"} onClick={() => setProfil({ gatunek: "kot" })}>
              🐱 Kot
            </KartaOpcji>
          </div>
        </section>
      )}

      {krok === 2 && (
        <section>
          <Naglowek>Jak się nazywa?</Naglowek>
          <Podtytul>Imię i (opcjonalnie) rasa.</Podtytul>
          <div className="flex flex-col gap-3">
            <input
              className="rounded-2xl border border-linia bg-white px-4 py-4 text-primary outline-none focus:border-primary"
              placeholder="Imię pupila"
              value={profil.imie}
              onChange={(e) => setProfil({ imie: e.target.value })}
            />
            <input
              className="rounded-2xl border border-linia bg-white px-4 py-4 text-primary outline-none focus:border-primary"
              placeholder="Rasa (opcjonalnie)"
              value={profil.rasa ?? ""}
              onChange={(e) => setProfil({ rasa: e.target.value })}
            />
          </div>
        </section>
      )}

      {krok === 3 && (
        <section>
          <Naglowek>Wiek i waga</Naglowek>
          <Podtytul>
            {profil.gatunek === "pies"
              ? "Na tej podstawie podpowiemy rozmiar rasy."
              : "Te dane potrzebne są do wyliczenia porcji."}
          </Podtytul>
          <div className="flex flex-col gap-3">
            <label className="text-sm text-primary/70">
              Wiek (lata)
              <input
                type="number"
                min={0}
                step={0.1}
                className="mt-1 w-full rounded-2xl border border-linia bg-white px-4 py-4 text-primary outline-none focus:border-primary"
                value={profil.wiekLat}
                onChange={(e) => setProfil({ wiekLat: parseFloat(e.target.value) || 0 })}
              />
            </label>
            <label className="text-sm text-primary/70">
              Waga (kg)
              <input
                type="number"
                min={0}
                step={0.1}
                className="mt-1 w-full rounded-2xl border border-linia bg-white px-4 py-4 text-primary outline-none focus:border-primary"
                value={profil.wagaKg}
                onChange={(e) => {
                  const waga = parseFloat(e.target.value) || 0;
                  setProfil({
                    wagaKg: waga,
                    rozmiar: profil.gatunek === "pies" ? rozmiarZWagi(waga) : profil.rozmiar,
                  });
                }}
              />
            </label>

            {profil.gatunek === "pies" && (
              <div>
                <p className="mb-2 text-sm text-primary/70">
                  Rozmiar (podpowiedź: <strong>{etykietaRozmiaru(rozmiarPodpowiedz)}</strong>)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(["mala", "srednia", "duza", "olbrzymia"] as RozmiarPsa[]).map((r) => (
                    <KartaOpcji key={r} aktywna={profil.rozmiar === r} onClick={() => setProfil({ rozmiar: r })}>
                      {etykietaRozmiaru(r)}
                    </KartaOpcji>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {krok === 4 && (
        <section>
          <Naglowek>Sterylizacja i kondycja</Naglowek>
          <Podtytul>To wpływa na zapotrzebowanie kaloryczne.</Podtytul>
          <div className="flex flex-col gap-5">
            <div>
              <p className="mb-2 text-sm text-primary/70">Sterylizacja / kastracja</p>
              <div className="grid grid-cols-2 gap-2">
                <KartaOpcji aktywna={profil.sterylizowany} onClick={() => setProfil({ sterylizowany: true })}>
                  Tak
                </KartaOpcji>
                <KartaOpcji aktywna={!profil.sterylizowany} onClick={() => setProfil({ sterylizowany: false })}>
                  Nie
                </KartaOpcji>
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm text-primary/70">Stan ciała</p>
              <div className="flex flex-col gap-2">
                <KartaOpcji aktywna={profil.stanCiala === "niedowaga"} onClick={() => setProfil({ stanCiala: "niedowaga" })}>
                  Niedowaga
                </KartaOpcji>
                <KartaOpcji aktywna={profil.stanCiala === "norma"} onClick={() => setProfil({ stanCiala: "norma" })}>
                  W normie
                </KartaOpcji>
                <KartaOpcji aktywna={profil.stanCiala === "nadwaga"} onClick={() => setProfil({ stanCiala: "nadwaga" })}>
                  Nadwaga
                </KartaOpcji>
              </div>
            </div>
          </div>
        </section>
      )}

      {krok === 5 && (
        <section>
          <Naglowek>Poziom aktywności</Naglowek>
          <Podtytul>Jak aktywny jest Twój pupil w ciągu dnia?</Podtytul>
          <div className="flex flex-col gap-2">
            <KartaOpcji aktywna={profil.aktywnosc === "spokojny"} onClick={() => setProfil({ aktywnosc: "spokojny" })}>
              Spokojny
            </KartaOpcji>
            <KartaOpcji aktywna={profil.aktywnosc === "umiarkowany"} onClick={() => setProfil({ aktywnosc: "umiarkowany" })}>
              Umiarkowany
            </KartaOpcji>
            <KartaOpcji
              aktywna={profil.aktywnosc === "bardzo_aktywny"}
              onClick={() => setProfil({ aktywnosc: "bardzo_aktywny" })}
            >
              Bardzo aktywny
            </KartaOpcji>
          </div>
        </section>
      )}

      {krok === 6 && (
        <section>
          <Naglowek>Preferencje żywieniowe</Naglowek>
          <Podtytul>Ostatni krok — dopasujemy karmy na tej podstawie.</Podtytul>

          <div className="mb-5">
            <p className="mb-2 text-sm text-primary/70">Rodzaj karmy</p>
            <div className="grid grid-cols-3 gap-2">
              <KartaOpcji aktywna={profil.rodzajKarmy === "sucha"} onClick={() => setProfil({ rodzajKarmy: "sucha" })}>
                Sucha
              </KartaOpcji>
              <KartaOpcji aktywna={profil.rodzajKarmy === "mokra"} onClick={() => setProfil({ rodzajKarmy: "mokra" })}>
                Mokra
              </KartaOpcji>
              <KartaOpcji aktywna={profil.rodzajKarmy === "obie"} onClick={() => setProfil({ rodzajKarmy: "obie" })}>
                Obie
              </KartaOpcji>
            </div>
          </div>

          <div className="mb-5">
            <p className="mb-2 text-sm text-primary/70">Alergeny do unikania</p>
            <div className="flex flex-wrap gap-2">
              {ALERGENY_DO_WYBORU.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setProfil({ alergeny: toggleZTablicy(profil.alergeny, a) })}
                  className={`rounded-2xl border px-3 py-2 text-sm ${
                    profil.alergeny.includes(a)
                      ? "border-koral bg-koral text-white"
                      : "border-linia bg-white text-primary"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <p className="mb-2 text-sm text-primary/70">Cele żywieniowe</p>
            <div className="flex flex-col gap-2">
              {CELE.map((c) => (
                <KartaOpcji
                  key={c.id}
                  aktywna={profil.cele.includes(c.id)}
                  onClick={() => setProfil({ cele: toggleZTablicy(profil.cele, c.id) })}
                >
                  {c.etykieta}
                </KartaOpcji>
              ))}
            </div>
          </div>

          <div className="mb-2">
            <p className="mb-2 text-sm text-primary/70">Schorzenia</p>
            <div className="grid grid-cols-2 gap-2">
              {SCHORZENIA.map((s) => (
                <KartaOpcji key={s.id} aktywna={profil.schorzenie === s.id} onClick={() => setProfil({ schorzenie: s.id })}>
                  {s.etykieta}
                </KartaOpcji>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="mt-8 flex gap-3">
        <div className="w-1/3">
          <Przycisk wariant="ghost" onClick={wstecz}>
            Wstecz
          </Przycisk>
        </div>
        <div className="w-2/3">
          <Przycisk onClick={dalej} disabled={!mozeDalej}>
            {krok < LICZBA_KROKOW ? "Dalej" : "Pokaż wyniki"}
          </Przycisk>
        </div>
      </div>
    </main>
  );
}

function etykietaRozmiaru(r: RozmiarPsa): string {
  const mapa: Record<RozmiarPsa, string> = {
    mala: "Mała (<10 kg)",
    srednia: "Średnia (10–25 kg)",
    duza: "Duża (25–45 kg)",
    olbrzymia: "Olbrzymia (45+ kg)",
  };
  return mapa[r];
}
