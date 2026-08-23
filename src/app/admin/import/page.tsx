"use client";

import { useEffect, useState } from "react";

interface Status { skonfigurowany: boolean; polaczony: boolean }
interface Wynik { pobrano: number; zapisano: number; bledy: number; blad?: string }

export default function AdminImport() {
  const [status, setStatus] = useState<Status | null>(null);
  const [start, setStart] = useState<{ userCode: string; link: string; deviceCode: string } | null>(null);
  const [komunikat, setKomunikat] = useState("");
  const [busy, setBusy] = useState(false);
  const [wynik, setWynik] = useState<Wynik | null>(null);

  const odswiezStatus = async () => {
    try {
      const r = await fetch("/api/admin/allegro");
      const d = await r.json();
      if (d.ok) setStatus({ skonfigurowany: d.skonfigurowany, polaczony: d.polaczony });
    } catch { /* ignoruj */ }
  };
  useEffect(() => { void odswiezStatus(); }, []);

  async function polacz() {
    setBusy(true);
    setKomunikat("");
    setWynik(null);
    try {
      const r = await fetch("/api/admin/allegro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ akcja: "start" }),
      });
      const d = await r.json();
      if (!d.ok) { setKomunikat(d.blad || "Nie udało się rozpocząć łączenia."); setBusy(false); return; }
      setStart({ userCode: d.userCode, link: d.link, deviceCode: d.deviceCode });
      setKomunikat("Otwórz link, potwierdź kod, a my sprawdzamy połączenie…");
      // Polling co interval.
      const interval = Math.max(3, Number(d.interval) || 5) * 1000;
      const koniec = Date.now() + (Number(d.wygasa) || 600) * 1000;
      const tik = async () => {
        if (Date.now() > koniec) { setKomunikat("Kod wygasł — spróbuj ponownie."); setBusy(false); return; }
        const rp = await fetch("/api/admin/allegro", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ akcja: "poll", deviceCode: d.deviceCode }),
        });
        const dp = await rp.json();
        if (dp.ok) { setKomunikat("Połączono z Allegro ✓"); setStart(null); setBusy(false); void odswiezStatus(); return; }
        if (dp.oczekuje) { setTimeout(() => void tik(), interval); return; }
        setKomunikat(dp.blad || "Nie udało się połączyć."); setBusy(false);
      };
      setTimeout(() => void tik(), interval);
    } catch {
      setKomunikat("Błąd połączenia."); setBusy(false);
    }
  }

  async function wyczysc() {
    if (!confirm("Usunąć wszystkie produkty zaimportowane z Allegro? (Twoje ręcznie dodane produkty zostają.)")) return;
    setBusy(true);
    setKomunikat("Czyszczenie…");
    setWynik(null);
    try {
      const r = await fetch("/api/admin/allegro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ akcja: "wyczysc" }),
      });
      const d = (await r.json().catch(() => ({}))) as { ok?: boolean; usunieto?: number; blad?: string };
      setKomunikat(d.ok ? `Usunięto ${d.usunieto ?? 0} zaimportowanych produktów. Teraz kliknij „Importuj oferty".` : `Błąd: ${d.blad || "nie udało się"}`);
    } catch {
      setKomunikat("Błąd połączenia podczas czyszczenia.");
    } finally {
      setBusy(false);
    }
  }

  async function poprawKategorie() {
    setBusy(true);
    setKomunikat("Przeliczanie kategorii…");
    setWynik(null);
    try {
      const r = await fetch("/api/admin/allegro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ akcja: "przeklasyfikuj" }),
      });
      const d = (await r.json().catch(() => ({}))) as { ok?: boolean; zmieniono?: number; blad?: string };
      setKomunikat(d.ok ? `Poprawiono kategorie: ${d.zmieniono ?? 0} produktów.` : `Błąd: ${d.blad || "nie udało się"}`);
    } catch {
      setKomunikat("Błąd połączenia.");
    } finally {
      setBusy(false);
    }
  }

  async function usunWszystko() {
    if (!confirm("UWAGA: to usunie WSZYSTKIE produkty ze sklepu (stare i zaimportowane). Na pewno?")) return;
    if (!confirm("Ostatnie ostrzeżenie — sklep zostanie pusty do czasu importu. Kontynuować?")) return;
    setBusy(true);
    setKomunikat("Usuwanie wszystkich produktów…");
    setWynik(null);
    try {
      const r = await fetch("/api/admin/allegro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ akcja: "wyczysc_wszystko" }),
      });
      const d = (await r.json().catch(() => ({}))) as { ok?: boolean; usunieto?: number; blad?: string };
      setKomunikat(d.ok ? `Usunięto ${d.usunieto ?? 0} produktów. Teraz kliknij „Importuj oferty".` : `Błąd: ${d.blad || "nie udało się"}`);
    } catch {
      setKomunikat("Błąd połączenia podczas usuwania.");
    } finally {
      setBusy(false);
    }
  }

  async function importuj() {
    setBusy(true);
    setWynik(null);
    // Import porcjami: wołamy endpoint w pętli, aż koniec === true.
    let offset = 0;
    let zapisano = 0;
    let pobrano = 0;
    let bledy = 0;
    let pierwszyBlad = "";
    try {
      for (let i = 0; i < 1000; i++) {
        setKomunikat(`Import w toku… zapisano ${zapisano} ofert`);
        const r = await fetch("/api/admin/allegro", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ akcja: "import", tylkoAktywne: true, offset }),
        });
        const d = (await r.json().catch(() => ({}))) as { ok?: boolean; pobrano?: number; zapisano?: number; bledy?: number; koniec?: boolean; blad?: string };
        if (!r.ok || d.ok === false) {
          setKomunikat(`Błąd: ${d.blad || `serwer zwrócił ${r.status}`}`);
          setWynik({ pobrano, zapisano, bledy });
          setBusy(false);
          return;
        }
        zapisano += d.zapisano ?? 0;
        pobrano += d.pobrano ?? 0;
        bledy += d.bledy ?? 0;
        offset += d.pobrano ?? 0;
        if (d.blad) pierwszyBlad = d.blad;
        if (d.koniec || (d.pobrano ?? 0) === 0) break;
      }
      setWynik({ pobrano, zapisano, bledy });
      setKomunikat(bledy && pierwszyBlad ? `Zakończono, ale ${bledy} z błędem. Pierwszy błąd: ${pierwszyBlad}` : "Import zakończony ✓");
    } catch {
      setKomunikat(`Przerwano połączenie. Zapisano dotąd ${zapisano} ofert — kliknij „Importuj" ponownie, aby dokończyć.`);
      setWynik({ pobrano, zapisano, bledy });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[26px] font-bold tracking-tight">Import z Allegro</h1>
        <p className="text-[14px] text-ink-2">Pobierz swoje oferty z Allegro (opisy, zdjęcia, rozmiary, kolor, stan) prosto do sklepu.</p>
      </div>

      {!status ? (
        <p className="text-[13px] text-ink-2">Sprawdzanie statusu…</p>
      ) : !status.skonfigurowany ? (
        <div className="border border-[oklch(92%_0.07_85)] bg-[oklch(97%_0.03_85)] p-5 text-[14px] text-ink">
          <p className="font-semibold">Brak konfiguracji Allegro</p>
          <p className="mt-1 text-[13.5px] text-ink-2">
            Dodaj w Vercelu zmienne <code className="rounded bg-szary px-1">ALLEGRO_CLIENT_ID</code> i{" "}
            <code className="rounded bg-szary px-1">ALLEGRO_CLIENT_SECRET</code> (z developer.allegro.pl) oraz uruchom migrację
            <code className="ml-1 rounded bg-szary px-1">supabase/allegro.sql</code>.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Połączenie */}
          <section className="border border-linia bg-white p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${status.polaczony ? "bg-[oklch(70%_0.15_150)]" : "bg-linia-2"}`} />
              <h2 className="text-[15px] font-bold">{status.polaczony ? "Połączono z Allegro" : "Niepołączono"}</h2>
            </div>
            {!status.polaczony ? (
              <>
                <button onClick={polacz} disabled={busy} className="bg-ink px-6 py-2.5 text-[13px] font-semibold tracking-wide text-tlo transition-colors hover:bg-akcent disabled:opacity-60">
                  {busy ? "ŁĄCZENIE…" : "POŁĄCZ Z ALLEGRO"}
                </button>
                {start ? (
                  <div className="mt-4 rounded-lg border border-linia bg-szary/30 p-4 text-[14px]">
                    <p>1. Otwórz: <a href={start.link} target="_blank" rel="noreferrer" className="font-semibold text-akcent underline">{start.link}</a></p>
                    <p className="mt-1">2. Wpisz kod: <span className="rounded bg-white px-2 py-0.5 font-mono text-[16px] font-bold tracking-widest">{start.userCode}</span></p>
                    <p className="mt-1 text-[12.5px] text-ink-2">3. Potwierdź dostęp — reszta zrobi się sama.</p>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <button onClick={importuj} disabled={busy} className="bg-ink px-6 py-2.5 text-[13px] font-semibold tracking-wide text-tlo transition-colors hover:bg-akcent disabled:opacity-60">
                  {busy ? "IMPORTOWANIE…" : "IMPORTUJ OFERTY"}
                </button>
                <button onClick={poprawKategorie} disabled={busy} className="border border-linia-2 px-5 py-2.5 text-[13px] font-medium text-ink transition-colors hover:border-ink disabled:opacity-60">
                  Popraw kategorie
                </button>
                <button onClick={wyczysc} disabled={busy} className="border border-linia-2 px-5 py-2.5 text-[13px] font-medium text-ink-2 transition-colors hover:border-akcent hover:text-akcent disabled:opacity-60">
                  Wyczyść zaimportowane
                </button>
                <button onClick={usunWszystko} disabled={busy} className="border border-akcent/50 px-5 py-2.5 text-[13px] font-medium text-akcent transition-colors hover:bg-akcent hover:text-tlo disabled:opacity-60">
                  Usuń WSZYSTKIE produkty
                </button>
              </div>
            )}
          </section>

          {komunikat ? <p className="text-[13.5px] text-ink-2">{komunikat}</p> : null}
          {wynik && !wynik.blad ? (
            <div className="border border-linia bg-white p-5 text-[14px]">
              <p><strong>{wynik.zapisano}</strong> ofert zapisanych z {wynik.pobrano} pobranych{wynik.bledy ? `, ${wynik.bledy} z błędem` : ""}.</p>
              <p className="mt-1 text-[13px] text-ink-2">Sprawdź je w zakładce <a href="/admin/produkty" className="underline hover:text-akcent">Produkty</a> — możesz poprawić kategorię, wiek i stan.</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
