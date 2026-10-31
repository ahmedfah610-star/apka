"use client";

import { useEffect, useMemo, useState } from "react";

interface Mail {
  id: string;
  do: string;
  temat: string;
  typ: string;
  ok: boolean;
  blad: string | null;
  czas: string;
  zdarzenie?: string | null; // status z Resend
  zrodlo?: "dziennik" | "resend";
}

// Ostatni status doręczenia z Resend.
const ZDARZENIA: Record<string, { t: string; ok: boolean }> = {
  sent: { t: "wysłany", ok: true },
  delivered: { t: "dostarczony", ok: true },
  opened: { t: "otwarty", ok: true },
  clicked: { t: "kliknięty", ok: true },
  delivery_delayed: { t: "opóźniony", ok: true },
  bounced: { t: "odrzucony", ok: false },
  complained: { t: "zgłoszony jako spam", ok: false },
  failed: { t: "nieudany", ok: false },
  canceled: { t: "anulowany", ok: false },
  scheduled: { t: "zaplanowany", ok: true },
};
const statusMaila = (m: Mail) => (m.zdarzenie && ZDARZENIA[m.zdarzenie]) || { t: m.ok ? "wysłany" : "błąd", ok: m.ok };

const TYPY: Record<string, string> = {
  zamowienie: "Potwierdzenie zamówienia",
  wysylka: "Wysyłka",
  opinia: "Prośba o opinię",
  koszyk: "Porzucony koszyk",
  dostepnosc: "Znów dostępne",
  powitanie: "Powitanie (newsletter)",
  konto: "Konto",
  newsletter: "Newsletter",
  sklep: "Do sklepu: nowe zamówienie",
  kontakt: "Do sklepu: formularz kontaktowy",
  test: "Test",
};
// Maile do sklepu (powiadomienia dla Ciebie) — domyślnie ukryte.
const WEWNETRZNE = ["sklep", "kontakt", "test"];

const data = (iso: string) =>
  new Date(iso).toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });

