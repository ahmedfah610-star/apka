"use client";

import { useEffect, useRef } from "react";
import type { Paczkomat } from "@/components/WyborPaczkomatu";

/**
 * Oficjalny widget mapy paczkomatów InPost (Geowidget v5).
 * Ładuje realną bazę wszystkich punktów. Wymaga tokenu z konta InPost,
 * podanego w zmiennej środowiskowej NEXT_PUBLIC_INPOST_GEOWIDGET_TOKEN.
 */
const TOKEN = process.env.NEXT_PUBLIC_INPOST_GEOWIDGET_TOKEN;
const CALLBACK = "__fasolkaOnPoint";

export function geowidgetDostepny() {
  return !!TOKEN;
}

export function GeowidgetInpost({ onWybierz }: { onWybierz: (p: Paczkomat) => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Globalny callback wywoływany przez widget po wybraniu punktu.
    (window as unknown as Record<string, unknown>)[CALLBACK] = (event: {
      detail?: {
        name?: string;
        address?: { line1?: string; line2?: string };
        address_details?: { city?: string };
      };
    }) => {
      const d = event?.detail;
      if (!d?.name) return;
      onWybierz({
        kod: d.name,
        opis: [d.address?.line1, d.address?.line2].filter(Boolean).join(", "),
        miasto: d.address_details?.city ?? "",
      });
    };

    // CSS widgetu
    if (!document.getElementById("inpost-geo-css")) {
      const link = document.createElement("link");
      link.id = "inpost-geo-css";
      link.rel = "stylesheet";
      link.href = "https://geowidget.inpost.pl/inpost-geowidget.css";
      document.head.appendChild(link);
    }

    const wstawWidget = () => {
      if (ref.current && TOKEN && !ref.current.querySelector("inpost-geowidget")) {
        ref.current.innerHTML = `<inpost-geowidget token="${TOKEN}" language="pl" config="parcelcollect" onpoint="${CALLBACK}" style="width:100%;height:100%;display:block"></inpost-geowidget>`;
      }
    };

    const w = window as unknown as { __inpostGeoLoaded?: boolean };
    if (w.__inpostGeoLoaded) {
      wstawWidget();
    } else if (!document.getElementById("inpost-geo-js")) {
      const script = document.createElement("script");
      script.id = "inpost-geo-js";
      script.src = "https://geowidget.inpost.pl/inpost-geowidget.js";
      script.defer = true;
      script.onload = () => {
        w.__inpostGeoLoaded = true;
        wstawWidget();
      };
      document.body.appendChild(script);
    }
  }, [onWybierz]);

  return <div ref={ref} className="h-full w-full" />;
}
