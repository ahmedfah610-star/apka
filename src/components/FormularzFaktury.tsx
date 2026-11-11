"use client";

import { useState } from "react";
import { MAX_UWAGI_FAKTURY, normalizujNip, nipPoprawny, type TypNabywcy } from "@/lib/faktura";

export interface StanFaktury {
  chce: boolean;
  typ: TypNabywcy;
  nip: string;
  nazwa: string;
  adres: string;
  kod: string;
  miasto: string;
  email: string;
  uwagi: string;
}

export const PUSTA_FAKTURA: StanFaktury = { chce: false, typ: "firma", nip: "", nazwa: "", adres: "", kod: "", miasto: "", email: "", uwagi: "" };

/** Dane do wysłania (null = bez faktury). Walidacja i tak jest na serwerze (lib/faktura). */
export function fakturaDoWyslania(f: StanFaktury) {
  if (!f.chce) return null;
  return {
    typ: f.typ,
    ...(f.typ === "firma" ? { nip: normalizujNip(f.nip) } : {}),
    nazwa: f.nazwa,
    adres: f.adres,
    kod: f.kod,
    miasto: f.miasto,
    ...(f.email.trim() ? { email: f.email.trim() } : {}),
    ...(f.uwagi.trim() ? { uwagi: f.uwagi.trim() } : {}),
  };
}

const input = "w-full rounded-lg border border-linia-2 bg-white px-3.5 py-2.5 text-[16px] outline-none transition-colors focus:border-ink md:text-[14px]";

/**
 * Zamówienie → „Chcę fakturę": na firmę (NIP + „Pobierz dane" z rejestru VAT) albo na osobę
 * prywatną, opcjonalnie inny e-mail na fakturę i uwagi do faktury.
 */
