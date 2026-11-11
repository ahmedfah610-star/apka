"use client";

import { useMemo, useRef, useState } from "react";
import {
  MAX_UWAGI_FAKTURY,
  NAZWY_DOKUMENTOW,
  nipCzytelny,
  normalizujNip,
  sprawdzFakture,
  stanFaktury,
  tekstDoFaktury,
  nazwaPlikuDokumentu,
  type DaneFaktury,
  type DokumentZamowienia,
  type TypDokumentu,
  type TypNabywcy,
} from "@/lib/faktura";
import { mailDokumentuHtml, tematDokumentu } from "@/lib/mailDokumentu";

export interface ZamowienieFaktury {
  id: string;
  data: string;
  pozycje: { nazwa: string; cena: number; ilosc: number; rozmiar?: string; kolor?: string | null }[];
  dostawa: number;
  razem: number;
  rabat?: number;
  kodRabatowy?: string | null;
  metoda: string;
  status: string;
  wyslanoAt?: string | null;
  klient: { imie?: string; email?: string; faktura?: DaneFaktury | null; dokumenty?: DokumentZamowienia[] } & Record<string, unknown>;
}

const MAX_MB = 4;
const input = "w-full rounded-lg border border-linia-2 bg-white px-3 py-2 text-[16px] outline-none focus:border-ink md:text-[13.5px]";
const etykieta = "mb-1 block text-[12px] font-semibold text-ink-2";
const ikona: Record<TypDokumentu, string> = { faktura: "🧾", korekta: "↩️", dowod: "📄", inny: "📎" };
const czas = (iso: string) => new Date(iso).toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

