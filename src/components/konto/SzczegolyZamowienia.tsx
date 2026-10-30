"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { useKoszyk } from "@/components/KoszykContext";
import { pobierzKatalog } from "@/lib/katalogKlient";
import { zdjecie } from "@/lib/zdjecia";
import { linkSledzenia, znajdzPrzewoznika } from "@/lib/przewoznicy";
import type { Produkt } from "@/data/produkty";
import {
  ETYKIETY,
  KOLOR,
  adresDostawy,
  dataPl,
  dokonczPlatnosc,
  numer,
  pobierzZamowienie,
  zl,
  type ZamowienieKlienta,
} from "@/lib/zamowieniaKlienta";

const KROKI = [
  { id: "zlozone", label: "Złożone" },
  { id: "oplacone", label: "Opłacone" },
  { id: "wyslane", label: "Wysłane" },
];
const krokDlaStatusu = (s: string) => (s === "wyslane" ? 2 : s === "oplacone" || s === "nowe" ? 1 : 0);

export function PrzyciskPlatnosci({ id, klasa }: { id: string; klasa?: string }) {
  const [busy, setBusy] = useState(false);
  const [blad, setBlad] = useState("");
  return (
    <div>
      <button
        onClick={async () => {
          setBusy(true);
          setBlad("");
          const r = await dokonczPlatnosc(id);
          if (r.url) {
            window.location.href = r.url;
            return;
          }
          setBlad(r.blad ?? "");
          setBusy(false);
        }}
        disabled={busy}
        className={
          klasa ??
          "rounded-lg bg-ink px-5 py-3 text-[14.5px] font-bold text-white transition-colors hover:bg-akcent disabled:opacity-60"
        }
      >
        {busy ? "Przekierowuję do płatności…" : "Dokończ płatność"}
      </button>
      {blad ? <p className="mt-2 text-[13px] text-cena">{blad}</p> : null}
    </div>
  );
}

