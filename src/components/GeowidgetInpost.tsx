"use client";

import { useEffect, useRef } from "react";
import type { Paczkomat } from "@/components/WyborPaczkomatu";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Token z konta InPost (Geowidget v5). Publiczny (client-side) → prefiks NEXT_PUBLIC_.
const TOKEN = process.env.NEXT_PUBLIC_INPOST_GEOWIDGET_TOKEN;
const CB = "__fasolkaPaczkomat";

export function geowidgetDostepny() {
  return !!TOKEN;
}

/** Oficjalna mapa paczkomatów InPost (Geowidget v5). */
export function GeowidgetInpost({ onWybierz }: { onWybierz: (p: Paczkomat) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const cb = useRef(onWybierz);
  cb.current = onWybierz;

  useEffect(() => {
    (window as any)[CB] = (e: any) => {
      // Geowidget v5 wywołuje callback z obiektem punktu bezpośrednio;
      // w innych wariantach punkt bywa w e.detail — obsługujemy oba.
      const d = e?.detail ?? e;
      if (!d?.name) return;
      cb.current({
        kod: d.name,
        miasto: d.address_details?.city ?? "",
        opis: [d.address?.line1, d.address?.line2].filter(Boolean).join(", "),
      });
    };

    if (!document.getElementById("inpost-geo-css")) {
      const l = document.createElement("link");
      l.id = "inpost-geo-css";
      l.rel = "stylesheet";
      l.href = "https://geowidget.inpost.pl/inpost-geowidget.css";
      document.head.appendChild(l);
    }

    const wstaw = () => {
      if (ref.current && TOKEN && !ref.current.querySelector("inpost-geowidget")) {
        ref.current.innerHTML = `<inpost-geowidget token="${TOKEN}" language="pl" config="parcelCollect" onpoint="${CB}" style="width:100%;height:100%;display:block"></inpost-geowidget>`;
      }
    };

    const w = window as any;
    if (w.__inpostGeoLoaded) {
      wstaw();
    } else {
      let s = document.getElementById("inpost-geo-js") as HTMLScriptElement | null;
      if (!s) {
        s = document.createElement("script");
        s.id = "inpost-geo-js";
        s.src = "https://geowidget.inpost.pl/inpost-geowidget.js";
        s.defer = true;
        document.body.appendChild(s);
      }
      s.addEventListener("load", () => {
        w.__inpostGeoLoaded = true;
        wstaw();
      });
    }
  }, []);

  return <div ref={ref} className="h-full w-full" />;
}
