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
    const { data: sub } = sb.auth.onAuthStateChange((_e, sesja) => {
      setUser(sesja?.user ?? null);
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
    // Gdy wymagane potwierdzenie e-maila — sesji jeszcze nie ma.
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
  };
  return <Kontekst.Provider value={wartosc}>{children}</Kontekst.Provider>;
}

export function useAuth() {
  const ctx = useContext(Kontekst);
  if (!ctx) throw new Error("useAuth musi być użyte wewnątrz AuthProvider");
  return ctx;
}
