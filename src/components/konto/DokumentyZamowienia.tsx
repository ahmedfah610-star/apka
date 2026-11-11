"use client";

import { useState } from "react";
import { sbBrowser } from "@/lib/supabaseBrowser";
import { NAZWY_DOKUMENTOW, type DaneFaktury, type DokumentZamowienia } from "@/lib/faktura";

const dzien = (iso: string) => new Date(iso).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });

/** Moje zamówienia → szczegóły: faktura / dowód zakupu do pobrania (link tylko dla właściciela zamówienia). */
export function DokumentyZamowienia({ zamowienieId, klient, klasa }: { zamowienieId: string; klient?: Record<string, unknown> | null; klasa: string }) {
  const dokumenty = ((klient?.dokumenty as DokumentZamowienia[] | undefined) ?? []).filter((d) => d && d.id);
  const faktura = (klient?.faktura as DaneFaktury | undefined) ?? null;
  const [busy, setBusy] = useState<string | null>(null);
  const [blad, setBlad] = useState("");
  if (!dokumenty.length && !faktura) return null;

  async function pobierz(d: DokumentZamowienia) {
    setBlad("");
    setBusy(d.id);
    try {
      const sb = sbBrowser();
      const token = sb ? (await sb.auth.getSession()).data.session?.access_token : undefined;
      if (!token) return setBlad("Zaloguj się ponownie, aby pobrać dokument.");
      const r = await fetch(`/api/konto/dokument?zamowienie=${encodeURIComponent(zamowienieId)}&dokument=${encodeURIComponent(d.id)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const w = (await r.json().catch(() => ({}))) as { ok?: boolean; url?: string; blad?: string };
      if (!w.ok || !w.url) return setBlad(w.blad || "Nie udało się pobrać dokumentu.");
      window.location.href = w.url;
    } catch {
      setBlad("Brak połączenia.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className={klasa}>
      <h2 className="mb-3 text-[17px] font-bold">Faktura i dokumenty</h2>
      {dokumenty.length ? (
        <ul className="flex flex-col divide-y divide-linia">
          {dokumenty.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
              <span className="min-w-0 text-[14px]">
                <strong>{d.typ === "inny" ? d.nazwaDokumentu || NAZWY_DOKUMENTOW.inny : NAZWY_DOKUMENTOW[d.typ]}</strong>
                {d.numer ? ` ${d.numer}` : ""}
                <span className="block text-[12.5px] text-ink-2">{dzien(d.czas)}</span>
              </span>
              <button
                type="button"
                onClick={() => void pobierz(d)}
                disabled={busy === d.id}
                className="shrink-0 rounded-lg border border-linia-2 px-3.5 py-2 text-[13px] font-semibold transition-colors hover:border-ink disabled:opacity-60"
              >
                {busy === d.id ? "Pobieranie…" : "Pobierz"}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[14px] text-ink-2">
          Faktura {faktura?.typ === "firma" ? `na ${faktura.nazwa}` : "imienna"} — wyślemy ją e-mailem w ciągu 2 dni roboczych od wysyłki paczki i pojawi się tutaj.
        </p>
      )}
      {blad ? <p className="mt-2 text-[13px] font-semibold text-[oklch(50%_0.19_25)]">{blad}</p> : null}
    </div>
  );
}
