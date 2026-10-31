"use client";

import { useMemo, useState } from "react";
import { formatCena } from "@/lib/filtrowanie";
import { obliczKorekte, skorygowano, zwroconoLacznie, type Korekta, type TypKorekty } from "@/lib/korekty";

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ZamowienieKorekt {
  id: string;
  pozycje: { nazwa: string; cena: number; ilosc: number; rozmiar?: string | null; kolor?: string | null }[];
  suma: number;
  rabat?: number;
  dostawa: number;
  razem: number;
  klient: { email?: string; test?: boolean; korekty?: Korekta[] } & Record<string, any>;
}

const ETYKIETA: Record<TypKorekty, string> = { brak: "Brak produktu", zwrot: "Zwrot" };

/** Braki i zwroty w zamówieniu: rozliczenie pozycji, mail do klienta, przypomnienie o zwrocie w P24. */
export function KorektyZamowienia({ z, poZmianie }: { z: ZamowienieKorekt; poZmianie: () => void }) {
  const korekty = useMemo(() => z.klient?.korekty ?? [], [z.klient?.korekty]);
  const [otwarte, setOtwarte] = useState(false);
  const [typ, setTyp] = useState<TypKorekty>("brak");
  const [ilosci, setIlosci] = useState<Record<number, number>>({});
  const [zwrotDostawy, setZwrotDostawy] = useState(false);
  const [notatka, setNotatka] = useState("");
  const [powiadom, setPowiadom] = useState(true);
  const [busy, setBusy] = useState(false);
  const [kom, setKom] = useState<{ ok: boolean; tekst: string } | null>(null);

  const zostalo = (i: number) => z.pozycje[i].ilosc - skorygowano(korekty, i);
  const podglad = useMemo(
    () =>
      obliczKorekte(
        { pozycje: z.pozycje, suma: z.suma, rabat: z.rabat, dostawa: z.dostawa, razem: z.razem, korekty },
        { typ, pozycje: Object.entries(ilosci).map(([i, n]) => ({ indeks: Number(i), ilosc: n })), zwrotDostawy },
      ),
    [z, korekty, typ, ilosci, zwrotDostawy],
  );
  const dostawaZwrocona = korekty.some((k) => k.dostawa > 0);
  const zwrocono = zwroconoLacznie(korekty);

  async function zapisz() {
    setBusy(true);
    setKom(null);
    try {
      const r = await fetch("/api/zamowienia/korekta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: z.id, typ, pozycje: Object.entries(ilosci).map(([i, n]) => ({ indeks: Number(i), ilosc: n })), zwrotDostawy, notatka, powiadom }),
      });
      const d = (await r.json().catch(() => ({}))) as { ok?: boolean; blad?: string; korekta?: Korekta; mail?: { ok: boolean; blad?: string } };
      if (!r.ok || !d.ok || !d.korekta) {
        setKom({ ok: false, tekst: d.blad || "Nie udało się zapisać." });
      } else {
        const mail = powiadom ? (d.mail?.ok ? " Mail do klienta wysłany ✓." : ` Mail nie poszedł: ${d.mail?.blad || "brak adresu e-mail"}.`) : "";
        setKom({ ok: true, tekst: `Zapisano: ${ETYKIETA[typ].toLowerCase()} — do zwrotu ${formatCena(d.korekta.kwota)} zł.${mail} Zwróć tę kwotę w panelu Przelewy24.` });
        setOtwarte(false);
        setIlosci({});
        setZwrotDostawy(false);
        setNotatka("");
        poZmianie();
      }
    } catch {
      setKom({ ok: false, tekst: "Błąd połączenia." });
    } finally {
      setBusy(false);
    }
  }

  async function cofnij(k: Korekta) {
    if (!confirm(`Cofnąć „${ETYKIETA[k.typ]}” na ${formatCena(k.kwota)} zł? (Mail, jeśli został wysłany, już do klienta dotarł.)`)) return;
    const r = await fetch("/api/zamowienia/korekta", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: z.id, korekta: k.id }) });
    if (!r.ok) alert("Nie udało się cofnąć.");
    poZmianie();
  }

  async function przelaczTest() {
    await fetch("/api/zamowienia", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: z.id, test: !z.klient?.test }) });
    poZmianie();
  }

  const pole = "rounded-md border border-linia-2 bg-white px-2.5 py-2 text-[16px] outline-none focus:border-ink md:text-[13px]";

  return (
    <div className="mt-5 border-t border-linia pt-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-2">Braki i zwroty</p>
        <button onClick={() => void przelaczTest()} className="text-[12px] text-ink-2 underline underline-offset-2 hover:text-akcent">
          {z.klient?.test ? "Usuń znacznik TEST" : "Oznacz jako TEST"}
        </button>
      </div>

      {korekty.length > 0 ? (
        <div className="mb-3 flex flex-col gap-2">
          {korekty.map((k) => (
            <div key={k.id} className="rounded-lg border border-linia bg-white px-3 py-2.5 text-[13px]">
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold">
                  {ETYKIETA[k.typ]} · {formatCena(k.kwota)} zł
                </span>
                <button onClick={() => void cofnij(k)} className="shrink-0 text-[12px] text-ink-2 underline underline-offset-2 hover:text-akcent">
                  Cofnij
                </button>
              </div>
              <p className="text-ink-2">
                {k.pozycje.map((p) => `${p.nazwa}${p.rozmiar ? ` (${p.rozmiar})` : ""} × ${p.ilosc}`).join(", ")}
                {k.dostawa > 0 ? `${k.pozycje.length ? " + " : ""}dostawa ${formatCena(k.dostawa)} zł` : ""}
              </p>
              <p className="text-[12px] text-ink-2">
                {new Date(k.data).toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                {k.mail ? " · mail wysłany" : " · bez maila"}
                {k.notatka ? ` · ${k.notatka}` : ""}
              </p>
            </div>
          ))}
          <p className="text-[12.5px] font-semibold">Zwrócono łącznie: {formatCena(zwrocono)} zł</p>
        </div>
      ) : null}

      {!otwarte ? (
        <button
          onClick={() => {
            setOtwarte(true);
            setKom(null);
          }}
          className="rounded-lg border border-linia-2 bg-white px-3.5 py-2 text-[13px] font-medium text-ink hover:border-ink"
        >
          Brak produktu / zwrot…
        </button>
      ) : (
        <div className="flex flex-col gap-3 rounded-lg border border-linia bg-white p-3.5">
          <div className="grid grid-cols-2 gap-2">
            {(["brak", "zwrot"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTyp(t)}
                className={`rounded-md border px-2 py-2 text-[13px] font-semibold ${typ === t ? "border-ink bg-ink text-tlo" : "border-linia-2 text-ink"}`}
              >
                {t === "brak" ? "Brak produktu" : "Zwrot towaru"}
              </button>
            ))}
          </div>
          <p className="text-[12px] text-ink-2">
            {typ === "brak" ? "Produkt, którego nie wyślesz (np. wyprzedany). Klient dostanie informację i zwrot pieniędzy." : "Towar odesłany przez klienta. Klient dostanie potwierdzenie zwrotu pieniędzy."}
          </p>
          <div className="flex flex-col gap-2">
            {z.pozycje.map((p, i) => {
              const max = zostalo(i);
              return (
                <label key={i} className={`flex items-center justify-between gap-3 text-[13px] ${max <= 0 ? "opacity-50" : ""}`}>
                  <span className="min-w-0">
                    <span className="block truncate">{p.nazwa}</span>
                    <span className="text-[12px] text-ink-2">
                      {[p.kolor, p.rozmiar ? `rozm. ${p.rozmiar}` : null, `${formatCena(p.cena)} zł/szt.`].filter(Boolean).join(" · ")}
                      {max < p.ilosc ? ` · rozliczono ${p.ilosc - max} z ${p.ilosc}` : ""}
                    </span>
                  </span>
                  <select
                    value={ilosci[i] ?? 0}
                    disabled={max <= 0}
                    onChange={(e) => setIlosci((s) => ({ ...s, [i]: Number(e.target.value) }))}
                    className={pole}
                    aria-label={`Ilość: ${p.nazwa}`}
                  >
                    {Array.from({ length: Math.max(0, max) + 1 }, (_, n) => (
                      <option key={n} value={n}>
                        {n} szt.
                      </option>
                    ))}
                  </select>
                </label>
              );
            })}
          </div>
          {z.dostawa > 0 ? (
            <label className={`flex items-center gap-2 text-[13px] ${dostawaZwrocona ? "opacity-50" : ""}`}>
              <input type="checkbox" checked={zwrotDostawy} disabled={dostawaZwrocona} onChange={(e) => setZwrotDostawy(e.target.checked)} />
              Zwróć też koszt dostawy ({formatCena(z.dostawa)} zł){dostawaZwrocona ? " — już zwrócony" : ""}
            </label>
          ) : null}
          <p className="text-[11.5px] leading-snug text-ink-2">
            Przy zwrocie całego zamówienia trzeba oddać także koszt dostawy (do kwoty najtańszej metody). Przy braku produktu, gdy reszta paczki idzie normalnie — dostawa zostaje.
          </p>
          <input value={notatka} onChange={(e) => setNotatka(e.target.value)} placeholder="Notatka (opcjonalnie, trafi też do maila)" className={pole} maxLength={300} />
          <label className="flex items-center gap-2 text-[13px]">
            <input type="checkbox" checked={powiadom} onChange={(e) => setPowiadom(e.target.checked)} />
            Wyślij mail do klienta{z.klient?.email ? ` (${z.klient.email})` : " — brak adresu e-mail"}
          </label>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-linia pt-3">
            <span className="text-[14px] font-bold">{"blad" in podglad ? <span className="text-[12.5px] font-normal text-ink-2">{podglad.blad}</span> : `Do zwrotu: ${formatCena(podglad.korekta.kwota)} zł`}</span>
            <span className="flex gap-2">
              <button onClick={() => setOtwarte(false)} className="rounded-lg border border-linia-2 px-3 py-2 text-[13px] text-ink">
                Anuluj
              </button>
              <button
                onClick={() => void zapisz()}
                disabled={busy || "blad" in podglad}
                className="rounded-lg bg-ink px-3.5 py-2 text-[13px] font-semibold text-tlo hover:bg-akcent disabled:opacity-50"
              >
                {busy ? "…" : "Zapisz"}
              </button>
            </span>
          </div>
        </div>
      )}
      {kom ? (
        <p className={`mt-2 text-[12.5px] ${kom.ok ? "text-[oklch(42%_0.13_150)]" : "text-cena"}`}>
          {kom.tekst}{" "}
          {kom.ok ? (
            <a href="https://panel.przelewy24.pl" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
              Otwórz Przelewy24 →
            </a>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
