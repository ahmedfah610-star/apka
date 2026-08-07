"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";

export function PanelKonta() {
  const router = useRouter();
  const { user, zaladowano, wlaczone, wyloguj } = useAuth();

  useEffect(() => {
    if (zaladowano && wlaczone && !user) router.replace("/konto/logowanie");
  }, [zaladowano, wlaczone, user, router]);

  if (!wlaczone) return <p className="text-[15px] text-ink-2">Konto jest chwilowo niedostępne.</p>;
  if (!zaladowano || !user) return <p className="text-[15px] text-ink-2">Ładowanie…</p>;

  const kafel = "border border-linia p-5 text-inherit no-underline transition-colors hover:border-ink";

  return (
    <div>
      <p className="mb-6 text-[15px] text-ink-2">
        Zalogowano jako <strong className="text-ink">{user.email}</strong>
      </p>
      <div className="grid max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
        <Link href="/konto/zamowienia" className={kafel}>
          <span className="block text-[15px] font-semibold">Moje zamówienia</span>
          <span className="block text-[13px] text-ink-2">Historia i status zamówień</span>
        </Link>
        <Link href="/ulubione" className={kafel}>
          <span className="block text-[15px] font-semibold">Ulubione</span>
          <span className="block text-[13px] text-ink-2">Zapisane produkty</span>
        </Link>
      </div>
      <button
        onClick={() => {
          void wyloguj();
          router.replace("/");
        }}
        className="mt-6 text-[13px] underline underline-offset-2 hover:text-akcent"
      >
        Wyloguj się
      </button>
    </div>
  );
}