export function FormularzFaktury({
  wartosc,
  onZmiana,
  domyslne,
}: {
  wartosc: StanFaktury;
  onZmiana: (f: StanFaktury) => void;
  domyslne: { imie: string; adres: string; kod: string; miasto: string }; // z danych zamówienia
}) {
  const [pobieranie, setPobieranie] = useState(false);
  const [info, setInfo] = useState<{ ok: boolean; tekst: string } | null>(null);
  const [innyEmail, setInnyEmail] = useState(!!wartosc.email);
  const ustaw = (z: Partial<StanFaktury>) => onZmiana({ ...wartosc, ...z });

  function przelaczChce(chce: boolean) {
    // Osoba prywatna: imię i adres z danych zamówienia (tylko puste pola).
    onZmiana({
      ...wartosc,
      chce,
      ...(chce && wartosc.typ === "osoba" && !wartosc.nazwa ? { nazwa: domyslne.imie } : {}),
    });
  }

  function przelaczTyp(typ: TypNabywcy) {
    setInfo(null);
    if (typ === wartosc.typ) return;
    // Zmiana rodzaju nabywcy = inne dane (firma vs osoba) — nie mieszamy ich.
    onZmiana({
      ...wartosc,
      typ,
      nazwa: typ === "osoba" ? domyslne.imie : "",
      adres: typ === "osoba" ? domyslne.adres : "",
      kod: typ === "osoba" ? domyslne.kod : "",
      miasto: typ === "osoba" ? domyslne.miasto : "",
    });
  }

  async function pobierzDane() {
    setInfo(null);
    if (!nipPoprawny(wartosc.nip)) return setInfo({ ok: false, tekst: "NIP jest nieprawidłowy — sprawdź cyfry." });
    setPobieranie(true);
    try {
      const r = await fetch(`/api/nip?nip=${encodeURIComponent(normalizujNip(wartosc.nip))}`);
      const d = (await r.json().catch(() => ({}))) as {
        ok?: boolean;
        blad?: string;
        firma?: { nazwa: string; adres: string; kod: string; miasto: string; statusVat: string };
      };
      if (!d.ok || !d.firma) return setInfo({ ok: false, tekst: d.blad || "Nie udało się pobrać danych — wpisz je ręcznie." });
      ustaw({ nazwa: d.firma.nazwa, adres: d.firma.adres, kod: d.firma.kod, miasto: d.firma.miasto });
      setInfo({
        ok: true,
        tekst: `Dane pobrane z rejestru VAT${d.firma.statusVat ? ` (status: ${d.firma.statusVat.toLowerCase()})` : ""} — sprawdź i popraw, jeśli trzeba.`,
      });
    } catch {
      setInfo({ ok: false, tekst: "Brak połączenia — wpisz dane ręcznie." });
    } finally {
      setPobieranie(false);
    }
  }

  return (
    <section className="mb-5 rounded-2xl border border-linia bg-white p-5 md:p-6">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={wartosc.chce}
          onChange={(e) => przelaczChce(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--ink)]"
        />
        <span>
          <span className="block text-[15px] font-bold">Chcę fakturę</span>
          <span className="block text-[12.5px] leading-snug text-ink-2">
            {wartosc.chce ? "Wyślemy ją na Twój e-mail." : "Na firmę (z NIP) albo na osobę prywatną. Wyślemy ją na Twój e-mail."}
          </span>
        </span>
      </label>

      {wartosc.chce ? (
        <div className="mt-4">
          <div role="radiogroup" aria-label="Faktura na" className="mb-4 grid grid-cols-2 rounded-lg bg-szary p-1 text-[13.5px] font-semibold">
            {(["firma", "osoba"] as TypNabywcy[]).map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={wartosc.typ === t}
                onClick={() => przelaczTyp(t)}
                className={`rounded-md py-2 transition-colors ${wartosc.typ === t ? "bg-white text-ink shadow-sm" : "text-ink-2 hover:text-ink"}`}
              >
                {t === "firma" ? "Na firmę" : "Osoba prywatna"}
              </button>
            ))}
          </div>

          {wartosc.typ === "firma" ? (
            <>
              <label htmlFor="fv-nip" className="mb-1 block text-[12px] font-semibold text-ink-2">
                NIP
              </label>
              <div className="flex gap-2">
                <input
                  id="fv-nip"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="np. 946 268 13 45"
                  value={wartosc.nip}
                  onChange={(e) => {
                    setInfo(null);
                    ustaw({ nip: e.target.value.slice(0, 16) });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void pobierzDane();
                    }
                  }}
                  className={`${input} font-semibold tracking-wide`}
                />
                <button
                  type="button"
                  onClick={() => void pobierzDane()}
                  disabled={pobieranie}
                  className="shrink-0 rounded-lg bg-ink px-3.5 text-[13px] font-bold text-white transition-colors hover:bg-akcent disabled:opacity-60"
                >
                  {pobieranie ? "Szukam…" : "Pobierz dane"}
                </button>
              </div>
              {info ? (
                <p className={`mt-1.5 text-[12.5px] font-semibold ${info.ok ? "text-akcent" : "text-[oklch(50%_0.19_25)]"}`}>
                  {info.ok ? "✓ " : ""}
                  {info.tekst}
                </p>
              ) : null}
            </>
          ) : null}

          <div className="mt-3 flex flex-col gap-2.5">
            <input
              aria-label={wartosc.typ === "firma" ? "Nazwa firmy" : "Imię i nazwisko"}
              placeholder={wartosc.typ === "firma" ? "Nazwa firmy" : "Imię i nazwisko"}
              value={wartosc.nazwa}
              maxLength={200}
              onChange={(e) => ustaw({ nazwa: e.target.value })}
              className={input}
            />
            <input aria-label="Ulica i numer" placeholder="Ulica i numer" value={wartosc.adres} maxLength={200} onChange={(e) => ustaw({ adres: e.target.value })} className={input} />
            <div className="grid grid-cols-[120px_1fr] gap-2.5">
              <input
                aria-label="Kod pocztowy"
                placeholder="Kod pocztowy"
                inputMode="numeric"
                value={wartosc.kod}
                maxLength={12}
                onChange={(e) => ustaw({ kod: e.target.value })}
                className={input}
              />
              <input aria-label="Miejscowość" placeholder="Miejscowość" value={wartosc.miasto} maxLength={80} onChange={(e) => ustaw({ miasto: e.target.value })} className={input} />
            </div>
          </div>

          {innyEmail ? (
            <div className="mt-3">
              <label htmlFor="fv-email" className="mb-1 block text-[12px] font-semibold text-ink-2">
                E-mail na fakturę <span className="font-normal">(np. księgowość)</span>
              </label>
              <input id="fv-email" type="email" placeholder="ksiegowosc@firma.pl" value={wartosc.email} maxLength={160} onChange={(e) => ustaw({ email: e.target.value })} className={input} />
            </div>
          ) : (
            <button type="button" onClick={() => setInnyEmail(true)} className="mt-3 text-[12.5px] text-ink-2 underline underline-offset-2 hover:text-ink">
              + Wyślij fakturę na inny e-mail
            </button>
          )}

          <label htmlFor="fv-uwagi" className="mb-1 mt-4 block text-[12px] font-semibold text-ink-2">
            Uwagi do faktury <span className="font-normal">(opcjonalnie)</span>
          </label>
          <textarea
            id="fv-uwagi"
            rows={2}
            maxLength={MAX_UWAGI_FAKTURY}
            value={wartosc.uwagi}
            onChange={(e) => ustaw({ uwagi: e.target.value })}
            placeholder="Np. numer zamówienia wewnętrznego, osoba do kontaktu, prośba o fakturę z datą…"
            className="w-full resize-y rounded-lg border border-linia-2 bg-white px-3.5 py-2.5 text-[16px] outline-none focus:border-ink md:text-[14px]"
          />
          <p className="mt-1 text-right text-[12px] text-ink-2">
            {wartosc.uwagi.length}/{MAX_UWAGI_FAKTURY}
          </p>

          <p className="mt-2 rounded-lg bg-szary px-3 py-2.5 text-[12px] leading-relaxed text-ink-2">
            Fakturę wystawimy i wyślemy na e-mail w ciągu <strong className="text-ink">2 dni roboczych</strong> od wysyłki paczki. Znajdziesz ją też w
            zakładce Moje zamówienia (dla zalogowanych).
          </p>
        </div>
      ) : null}
    </section>
  );
}
