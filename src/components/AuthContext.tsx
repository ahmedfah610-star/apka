"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { sbBrowser } from "@/lib/supabaseBrowser";

type Wynik = { ok: boolean; blad?: string; potwierdzenie?: boolean };

interface AuthCtx {
  user: User | null;
  zaladowano: boolean;
  wlaczone: boolean;
  zarejestruj: (email: string, haslo: string, imie?: string) => Promise<Wynik>;
  zaloguj: (email: string, haslo: string) => Promise<Wynik>;
  zalogujGoogle: () => Promise<void>;
  wyloguj: () => Promise<void>;
  resetHasla: (email: string) => Promise<Wynik>;
  ustawHaslo: (haslo: string) => Promise<Wynik>;
  zapiszProfil: (dane: { imie?: string; telefon?: string; adres?: string; kod?: string; miasto?: string }) => Promise<Wynik>;
}

const Kontekst = createContext<AuthCtx | null>(null);

function komunikat(blad: string): string {
  const b = blad.toLowerCase();
  if (b.includes("invalid login")) return "Nieprawidłowy e-mail lub hasło.";
  if (b.includes("email not confirmed")) return "Potwierdź e-mail, zanim się zalogujesz (sprawdź skrzynkę).";
  if (b.includes("already registered") || b.includes("already been registered")) return "Konto z tym e-mailem już istnieje.";
  if (b.includes("password") && b.includes("6")) return "Hasło musi mieć co najmniej 6 znaków.";
  if (b.includes("rate limit") || b.includes("too many")) return "Zbyt wiele prób — spróbuj za chwilę.";
  return blad;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const sb = sbBrowser();
  const [user, setUser] = useState<User | null>(null);
  const [zaladowano, setZaladowano] = useState(false);

  useEffect(() => {
    if (!sb) {
      setZaladowano(true);
      return;
    }
    sb.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setZaladowano(true);
    });
    const { data: sub } = sb.auth.onAuthStateChange((event, sesja) => {
      const u = sesja?.user ?? null;
      setUser(u);
      // Powitanie dla NOWYCH kont Google (Google weryfikuje e-mail sam, więc
      // nie przechodzą przez /auth/confirm). Wysyłamy raz, tylko dla świeżego konta.
      if (event === "SIGNED_IN" && u && u.app_metadata?.provider === "google") {
        try {
          const swieze = Date.now() - new Date(u.created_at).getTime() < 5 * 60 * 1000;
          const klucz = `powitano:${u.id}`;
          if (swieze && !localStorage.getItem(klucz)) {
            localStorage.setItem(klucz, "1");
            const imie = (u.user_metadata?.full_name || u.user_metadata?.name || u.user_metadata?.imie) as string | undefined;
            fetch("/api/konto/powitanie", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: u.email, imie }),
            }).catch(() => {});
          }
        } catch {
          /* ignoruj */
        }
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [sb]);

  const zarejestruj = useCallback<AuthCtx["zarejestruj"]>(async (email, haslo, imie) => {
    if (!sb) return { ok: false, blad: "Logowanie chwilowo niedostępne." };
    const { data, error } = await sb.auth.signUp({
      email: email.trim(),
      password: haslo,
      options: { data: imie ? { imie } : undefined, emailRedirectTo: `${window.location.origin}/konto` },
    });
    if (error) return { ok: false, blad: komunikat(error.message) };
    // Konto od razu aktywne (potwierdzanie wyłączone) → powitanie teraz.
    // Gdy wymagane potwierdzenie — powitanie wyśle się po kliknięciu linku
    // aktywacyjnego (ze strony /auth/confirm), więc tu nic nie wysyłamy.
    if (data.session) {
      fetch("/api/konto/powitanie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), imie }),
      }).catch(() => {});
    }
    return { ok: true, potwierdzenie: !data.session };
  }, [sb]);

  const zaloguj = useCallback<AuthCtx["zaloguj"]>(async (email, haslo) => {
    if (!sb) return { ok: false, blad: "Logowanie chwilowo niedostępne." };
    const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password: haslo });
    if (error) return { ok: false, blad: komunikat(error.message) };
    return { ok: true };
  }, [sb]);

  const zalogujGoogle = useCallback(async () => {
    if (!sb) return;
    await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/konto` } });
  }, [sb]);

  const wyloguj = useCallback(async () => {
    if (!sb) return;
    await sb.auth.signOut();
    setUser(null);
  }, [sb]);

  const resetHasla = useCallback<AuthCtx["resetHasla"]>(async (email) => {
    if (!sb) return { ok: false, blad: "Logowanie chwilowo niedostępne." };
    const { error } = await sb.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/konto/nowe-haslo`,
    });
    if (error) return { ok: false, blad: komunikat(error.message) };
    return { ok: true };
  }, [sb]);

  const ustawHaslo = useCallback<AuthCtx["ustawHaslo"]>(async (haslo) => {
    if (!sb) return { ok: false, blad: "Logowanie chwilowo niedostępne." };
    const { error } = await sb.auth.updateUser({ password: haslo });
    if (error) return { ok: false, blad: komunikat(error.message) };
    return { ok: true };
  }, [sb]);

  const zapiszProfil = useCallback<AuthCtx["zapiszProfil"]>(async (dane) => {
    if (!sb) return { ok: false, blad: "Zapis chwilowo niedostępny." };
    const przytnij = (v: string | undefined, n: number) => (v ?? "").trim().slice(0, n);
    const { data, error } = await sb.auth.updateUser({
      data: {
        imie: przytnij(dane.imie, 80),
        telefon: przytnij(dane.telefon, 30),
        adres: przytnij(dane.adres, 120),
        kod: przytnij(dane.kod, 12),
        miasto: przytnij(dane.miasto, 80),
      },
    });
    if (error) return { ok: false, blad: komunikat(error.message) };
    if (data.user) setUser(data.user);
    return { ok: true };
  }, [sb]);

  const wartosc: AuthCtx = {
    user,
    zaladowano,
    wlaczone: !!sb,
    zarejestruj,
    zaloguj,
    zalogujGoogle,
    wyloguj,
    resetHasla,
    ustawHaslo,
    zapiszProfil,
  };
  return <Kontekst.Provider value={wartosc}>{children}</Kontekst.Provider>;
}

export function useAuth() {
  const ctx = useContext(Kontekst);
  if (!ctx) throw new Error("useAuth musi być użyte wewnątrz AuthProvider");
  return ctx;
}
