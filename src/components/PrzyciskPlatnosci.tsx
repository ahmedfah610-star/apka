"use client";

import { useState } from "react";
import { dokonczPlatnosc } from "@/lib/zamowieniaKlienta";

/** „Dokończ płatność" — nowa transakcja Przelewy24 dla zamówienia czekającego na zapłatę. */
export function PrzyciskPlatnosci({ id, klasa }: { id: string; klasa?: string }) {
  const [busy, setBusy] = useState(false);
  const [blad, setBlad] = useState("");
  return (
    <div>
      <button
        onClick={async () => {
          setBusy(true);
          setBlad("");
          const r = await dokonczPlatnosc(id);
          if (r.url) {
            window.location.href = r.url;
            return;
          }
          setBlad(r.blad ?? "");
          setBusy(false);
        }}
        disabled={busy}
        className={
          klasa ??
          "rounded-lg bg-ink px-5 py-3 text-[14.5px] font-bold text-white transition-colors hover:bg-akcent disabled:opacity-60"
        }
      >
        {busy ? "Przekierowuję do płatności…" : "Dokończ płatność"}
      </button>
      {blad ? <p className="mt-2 text-[13px] text-cena">{blad}</p> : null}
    </div>
  );
}