/** Panel → zamówienie → „Faktura i dokumenty": dane do faktury, wgranie i wysyłka dokumentów, historia. */
export function SekcjaFaktury({ z, onZmiana }: { z: ZamowienieFaktury; onZmiana: (klient: ZamowienieFaktury["klient"]) => void }) {
  const f = z.klient.faktura ?? null;
  const dokumenty = z.klient.dokumenty ?? [];
  const stan = stanFaktury(z);

  // ── Dane do faktury ──
  const [edycja, setEdycja] = useState(false);
  const [dane, setDane] = useState({
    typ: (f?.typ ?? "osoba") as TypNabywcy,
    nip: f?.nip ?? "",
    nazwa: f?.nazwa ?? z.klient.imie ?? "",
    adres: f?.adres ?? String(z.klient.adres ?? ""),
    kod: f?.kod ?? String(z.klient.kod ?? ""),
    miasto: f?.miasto ?? String(z.klient.miasto ?? ""),
    email: f?.email ?? "",
    uwagi: f?.uwagi ?? "",
  });
  const [komDane, setKomDane] = useState("");
  const [skopiowano, setSkopiowano] = useState(false);

  async function zapiszDane(usun = false) {
    setKomDane("");
    const fv = usun ? null : { ...dane, nip: normalizujNip(dane.nip) };
    if (fv) {
      const w = sprawdzFakture(fv);
      if (!w.ok) return setKomDane(w.blad);
    }
    const r = await fetch("/api/admin/faktura", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ zamowienie: z.id, faktura: fv }) });
    const d = (await r.json().catch(() => ({}))) as { ok?: boolean; blad?: string; faktura?: DaneFaktury | null };
    if (!r.ok || !d.ok) return setKomDane(d.blad || "Nie udało się zapisać.");
    const { faktura: _s, ...reszta } = z.klient;
    void _s;
    onZmiana(d.faktura ? { ...reszta, faktura: d.faktura } : reszta);
    setEdycja(false);
  }

  async function kopiuj() {
    try {
      await navigator.clipboard.writeText(tekstDoFaktury(z));
      setSkopiowano(true);
      setTimeout(() => setSkopiowano(false), 2500);
    } catch {
      setKomDane("Nie udało się skopiować — zaznacz tekst ręcznie.");
    }
  }

  // ── Nowy dokument ──
  const [typ, setTyp] = useState<TypDokumentu>(f ? "faktura" : "dowod");
  const ostatniaFaktura = [...dokumenty].reverse().find((d) => d.typ === "faktura");
  const [numer, setNumer] = useState("");
  const [ksef, setKsef] = useState("");
  const [nazwaDok, setNazwaDok] = useState("");
  const [dotyczy, setDotyczy] = useState(ostatniaFaktura?.numer ?? "");
  const [przyczyna, setPrzyczyna] = useState("");
  const [kwota, setKwota] = useState("");
  const [plik, setPlik] = useState<File | null>(null);
  const [odbiorca, setOdbiorca] = useState(f?.email || z.klient.email || "");
  const [kopia, setKopia] = useState(true);
  const [dopisek, setDopisek] = useState("");
  const [podglad, setPodglad] = useState(false);
  const [busy, setBusy] = useState(false);
  const [kom, setKom] = useState<{ ok: boolean; tekst: string } | null>(null);
  const plikRef = useRef<HTMLInputElement>(null);

  // Ta sama nazwa załącznika, którą nada serwer.
  const nazwaPlikuPodgladu = nazwaPlikuDokumentu(typ, numer, z.id, plik && /\.png$/i.test(plik.name) ? "png" : plik && /\.jpe?g$/i.test(plik.name) ? "jpg" : "pdf");
  const daneMaila = {
    typ,
    zamowienieId: z.id,
    dataZamowienia: z.data,
    razem: z.razem,
    imie: z.klient.imie,
    faktura: f,
    numer: numer.trim() || undefined,
    ksef: ksef.trim() || undefined,
    nazwaDokumentu: nazwaDok.trim() || undefined,
    dotyczy: typ === "korekta" ? dotyczy.trim() || undefined : undefined,
    przyczyna: typ === "korekta" ? przyczyna.trim() || undefined : undefined,
    kwota: typ === "korekta" && kwota.trim() ? Number(kwota.replace(",", ".")) : undefined,
    nazwaPliku: nazwaPlikuPodgladu,
    dopisek,
    link: "#", // w prawdziwym mailu: podpisany link do pliku
  };
  const temat = tematDokumentu(daneMaila);
  const htmlPodgladu = useMemo(() => (podglad ? mailDokumentuHtml(daneMaila) : ""), [podglad, JSON.stringify(daneMaila)]); // eslint-disable-line react-hooks/exhaustive-deps
  const klientEmail = (z.klient.email ?? "").toLowerCase();

  function wybierzPlik(p: File | null) {
    setKom(null);
    if (!p) return setPlik(null);
    if (p.size > MAX_MB * 1024 * 1024) return setKom({ ok: false, tekst: `Plik jest za duży (max ${MAX_MB} MB).` });
    if (!/\.(pdf|jpe?g|png)$/i.test(p.name)) return setKom({ ok: false, tekst: "Dozwolone są tylko pliki PDF, JPG i PNG." });
    setPlik(p);
  }

  async function wgraj(wyslij: boolean) {
    setKom(null);
    if (!plik) return setKom({ ok: false, tekst: "Dodaj plik dokumentu." });
    if ((typ === "faktura" || typ === "korekta") && !numer.trim()) return setKom({ ok: false, tekst: typ === "faktura" ? "Podaj numer faktury." : "Podaj numer korekty." });
    if (wyslij && !confirm(`Wysłać „${temat}" na ${odbiorca}${kopia && klientEmail && klientEmail !== odbiorca.toLowerCase() ? ` (kopia: ${klientEmail})` : ""}?`)) return;
    const fd = new FormData();
    fd.set("zamowienie", z.id);
    fd.set("typ", typ);
    fd.set("numer", numer);
    fd.set("ksef", ksef);
    fd.set("nazwaDokumentu", nazwaDok);
    fd.set("dotyczy", dotyczy);
    fd.set("przyczyna", przyczyna);
    fd.set("kwota", typ === "korekta" ? kwota : "");
    fd.set("do", odbiorca);
    fd.set("kopia", kopia ? "1" : "0");
    fd.set("dopisek", dopisek);
    fd.set("wyslij", wyslij ? "1" : "0");
    fd.set("plik", plik);
    setBusy(true);
    try {
      const r = await fetch("/api/admin/dokumenty", { method: "POST", body: fd });
      const d = (await r.json().catch(() => ({}))) as { ok?: boolean; blad?: string; dokumenty?: DokumentZamowienia[]; mail?: { ok: boolean; blad?: string } };
      if (!r.ok || !d.ok) return setKom({ ok: false, tekst: d.blad || (r.status === 413 ? `Plik jest za duży (max ${MAX_MB} MB).` : "Nie udało się zapisać dokumentu.") });
      onZmiana({ ...z.klient, dokumenty: d.dokumenty ?? [] });
      setKom(
        !wyslij
          ? { ok: true, tekst: "Zapisano dokument (bez maila) ✓" }
          : d.mail?.ok
          ? { ok: true, tekst: "Wysłano do klienta ✓" }
          : { ok: false, tekst: `Dokument zapisany, ale mail nie wyszedł: ${d.mail?.blad || "błąd wysyłki"}. Spróbuj „wyślij ponownie".` },
      );
      setPlik(null);
      setNumer("");
      setKsef("");
      setDopisek("");
      setPodglad(false);
      if (plikRef.current) plikRef.current.value = "";
      if (typ === "faktura") setTyp("dowod");
    } catch {
      setKom({ ok: false, tekst: "Brak połączenia." });
    } finally {
      setBusy(false);
    }
  }

  async function wyslijPonownie(d: DokumentZamowienia) {
    const do_ = prompt("Wyślij na adres:", f?.email || z.klient.email || "");
    if (!do_) return;
    setBusy(true);
    try {
      const r = await fetch("/api/admin/dokumenty", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ zamowienie: z.id, dokument: d.id, do: do_, kopia: false }) });
      const w = (await r.json().catch(() => ({}))) as { ok?: boolean; blad?: string; dokumenty?: DokumentZamowienia[] };
      if (!r.ok || !w.ok) return setKom({ ok: false, tekst: w.blad || "Nie udało się wysłać." });
      onZmiana({ ...z.klient, dokumenty: w.dokumenty ?? [] });
      setKom({ ok: true, tekst: `Wysłano ponownie na ${do_} ✓` });
    } finally {
      setBusy(false);
    }
  }

  async function usun(d: DokumentZamowienia) {
    if (!confirm(`Usunąć ${NAZWY_DOKUMENTOW[d.typ].toLowerCase()}${d.numer ? ` ${d.numer}` : ""}? Klient przestanie widzieć go w swoim koncie.`)) return;
    setBusy(true);
    try {
      const r = await fetch("/api/admin/dokumenty", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ zamowienie: z.id, dokument: d.id }) });
      const w = (await r.json().catch(() => ({}))) as { ok?: boolean; blad?: string; dokumenty?: DokumentZamowienia[] };
      if (!r.ok || !w.ok) return setKom({ ok: false, tekst: w.blad || "Nie udało się usunąć." });
      onZmiana({ ...z.klient, dokumenty: w.dokumenty ?? [] });
    } finally {
      setBusy(false);
    }
  }

  const odznaka =
    stan === "do-wystawienia"
      ? { t: "Faktura do wystawienia", k: "bg-[oklch(95%_0.04_70)] text-[oklch(52%_0.13_55)]" }
      : stan === "gotowa"
      ? { t: "Faktura wystawiona ✓", k: "bg-[oklch(90%_0.07_150)] text-[oklch(42%_0.13_150)]" }
      : stan === "czeka"
      ? { t: "Faktura — po opłaceniu", k: "bg-szary text-ink-2" }
      : null;

  return (
    <section className="mt-5 rounded-xl border border-linia bg-white p-4 md:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[15px] font-extrabold">🧾 Faktura i dokumenty</h3>
        {odznaka ? <span className={`rounded-full px-3 py-1 text-[12px] font-bold ${odznaka.k}`}>{odznaka.t}</span> : null}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
        {/* Dane do faktury */}
        <div className="rounded-lg border border-linia p-3.5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[11.5px] font-bold uppercase tracking-wide text-ink-2">Dane do faktury</p>
            {f ? <span className="rounded bg-szary px-2 py-0.5 text-[10.5px] font-bold">{f.typ === "firma" ? "NA FIRMĘ" : "OSOBA PRYWATNA"}</span> : null}
          </div>

          {!edycja ? (
            f ? (
              <>
                <p className="text-[13.5px] leading-relaxed">
                  <strong>{f.nazwa}</strong>
                  {f.nip ? (
                    <>
                      <br />
                      NIP <strong>{nipCzytelny(f.nip)}</strong>
                    </>
                  ) : null}
                  <br />
                  {f.adres}
                  <br />
                  {f.kod} {f.miasto}
                </p>
                {f.email ? <p className="mt-1.5 text-[12.5px] text-ink-2">Faktura na e-mail: <strong className="text-ink">{f.email}</strong></p> : null}
                {f.uwagi ? (
                  <div className="mt-2 rounded-md border border-[oklch(85%_0.1_85)] bg-[oklch(97%_0.04_90)] px-2.5 py-2 text-[12.5px]">
                    <span className="block text-[10.5px] font-bold uppercase tracking-wide text-ink-2">Uwagi do faktury</span>
                    <span className="whitespace-pre-wrap">{f.uwagi}</span>
                  </div>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => void kopiuj()} className="rounded-lg bg-ink px-3 py-2 text-[12.5px] font-bold text-white hover:bg-akcent">
                    {skopiowano ? "Skopiowano ✓" : "Kopiuj dane do faktury"}
                  </button>
                  <button type="button" onClick={() => setEdycja(true)} className="rounded-lg border border-linia-2 px-3 py-2 text-[12.5px] font-semibold hover:border-ink">
                    Edytuj
                  </button>
                  {f.nip ? (
                    <a
                      href={`https://www.podatki.gov.pl/wykaz-podatnikow-vat-wyszukiwarka`}
                      target="_blank"
                      rel="noreferrer"
                      className="self-center text-[12px] text-ink-2 underline underline-offset-2"
                    >
                      Sprawdź NIP w wykazie VAT ↗
                    </a>
                  ) : null}
                </div>
                <p className="mt-1.5 text-[11.5px] text-ink-2">Kopiuje nabywcę, produkty z cenami, rabat, dostawę i datę wysyłki — do wklejenia w program do faktur.</p>
                {f.typ === "firma" ? (
                  <p className="mt-3 rounded-md bg-[oklch(95%_0.04_70)] px-2.5 py-2 text-[11.5px] leading-relaxed text-ink-3">
                    <strong>Na firmę = KSeF.</strong> Wystaw fakturę w programie połączonym z KSeF, potem wgraj tu jej PDF i wyślij klientowi.
                  </p>
                ) : null}
              </>
            ) : (
              <>
                <p className="text-[13px] text-ink-2">Klient nie prosił o fakturę.</p>
                <button type="button" onClick={() => setEdycja(true)} className="mt-2 rounded-lg border border-linia-2 px-3 py-2 text-[12.5px] font-semibold hover:border-ink">
                  + Dodaj dane do faktury
                </button>
                <p className="mt-1.5 text-[11.5px] text-ink-2">Gdy klient poprosi o fakturę po zakupie (osoba prywatna ma na to 3 miesiące).</p>
              </>
            )
          ) : (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 rounded-lg bg-szary p-1 text-[12.5px] font-semibold">
                {(["firma", "osoba"] as TypNabywcy[]).map((t) => (
                  <button key={t} type="button" onClick={() => setDane((d) => ({ ...d, typ: t }))} className={`rounded-md py-1.5 ${dane.typ === t ? "bg-white shadow-sm" : "text-ink-2"}`}>
                    {t === "firma" ? "Na firmę" : "Osoba prywatna"}
                  </button>
                ))}
              </div>
              {dane.typ === "firma" ? <input className={input} placeholder="NIP" value={dane.nip} onChange={(e) => setDane((d) => ({ ...d, nip: e.target.value }))} /> : null}
              <input className={input} placeholder={dane.typ === "firma" ? "Nazwa firmy" : "Imię i nazwisko"} value={dane.nazwa} onChange={(e) => setDane((d) => ({ ...d, nazwa: e.target.value }))} />
              <input className={input} placeholder="Ulica i numer" value={dane.adres} onChange={(e) => setDane((d) => ({ ...d, adres: e.target.value }))} />
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <input className={input} placeholder="00-000" value={dane.kod} onChange={(e) => setDane((d) => ({ ...d, kod: e.target.value }))} />
                <input className={input} placeholder="Miejscowość" value={dane.miasto} onChange={(e) => setDane((d) => ({ ...d, miasto: e.target.value }))} />
              </div>
              <input className={input} placeholder="E-mail na fakturę (opcjonalnie)" value={dane.email} onChange={(e) => setDane((d) => ({ ...d, email: e.target.value }))} />
              <textarea
                className={input}
                rows={2}
                maxLength={MAX_UWAGI_FAKTURY}
                placeholder="Uwagi do faktury (opcjonalnie)"
                value={dane.uwagi}
                onChange={(e) => setDane((d) => ({ ...d, uwagi: e.target.value }))}
              />
              {komDane ? <p className="text-[12px] font-semibold text-[oklch(50%_0.19_25)]">{komDane}</p> : null}
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void zapiszDane()} className="rounded-lg bg-ink px-3 py-2 text-[12.5px] font-bold text-white">
                  Zapisz
                </button>
                <button type="button" onClick={() => setEdycja(false)} className="rounded-lg border border-linia-2 px-3 py-2 text-[12.5px]">
                  Anuluj
                </button>
                {f ? (
                  <button type="button" onClick={() => confirm("Usunąć dane do faktury z zamówienia?") && void zapiszDane(true)} className="px-2 py-2 text-[12px] text-ink-2 underline">
                    usuń dane
                  </button>
                ) : null}
              </div>
            </div>
          )}
          {!edycja && komDane ? <p className="mt-2 text-[12px] font-semibold text-[oklch(50%_0.19_25)]">{komDane}</p> : null}
        </div>

        {/* Wyślij dokument klientowi */}
        <div className="rounded-lg border border-linia p-3.5">
          <p className="mb-2.5 text-[11.5px] font-bold uppercase tracking-wide text-ink-2">Wyślij dokument klientowi</p>
          <div className="mb-3 grid grid-cols-2 gap-1 rounded-lg bg-szary p-1 text-[12.5px] font-semibold md:grid-cols-4">
            {(["faktura", "korekta", "dowod", "inny"] as TypDokumentu[]).map((t) => (
              <button key={t} type="button" onClick={() => setTyp(t)} className={`rounded-md py-1.5 ${typ === t ? "bg-white shadow-sm" : "text-ink-2 hover:text-ink"}`}>
                {t === "faktura" ? "Faktura VAT" : t === "korekta" ? "Korekta" : t === "dowod" ? "Dowód zakupu" : "Inny dokument"}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
            {typ === "inny" ? (
              <div>
                <label className={etykieta}>Nazwa dokumentu</label>
                <input className={input} placeholder="np. Duplikat faktury" value={nazwaDok} onChange={(e) => setNazwaDok(e.target.value)} />
              </div>
            ) : null}
            {typ !== "dowod" ? (
              <div>
                <label className={etykieta}>{typ === "faktura" ? "Numer faktury" : typ === "korekta" ? "Numer korekty" : "Numer (opcjonalnie)"}</label>
                <input className={input} placeholder={typ === "korekta" ? "np. FK 2/11/2026" : "np. FV 12/11/2026"} value={numer} onChange={(e) => setNumer(e.target.value)} />
              </div>
            ) : null}
            {typ === "faktura" || typ === "korekta" ? (
              <div>
                <label className={etykieta}>
                  Numer KSeF <span className="font-normal">(opcjonalnie)</span>
                </label>
                <input className={input} value={ksef} onChange={(e) => setKsef(e.target.value)} />
              </div>
            ) : null}
            {typ === "korekta" ? (
              <>
                <div>
                  <label className={etykieta}>Do faktury</label>
                  <input className={input} placeholder="np. FV 12/11/2026" value={dotyczy} onChange={(e) => setDotyczy(e.target.value)} />
                </div>
                <div>
                  <label className={etykieta}>
                    Przyczyna <span className="font-normal">(opcjonalnie)</span>
                  </label>
                  <input className={input} placeholder="np. Zwrot towaru" value={przyczyna} onChange={(e) => setPrzyczyna(e.target.value)} />
                </div>
                <div>
                  <label className={etykieta}>
                    Kwota korekty, zł <span className="font-normal">(opcjonalnie)</span>
                  </label>
                  <input className={input} inputMode="decimal" placeholder="np. -39,99" value={kwota} onChange={(e) => setKwota(e.target.value)} />
                </div>
              </>
            ) : null}
          </div>

          <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-lg border-[1.5px] border-dashed border-akcent bg-akcent-2 px-3.5 py-3">
            <span className="flex h-10 w-9 shrink-0 items-center justify-center rounded bg-[oklch(55%_0.19_25)] text-[10px] font-extrabold text-white">{plik ? (/\.pdf$/i.test(plik.name) ? "PDF" : "IMG") : "+"}</span>
            <span className="min-w-0 flex-1 text-[13px]">
              {plik ? (
                <>
                  <strong className="block truncate">{plik.name}</strong>
                  <span className="text-ink-2">{Math.max(1, Math.round(plik.size / 1024))} KB · gotowy do wysłania</span>
                </>
              ) : (
                <>
                  <strong>Wybierz plik</strong>
                  <span className="block text-ink-2">PDF, JPG lub PNG, do {MAX_MB} MB</span>
                </>
              )}
            </span>
            {plik ? <span className="text-[12.5px] underline">zmień</span> : null}
            <input ref={plikRef} type="file" accept="application/pdf,image/jpeg,image/png" className="sr-only" onChange={(e) => wybierzPlik(e.target.files?.[0] ?? null)} />
          </label>

          <div className="mt-3 grid grid-cols-1 gap-2.5 md:grid-cols-2">
            <div>
              <label className={etykieta}>Wyślij na</label>
              <input className={input} type="email" value={odbiorca} onChange={(e) => setOdbiorca(e.target.value)} />
              {klientEmail && klientEmail !== odbiorca.trim().toLowerCase() ? (
                <label className="mt-1 flex items-center gap-1.5 text-[11.5px] text-ink-2">
                  <input type="checkbox" checked={kopia} onChange={(e) => setKopia(e.target.checked)} /> kopia do klienta: {klientEmail}
                </label>
              ) : null}
            </div>
            <div>
              <label className={etykieta}>
                Dopisek do maila <span className="font-normal">(opcjonalnie)</span>
              </label>
              <input className={input} placeholder="np. Dziękujemy za zakupy!" value={dopisek} onChange={(e) => setDopisek(e.target.value)} />
            </div>
          </div>

          <div className="mt-3 rounded-lg border border-linia bg-szary px-3 py-2.5 text-[12.5px]">
            <p className="text-[10.5px] font-bold uppercase tracking-wide text-ink-2">Podgląd maila</p>
            <p className="mt-0.5">
              <strong>Temat:</strong> {temat}
            </p>
            <button type="button" onClick={() => setPodglad((p) => !p)} className="mt-1 font-semibold underline underline-offset-2">
              {podglad ? "Zwiń podgląd" : "Pełny podgląd maila"}
            </button>
            {podglad ? <iframe title="Podgląd maila" srcDoc={htmlPodgladu} className="mt-2 h-[520px] w-full rounded-md border border-linia bg-white" /> : null}
          </div>

          {kom ? <p className={`mt-2 text-[12.5px] font-semibold ${kom.ok ? "text-[oklch(42%_0.13_150)]" : "text-[oklch(50%_0.19_25)]"}`}>{kom.tekst}</p> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={() => void wgraj(true)} className="rounded-lg bg-akcent px-4 py-2.5 text-[13px] font-bold text-white hover:opacity-90 disabled:opacity-60">
              {busy ? "Wysyłanie…" : `Wyślij ${typ === "faktura" ? "fakturę" : typ === "korekta" ? "korektę" : typ === "dowod" ? "dowód zakupu" : "dokument"} klientowi`}
            </button>
            <button type="button" disabled={busy} onClick={() => void wgraj(false)} className="rounded-lg border border-linia-2 px-4 py-2.5 text-[13px] font-semibold hover:border-ink disabled:opacity-60">
              Tylko zapisz, bez maila
            </button>
          </div>
        </div>
      </div>

      {/* Historia */}
      {dokumenty.length ? (
        <div className="mt-4">
          <p className="mb-1.5 text-[11.5px] font-bold uppercase tracking-wide text-ink-2">Dokumenty w zamówieniu</p>
          <div className="divide-y divide-linia rounded-lg border border-linia text-[12.5px]">
            {dokumenty.map((d) => (
              <div key={d.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-2.5">
                <span className="min-w-0">
                  {ikona[d.typ]} <strong>{d.typ === "inny" ? d.nazwaDokumentu || NAZWY_DOKUMENTOW.inny : NAZWY_DOKUMENTOW[d.typ]}</strong>
                  {d.numer ? ` ${d.numer}` : ""} ·{" "}
                  {d.wysylki?.length ? (
                    <span className="text-ink-2">
                      wysłano {czas(d.wysylki[d.wysylki.length - 1].czas)} na {d.wysylki[d.wysylki.length - 1].do.join(", ")}
                      {d.wysylki.length > 1 ? ` (${d.wysylki.length}×)` : ""}
                    </span>
                  ) : (
                    <span className="text-ink-2">zapisano {czas(d.czas)}, nie wysłano</span>
                  )}
                </span>
                <span className="flex shrink-0 gap-3 text-ink-2">
                  <a href={`/api/admin/dokumenty?zamowienie=${z.id}&dokument=${d.id}`} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-ink">
                    otwórz
                  </a>
                  <button type="button" disabled={busy} onClick={() => void wyslijPonownie(d)} className="underline underline-offset-2 hover:text-ink">
                    {d.wysylki?.length ? "wyślij ponownie" : "wyślij"}
                  </button>
                  <button type="button" disabled={busy} onClick={() => void usun(d)} className="underline underline-offset-2 hover:text-[oklch(50%_0.19_25)]">
                    usuń
                  </button>
                </span>
              </div>
            ))}
          </div>
          <p className="mt-1.5 text-[11.5px] text-ink-2">Zalogowany klient widzi dokumenty w Moje zamówienia. Pliki są prywatne — do pobrania tylko przez krótko ważny link.</p>
        </div>
      ) : null}
    </section>
  );
}
