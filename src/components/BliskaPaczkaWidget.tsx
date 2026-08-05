"use client";

import { useEffect, useRef } from "react";
import type { PunktOdbioru } from "@/components/WyborPunktu";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Mapa punktów odbioru (Bliska Paczka) ograniczona do sieci ORLEN Paczka.
// Sam wybór punktu nie wymaga tokenu.
const SRC = "https://widget.bliskapaczka.pl/prod/main.js";

export function BliskaPaczkaWidget({ onWybierz }: { onWybierz: (p: PunktOdbioru) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const cb = useRef(onWybierz);
  cb.current = onWybierz;

  useEffect(() => {
    let anulowane = false;

    const init = () => {
      const w = window as any;
      if (anulowane || !ref.current || !w.BPWidget) return;
      ref.current.innerHTML = "";
      try {
        w.BPWidget.init(ref.current, {
          language: "pl",
          operators: [{ operator: "RUCH" }], // sieć ORLEN Paczka
          betaRendering: true,
          callback: (pos: any) => {
            if (!pos) return;
            const adr = pos.address ?? {};
            const kod = pos.code ?? pos.id ?? pos.name ?? "";
            const miasto = pos.city ?? adr.city ?? "";
            const ulica = pos.street ?? adr.street ?? "";
            const opis = pos.name || pos.description || [ulica, miasto].filter(Boolean).join(", ");
            if (!kod) return;
            cb.current({ kod: String(kod), miasto: String(miasto), opis: String(opis) });
          },
        });
      } catch (e) {
        console.error("[bliska-paczka] init:", e);
      }
    };

    const w = window as any;
    if (w.BPWidget) {
      init();
    } else {
      let s = document.getElementById("bliska-paczka-js") as HTMLScriptElement | null;
      if (!s) {
        s = document.createElement("script");
        s.id = "bliska-paczka-js";
        s.src = SRC;
        s.defer = true;
        document.body.appendChild(s);
      }
      s.addEventListener("load", init);
    }

    return () => {
      anulowane = true;
    };
  }, []);

  return <div ref={ref} className="h-full w-full" />;
}