// Podgląd wysłanych maili: lista + treść dokładnie taka, jaką dostał klient.
export default function AdminMaile() {
  const [lista, setLista] = useState<Mail[] | null>(null);
  const [resendBlad, setResendBlad] = useState<string | null>(null);
  const [szukaj, setSzukaj] = useState("");
  const [typ, setTyp] = useState("klienci");
  const [wybrany, setWybrany] = useState<Mail | null>(null);
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    // ?q=adres@… — przejście z zamówienia („Maile do klienta").
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setSzukaj(q);
    fetch("/api/admin/maile")
      .then((r) => r.json())
      .then((d) => {
        setLista(Array.isArray(d.items) ? d.items : []);
        setResendBlad(d.resendBlad ?? null);
      })
      .catch(() => setLista([]));
  }, []);

  useEffect(() => {
    if (!wybrany) return;
    setHtml(null);
    fetch(`/api/admin/maile?id=${encodeURIComponent(wybrany.id)}`)
      .then((r) => r.json())
      .then((d) => setHtml(d.mail?.html ?? `<p style="font-family:sans-serif">${d.blad ? `Nie udało się pobrać treści: ${d.blad}` : "Brak treści."}</p>`))
      .catch(() => setHtml("<p>Nie udało się wczytać treści.</p>"));
  }, [wybrany]);

  const widoczne = useMemo(() => {
    const q = szukaj.trim().toLowerCase();
    return (lista ?? []).filter((m) => {
      if (typ === "klienci" && WEWNETRZNE.includes(m.typ)) return false;
      if (typ === "bledy" && statusMaila(m).ok) return false;
      if (typ !== "klienci" && typ !== "wszystkie" && typ !== "bledy" && m.typ !== typ) return false;
      return !q || m.do?.toLowerCase().includes(q) || m.temat?.toLowerCase().includes(q);
    });
  }, [lista, szukaj, typ]);

  const bledow = (lista ?? []).filter((m) => !statusMaila(m).ok).length;

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-[26px] font-bold tracking-tight">Wysłane maile</h1>
        <p className="text-[14px] text-ink-2">
          Co i kiedy dostali klienci — z podglądem treści i statusem doręczenia. Starsze maile pochodzą z historii Resend (system wysyłki maili).
        </p>
      </div>
      {resendBlad ? (
        <p className="mb-4 rounded-lg border border-[oklch(85%_0.08_85)] bg-[oklch(97%_0.03_85)] px-3.5 py-2.5 text-[13px]">
          <strong>Nie udało się pobrać historii z Resend.</strong> {resendBlad}
        </p>
      ) : null}

      <div className="mb-4 flex flex-col gap-2.5 md:flex-row md:items-center">
        <input
          value={szukaj}
          onChange={(e) => setSzukaj(e.target.value)}
          placeholder="Szukaj po e-mailu klienta lub temacie (np. numer zamówienia)…"
          className="w-full rounded-lg border border-linia-2 bg-white px-3.5 py-2.5 text-[16px] outline-none focus:border-ink md:max-w-md md:text-[14px]"
        />
        <select value={typ} onChange={(e) => setTyp(e.target.value)} className="rounded-lg border border-linia-2 bg-white px-3 py-2.5 text-[16px] outline-none md:text-[14px]">
          <option value="klienci">Do klientów</option>
          <option value="wszystkie">Wszystkie (także do sklepu)</option>
          <option value="bledy">Nieudane{bledow ? ` (${bledow})` : ""}</option>
          {Object.entries(TYPY).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(640px,1.5fr)]">
        {/* Lista */}
        <div className="overflow-hidden rounded-xl border border-linia bg-white">
          {lista === null ? (
            <p className="px-4 py-6 text-[13px] text-ink-2">Wczytywanie…</p>
          ) : widoczne.length === 0 ? (
            <div className="px-6 py-10 text-center text-ink-2">
              <p className="text-[14.5px] font-semibold text-ink">Brak maili</p>
              <p className="mt-1 text-[13px]">
                {lista.length === 0 ? "Brak wysłanych maili w historii." : "Nic nie pasuje do wyszukiwania."}
              </p>
            </div>
          ) : (
            <div className="flex max-h-[70vh] flex-col divide-y divide-linia overflow-y-auto">
              {widoczne.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setWybrany(m)}
                  className={`block w-full px-4 py-3 text-left transition-colors ${wybrany?.id === m.id ? "bg-szary" : "hover:bg-szary/50"}`}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] font-semibold">{m.temat}</span>
                      <span className="block truncate text-[12.5px] text-ink-2">{m.do}</span>
                    </span>
                    <span className="shrink-0 text-right text-[12px] text-ink-2">
                      {data(m.czas)}
                      <span className={`mt-1 block font-semibold ${statusMaila(m).ok ? "text-[oklch(45%_0.13_150)]" : "text-cena"}`}>{statusMaila(m).t}</span>
                    </span>
                  </span>
                  <span className="mt-1.5 inline-block rounded bg-szary px-1.5 py-0.5 text-[11px] text-ink-2">{TYPY[m.typ] ?? m.typ}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Podgląd */}
        <div
          className={`${wybrany ? "fixed inset-0 z-50 flex flex-col bg-white lg:static lg:z-auto" : "hidden lg:flex"} flex-col overflow-hidden rounded-none border-linia lg:rounded-xl lg:border lg:bg-white`}
        >
          {wybrany ? (
            <>
              <div className="flex items-start justify-between gap-3 border-b border-linia px-4 py-3">
                <div className="min-w-0 text-[13px]">
                  <p className="truncate text-[14.5px] font-semibold">{wybrany.temat}</p>
                  <p className="truncate text-ink-2">
                    Do: {wybrany.do} · {data(wybrany.czas)} · {statusMaila(wybrany).t}
                  </p>
                  {!wybrany.ok ? <p className="mt-1 text-cena">Nie wysłano: {wybrany.blad || "błąd wysyłki"}</p> : null}
                </div>
                <button onClick={() => setWybrany(null)} className="shrink-0 rounded-lg border border-linia-2 px-3 py-1.5 text-[13px] lg:hidden">
                  Zamknij
                </button>
              </div>
              {html === null ? (
                <p className="px-4 py-6 text-[13px] text-ink-2">Wczytywanie treści…</p>
              ) : (
                // Treść maila w ramce bez skryptów (sandbox bez allow-scripts) — zdjęcia się wczytują, kod nie wykona się.
                <iframe title="Podgląd maila" sandbox="allow-same-origin" srcDoc={html} className="min-h-[70vh] w-full flex-1 bg-white" />
              )}
            </>
          ) : (
            <p className="m-auto px-6 py-16 text-center text-[13.5px] text-ink-2">Wybierz mail z listy, aby zobaczyć jego treść.</p>
          )}
        </div>
      </div>
    </div>
  );
}