export function SzczegolyZamowienia({ id }: { id: string }) {
  const router = useRouter();
  const { user, zaladowano, wlaczone } = useAuth();
  const { dodaj } = useKoszyk();
  const [z, setZ] = useState<ZamowienieKlienta | null | undefined>(undefined);
  const [katalog, setKatalog] = useState<Produkt[]>([]);

  useEffect(() => {
    if (zaladowano && wlaczone && !user) router.replace("/konto/logowanie");
  }, [zaladowano, wlaczone, user, router]);

  useEffect(() => {
    if (!user) return;
    pobierzZamowienie(id).then(setZ);
    pobierzKatalog().then((k) => k && setKatalog(k));
  }, [user, id]);

  // Starsze zamówienia nie mają zdjęcia w pozycji — bierzemy je z katalogu.
  const zdjecieDla = useMemo(() => {
    const mapa = new Map(katalog.map((p) => [p.id, p.zdjecie || p.zdjecia?.[0] || null]));
    return (pid: string, zapisane?: string | null) => zapisane || mapa.get(pid) || null;
  }, [katalog]);

  if (!wlaczone) return <p className="text-[15px] text-ink-2">Konto jest chwilowo niedostępne.</p>;
  if (!zaladowano || !user || z === undefined) return <p className="text-[15px] text-ink-2">Ładowanie zamówienia…</p>;
  if (z === null) {
    return (
      <div className="text-ink-2">
        <p className="mb-4 text-[15px]">Nie znaleźliśmy tego zamówienia na Twoim koncie.</p>
        <Link href="/konto/zamowienia" className="text-ink underline underline-offset-2">← Wróć do zamówień</Link>
      </div>
    );
  }

  const krok = krokDlaStatusu(z.status);
  const anulowane = z.status === "anulowane";
  const czekaNaPlatnosc = z.status === "oczekuje_na_platnosc";
  const przewoznik = znajdzPrzewoznika(z.przewoznik);
  const sledzenie = linkSledzenia(z.przewoznik, z.numer_przesylki);
  const adres = adresDostawy(z.klient);
  const sumaProduktow = z.suma ?? z.pozycje.reduce((s, p) => s + (p.cena ?? 0) * p.ilosc, 0);
  const ramka = "rounded-2xl border border-linia bg-white p-5 md:p-6";

  return (
    <div className="flex flex-col gap-4">
      <Link href="/konto/zamowienia" className="w-fit text-[13.5px] text-ink-2 no-underline hover:text-akcent">
        ← Wszystkie zamówienia
      </Link>

      {/* Nagłówek */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-extrabold tracking-tight md:text-[30px]">Zamówienie #{numer(z.id)}</h1>
          <p className="mt-1 text-[14px] text-ink-2">Złożone {dataPl(z.created_at)}</p>
        </div>
        <span className={`mt-1 rounded px-3 py-1.5 text-[12.5px] font-semibold ${KOLOR[z.status] ?? KOLOR.nowe}`}>
          {ETYKIETY[z.status] ?? z.status}
        </span>
      </div>

      {/* Postęp */}
      {!anulowane ? (
        <ol className={`${ramka} grid grid-cols-3 gap-2`}>
          {KROKI.map((k, i) => {
            const zrobione = i <= krok && !(czekaNaPlatnosc && i > 0);
            return (
              <li key={k.id} className="flex flex-col items-center gap-2 text-center">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-bold ${
                    zrobione ? "bg-ink text-white" : "bg-szary text-ink-2"
                  }`}
                >
                  {zrobione ? "✓" : i + 1}
                </span>
                <span className={`text-[12.5px] ${zrobione ? "font-semibold text-ink" : "text-ink-2"}`}>{k.label}</span>
              </li>
            );
          })}
        </ol>
      ) : null}

      {/* Czeka na płatność */}
      {czekaNaPlatnosc ? (
        <div className="rounded-2xl border border-[oklch(85%_0.08_85)] bg-[oklch(97%_0.03_85)] p-5 md:p-6">
          <p className="text-[16px] font-bold text-ink">Zamówienie czeka na płatność</p>
          <p className="mb-4 mt-1 text-[14px] leading-relaxed text-ink-2">
            Nie otrzymaliśmy jeszcze wpłaty {zl(z.razem)}. Dokończ płatność przez Przelewy24 (BLIK, przelew, karta) —
            wyślemy paczkę zaraz po jej zaksięgowaniu.
          </p>
          <PrzyciskPlatnosci id={z.id} />
        </div>
      ) : null}

      {/* Przesyłka */}
      {z.status === "wyslane" ? (
        <div className={ramka}>
          <p className="text-[16px] font-bold text-ink">Paczka jest w drodze</p>
          <p className="mt-1 text-[14px] text-ink-2">
            {przewoznik ? przewoznik.nazwa : "Przewoźnik"}
            {z.wyslano_at ? ` · nadana ${dataPl(z.wyslano_at)}` : ""}
          </p>
          {z.numer_przesylki ? (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="rounded-lg bg-szary/60 px-3 py-2 font-mono text-[14px] text-ink">{z.numer_przesylki}</span>
              {sledzenie ? (
                <a
                  href={sledzenie}
                  target="_blank"
                  rel="noopener"
                  className="rounded-lg bg-ink px-5 py-2.5 text-[14px] font-bold text-white no-underline transition-colors hover:bg-akcent"
                >
                  Śledź przesyłkę →
                </a>
              ) : null}
            </div>
          ) : (
            <p className="mt-2 text-[13.5px] text-ink-2">Numer przesyłki wysłaliśmy w e-mailu z potwierdzeniem nadania.</p>
          )}
        </div>
      ) : null}

      {/* Produkty */}
      <div className={ramka}>
        <h2 className="mb-4 text-[17px] font-bold">Produkty</h2>
        <ul className="flex flex-col divide-y divide-linia">
          {z.pozycje.map((p, i) => {
            const foto = zdjecieDla(p.id, p.zdjecie);
            return (
              <li key={i} className="flex items-center gap-3.5 py-3 first:pt-0 last:pb-0">
                <Link href={`/produkty/${p.id}`} className="block h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-linia bg-white">
                  {foto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={zdjecie(foto, "s128")} alt={p.nazwa} className="h-full w-full object-contain p-0.5" loading="lazy" />
                  ) : null}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/produkty/${p.id}`} className="line-clamp-2 text-[14px] font-semibold text-ink no-underline hover:text-akcent">
                    {p.nazwa}
                  </Link>
                  <p className="mt-0.5 text-[12.5px] text-ink-2">
                    {[p.kolor, p.rozmiar ? `rozm. ${p.rozmiar}` : null, `${p.ilosc} szt.`].filter(Boolean).join(" · ")}
                  </p>
                </div>
                {typeof p.cena === "number" ? (
                  <span className="shrink-0 text-right text-[14px] font-bold">
                    {zl(p.cena * p.ilosc)}
                    {p.ilosc > 1 ? <span className="block text-[11.5px] font-normal text-ink-2">{zl(p.cena)} / szt.</span> : null}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>

        {/* Podsumowanie kwot */}
        <dl className="mt-5 flex flex-col gap-1.5 border-t border-linia pt-4 text-[14px]">
          <div className="flex justify-between text-ink-2">
            <dt>Produkty</dt>
            <dd>{zl(sumaProduktow)}</dd>
          </div>
          {z.rabat ? (
            <div className="flex justify-between text-[oklch(45%_0.13_150)]">
              <dt>Rabat{z.kod_rabatowy ? ` (${z.kod_rabatowy})` : ""}</dt>
              <dd>−{zl(z.rabat)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between text-ink-2">
            <dt>Dostawa</dt>
            <dd>{z.dostawa ? zl(z.dostawa) : "0,00 zł"}</dd>
          </div>
          <div className="mt-1 flex justify-between text-[16px] font-extrabold text-ink">
            <dt>Razem</dt>
            <dd>{zl(z.razem)}</dd>
          </div>
        </dl>
      </div>

      {/* Dostawa i dane */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className={ramka}>
          <h2 className="mb-2 text-[15px] font-bold">Dostawa i płatność</h2>
          <p className="text-[14px] leading-relaxed text-ink-2">{z.metoda || "—"}</p>
        </div>
        <div className={ramka}>
          <h2 className="mb-2 text-[15px] font-bold">{adres.etykieta}</h2>
          <p className="text-[14px] leading-relaxed text-ink-2">
            {z.klient?.imie ? <span className="block text-ink">{String(z.klient.imie)}</span> : null}
            {adres.linie.map((l) => (
              <span key={l} className="block">{l}</span>
            ))}
            {z.klient?.telefon ? <span className="block">tel. {String(z.klient.telefon)}</span> : null}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => {
            for (const p of z.pozycje) if (p?.id) dodaj(String(p.id), p.rozmiar || undefined, Math.max(1, Number(p.ilosc) || 1));
            router.push("/koszyk");
          }}
          className="rounded-lg border border-linia-2 bg-white px-4 py-2.5 text-[13.5px] font-semibold text-ink transition-colors hover:border-ink"
        >
          Zamów ponownie
        </button>
        <Link href="/kontakt" className="text-[13.5px] text-ink-2 underline underline-offset-2 hover:text-akcent">
          Pytanie o zamówienie? Napisz do nas
        </Link>
      </div>
    </div>
  );
}
