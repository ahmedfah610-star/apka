"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { ZakladkiKonta } from "@/components/konto/ZakladkiKonta";

const KATEGORIE = [
  { href: "/produkty", label: "Wszystkie produkty" },
  { href: "/produkty?kategoria=dziewczynki", label: "Dziewczynki" },
  { href: "/produkty?kategoria=chlopcy", label: "Chłopcy" },
  { href: "/produkty?kategoria=niemowleta", label: "Niemowlęta" },
];

type Meta = { imie?: string; telefon?: string; adres?: string; kod?: string; miasto?: string };

export function PanelKonta() {
  const router = useRouter();
  const { user, zaladowano, wlaczone, wyloguj, zapiszProfil, ustawHaslo, zmienEmail } = useAuth();

  const [edycja, setEdycja] = useState(false);
  const [dane, setDane] = useState<Meta>({ imie: "", telefon: "", adres: "", kod: "", miasto: "" });
  const [zapis, setZapis] = useState(false);
  const [info, setInfo] = useState("");

  // E-mail
  const [edytujEmail, setEdytujEmail] = useState(false);
  const [nowyEmail, setNowyEmail] = useState("");
  const [emailKom, setEmailKom] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);

  // Hasło
  const [edytujHaslo, setEdytujHaslo] = useState(false);
  const [noweHaslo, setNoweHaslo] = useState("");
  const [hasloKom, setHasloKom] = useState("");
  const [hasloBusy, setHasloBusy] = useState(false);

  useEffect(() => {
    if (zaladowano && wlaczone && !user) router.replace("/konto/logowanie");
  }, [zaladowano, wlaczone, user, router]);

  useEffect(() => {
    if (!user) return;
    const m = (user.user_metadata ?? {}) as Meta;
    setDane({ imie: m.imie || "", telefon: m.telefon || "", adres: m.adres || "", kod: m.kod || "", miasto: m.miasto || "" });
  }, [user]);

  if (!wlaczone) return <p className="text-center text-[15px] text-ink-2">Konto jest chwilowo niedostępne.</p>;
  if (!zaladowano || !user) return <p className="text-center text-[15px] text-ink-2">Ładowanie…</p>;

  const m = (user.user_metadata ?? {}) as Meta;
  const imieMeta = (m.imie || "").trim();
  const kafel = "group flex items-start gap-4 rounded-xl border border-linia bg-white p-5 text-inherit no-underline transition-all hover:border-ink hover:shadow-[0_4px_20px_-14px_rgba(0,0,0,0.4)]";
  const input = "w-full rounded-lg border border-linia-2 bg-white px-4 py-3 text-[15px] outline-none transition-colors focus:border-ink";
  const edytujPill = "mt-5 flex w-full items-center justify-center gap-2 rounded-full border-2 border-ink py-3.5 text-[14px] font-bold text-ink transition-colors hover:bg-ink hover:text-tlo";
  const ikonaOlowek = (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  );
  // Wiersz danych w stylu „Moje dane": ikona + etykieta + wartość (lub „—").
  const wiersz = (ikona: React.ReactNode, etykieta: string, wartosc?: string) => (
    <div className="flex items-start gap-4">
      <span className="mt-0.5 shrink-0 text-ink">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          {ikona}
        </svg>
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] font-bold tracking-tight">{etykieta}</span>
        <span className="mt-0.5 block break-words text-[14.5px] text-ink-2">{wartosc?.trim() || "—"}</span>
      </span>
    </div>
  );

  const przezGoogle = (user.app_metadata?.provider ?? "") === "google";

  async function zapiszDane(e: React.FormEvent) {
    e.preventDefault();
    setZapis(true);
    setInfo("");
    const r = await zapiszProfil(dane);
    setZapis(false);
    if (r.ok) { setInfo("Zapisano ✓"); setEdycja(false); }
    else setInfo(r.blad || "Nie udało się zapisać.");
  }

  async function zapiszEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailBusy(true);
    setEmailKom("");
    const r = await zmienEmail(nowyEmail);
    setEmailBusy(false);
    if (r.ok) { setEmailKom("Wysłaliśmy link potwierdzający na nowy adres — kliknij go, aby dokończyć zmianę."); setEdytujEmail(false); setNowyEmail(""); }
    else setEmailKom(r.blad || "Nie udało się zmienić adresu.");
  }

  async function zapiszHaslo(e: React.FormEvent) {
    e.preventDefault();
    if (noweHaslo.length < 6) { setHasloKom("Hasło musi mieć co najmniej 6 znaków."); return; }
    setHasloBusy(true);
    setHasloKom("");
    const r = await ustawHaslo(noweHaslo);
    setHasloBusy(false);
    if (r.ok) { setHasloKom("Hasło zaktualizowane ✓"); setEdytujHaslo(false); setNoweHaslo(""); }
    else setHasloKom(r.blad || "Nie udało się zmienić hasła.");
  }

  const imieKrotkie = imieMeta ? imieMeta.split(" ")[0] : "";

  return (
    <div className="w-full">
      {/* Zakładki konta */}
      <ZakladkiKonta />

      {/* Baner powitalny */}
      <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-akcent to-[oklch(64%_0.15_38)] px-6 py-7 text-tlo sm:px-8 sm:py-8">
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[12px] font-semibold backdrop-blur-sm">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="m12 17.3-6.16 3.7 1.64-7.03L2 9.24l7.19-.61L12 2l2.81 6.63 7.19.61-5.48 4.73 1.64 7.03z" /></svg>
            Twoje konto bobas
          </span>
          <p className="mt-3 text-[24px] font-bold leading-tight tracking-tight sm:text-[28px]">
            Cześć{imieKrotkie ? `, ${imieKrotkie}` : ""}! 👋
          </p>
          <p className="mt-1 text-[13.5px] text-tlo/85">Zalogowano jako <strong className="font-semibold text-tlo">{user.email}</strong></p>
        </div>
        {/* dekor */}
        <svg className="pointer-events-none absolute -right-6 -top-8 h-40 w-40 text-white/10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
          <path d="M6 2 4 6v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V6l-2-4H6Z" /><path d="M4 6h16M10 10a2 2 0 0 0 4 0" />
        </svg>
      </div>

      {/* Nagłówek */}
      <div className="mb-6">
        <h1 className="text-[26px] font-bold tracking-tight md:text-[31px]">Twoje konto</h1>
        <p className="mt-1.5 max-w-lg text-[14.5px] leading-relaxed text-ink-2">
          Witaj w swoim profilu bobas — tutaj zarządzasz zamówieniami, ulubionymi produktami oraz danymi do wysyłki.
        </p>
      </div>

      {/* Status — na bieżąco */}
      <div className="mb-6 flex flex-col items-center rounded-2xl border border-linia bg-white px-6 py-9 text-center">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-szary/60 text-ink">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 2 4 6v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V6l-2-4H6Z" /><path d="M4 6h16M10 10a2 2 0 0 0 4 0" />
          </svg>
        </span>
        <p className="text-[17px] font-bold tracking-tight">Jesteś ze wszystkim na bieżąco :)</p>
        <p className="mt-1.5 max-w-sm text-[13.5px] leading-relaxed text-ink-2">
          Tutaj pojawią się wszystkie aktualizacje dotyczące Twoich zamówień i wysyłek.
        </p>
        <Link
          href="/konto/zamowienia"
          className="mt-5 rounded-lg bg-ink px-6 py-3 text-[13px] font-semibold tracking-wide text-tlo no-underline transition-colors hover:bg-akcent"
        >
          ZOBACZ ZAMÓWIENIA
        </Link>
      </div>

      {/* Moje dane */}
      <h2 className="mt-2 text-[21px] font-bold tracking-tight md:text-[24px]">Moje dane</h2>
      <p className="mb-4 mt-1 max-w-lg text-[14px] leading-relaxed text-ink-2">
        Tutaj zobaczysz i zaktualizujesz swoje dane oraz sposób logowania — adres e-mail i hasło.
      </p>

      <div className="mb-3 flex flex-col gap-3">
        {/* Dane osobowe */}
        <div className="rounded-2xl border border-linia bg-white p-5 sm:p-6">
          {!edycja ? (
            <>
              <div className="flex flex-col gap-5">
                {wiersz(
                  <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></>,
                  "Imię i nazwisko", m.imie,
                )}
                {wiersz(
                  <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.6a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.5-1.2a2 2 0 0 1 2.1-.4c.8.3 1.7.6 2.6.7a2 2 0 0 1 1.7 2Z" />,
                  "Numer telefonu", m.telefon,
                )}
                {wiersz(
                  <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>,
                  "Adres dostawy", [m.adres, [m.kod, m.miasto].filter(Boolean).join(" ")].filter((x) => x && x.trim()).join(", "),
                )}
              </div>
              {info ? <p className="mt-4 text-[13px] font-medium text-[oklch(45%_0.12_150)]">{info}</p> : null}
              <button onClick={() => { setEdycja(true); setInfo(""); }} className={edytujPill}>
                {ikonaOlowek} Edytuj
              </button>
            </>
          ) : (
            <form onSubmit={zapiszDane} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input className={`${input} sm:col-span-2`} placeholder="Imię i nazwisko" maxLength={80} value={dane.imie} onChange={(e) => setDane({ ...dane, imie: e.target.value })} />
              <input className={`${input} sm:col-span-2`} placeholder="Telefon" maxLength={30} value={dane.telefon} onChange={(e) => setDane({ ...dane, telefon: e.target.value })} />
              <input className={`${input} sm:col-span-2`} placeholder="Ulica i numer" maxLength={120} value={dane.adres} onChange={(e) => setDane({ ...dane, adres: e.target.value })} />
              <input className={input} placeholder="Kod pocztowy" maxLength={12} value={dane.kod} onChange={(e) => setDane({ ...dane, kod: e.target.value })} />
              <input className={input} placeholder="Miejscowość" maxLength={80} value={dane.miasto} onChange={(e) => setDane({ ...dane, miasto: e.target.value })} />
              <p className="text-[12.5px] text-ink-3 sm:col-span-2">Wolisz paczkomat? Wybierzesz go w koszyku — adres tutaj jest do dostawy kurierem.</p>
              {info ? <p className="text-[13px] text-akcent sm:col-span-2">{info}</p> : null}
              <div className="flex gap-2 sm:col-span-2">
                <button type="submit" disabled={zapis} className="rounded-lg bg-ink px-5 py-2.5 text-[13px] font-semibold tracking-wide text-tlo transition-colors hover:bg-akcent disabled:opacity-60">
                  {zapis ? "ZAPISYWANIE…" : "ZAPISZ"}
                </button>
                <button type="button" onClick={() => { setEdycja(false); setInfo(""); }} className="rounded-lg border border-linia-2 px-5 py-2.5 text-[13px] font-medium text-ink-2 hover:border-ink hover:text-ink">
                  Anuluj
                </button>
              </div>
            </form>
          )}
        </div>

        {/* E-mail */}
        <div className="rounded-2xl border border-linia bg-white p-5 sm:p-6">
          {wiersz(
            <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
            "Twój e-mail", user.email ?? "",
          )}
          {przezGoogle ? (
            <p className="mt-3 text-[12.5px] text-ink-3">Adres jest zarządzany przez Twoje konto Google.</p>
          ) : !edytujEmail ? (
            <button onClick={() => { setEdytujEmail(true); setEmailKom(""); }} className={edytujPill}>{ikonaOlowek} Edytuj</button>
          ) : (
            <form onSubmit={zapiszEmail} className="mt-4 flex flex-col gap-3">
              <input className={input} type="email" placeholder="Nowy adres e-mail" autoComplete="email" value={nowyEmail} onChange={(e) => setNowyEmail(e.target.value)} />
              <div className="flex gap-2">
                <button type="submit" disabled={emailBusy} className="rounded-lg bg-ink px-5 py-2.5 text-[13px] font-semibold tracking-wide text-tlo transition-colors hover:bg-akcent disabled:opacity-60">
                  {emailBusy ? "WYSYŁANIE…" : "ZMIEŃ E-MAIL"}
                </button>
                <button type="button" onClick={() => { setEdytujEmail(false); setEmailKom(""); }} className="rounded-lg border border-linia-2 px-5 py-2.5 text-[13px] font-medium text-ink-2 hover:border-ink hover:text-ink">
                  Anuluj
                </button>
              </div>
            </form>
          )}
          {emailKom ? <p className="mt-3 text-[13px] font-medium text-ink-2">{emailKom}</p> : null}
        </div>

        {/* Hasło */}
        <div className="rounded-2xl border border-linia bg-white p-5 sm:p-6">
          {wiersz(
            <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
            "Twoje hasło", edytujHaslo ? "" : "••••••••••••",
          )}
          {!edytujHaslo ? (
            <button onClick={() => { setEdytujHaslo(true); setHasloKom(""); }} className={edytujPill}>
              {ikonaOlowek} {przezGoogle ? "Ustaw hasło" : "Edytuj"}
            </button>
          ) : (
            <form onSubmit={zapiszHaslo} className="mt-4 flex flex-col gap-3">
              <input className={input} type="password" placeholder="Nowe hasło (min. 6 znaków)" autoComplete="new-password" value={noweHaslo} onChange={(e) => setNoweHaslo(e.target.value)} />
              <div className="flex gap-2">
                <button type="submit" disabled={hasloBusy} className="rounded-lg bg-ink px-5 py-2.5 text-[13px] font-semibold tracking-wide text-tlo transition-colors hover:bg-akcent disabled:opacity-60">
                  {hasloBusy ? "ZAPISYWANIE…" : "ZAPISZ HASŁO"}
                </button>
                <button type="button" onClick={() => { setEdytujHaslo(false); setHasloKom(""); }} className="rounded-lg border border-linia-2 px-5 py-2.5 text-[13px] font-medium text-ink-2 hover:border-ink hover:text-ink">
                  Anuluj
                </button>
              </div>
            </form>
          )}
          {przezGoogle && !edytujHaslo ? (
            <p className="mt-3 text-[12.5px] text-ink-3">Logujesz się przez Google. Możesz ustawić hasło, aby logować się także e-mailem.</p>
          ) : null}
          {hasloKom ? <p className="mt-3 text-[13px] font-medium text-ink-2">{hasloKom}</p> : null}
        </div>
      </div>

      {/* Skróty konta */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link href="/konto/zamowienia" className={kafel}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-szary/70 text-ink transition-colors group-hover:bg-akcent group-hover:text-tlo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M6 2 4 6v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V6l-2-4H6Z" />
              <path d="M4 6h16M10 10a2 2 0 0 0 4 0" />
            </svg>
          </span>
          <span>
            <span className="block text-[15px] font-semibold">Moje zamówienia</span>
            <span className="mt-0.5 block text-[13px] text-ink-2">Historia i status zamówień</span>
          </span>
        </Link>
        <Link href="/ulubione" className={kafel}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-szary/70 text-ink transition-colors group-hover:bg-akcent group-hover:text-tlo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9Z" />
            </svg>
          </span>
          <span>
            <span className="block text-[15px] font-semibold">Ulubione</span>
            <span className="mt-0.5 block text-[13px] text-ink-2">Zapisane produkty</span>
          </span>
        </Link>
      </div>

      {/* Przeglądaj sklep */}
      <h2 className="mb-3 mt-10 text-[13px] font-semibold uppercase tracking-wide text-ink-2">Przeglądaj sklep</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {KATEGORIE.map((k) => (
          <Link key={k.href} href={k.href} className="rounded-xl border border-linia bg-white px-4 py-4 text-center text-[14px] font-semibold text-ink no-underline transition-all hover:border-ink hover:bg-szary/30">
            {k.label}
          </Link>
        ))}
      </div>

      {/* Wyloguj — dyskretnie na dole */}
      <div className="mt-10 border-t border-linia pt-5 text-center">
        <button
          onClick={() => { void wyloguj(); router.replace("/"); }}
          className="text-[13px] text-ink-2 underline underline-offset-2 transition-colors hover:text-akcent"
        >
          Wyloguj się
        </button>
      </div>
    </div>
  );
}
