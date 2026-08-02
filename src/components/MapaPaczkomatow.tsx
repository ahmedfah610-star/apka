"use client";

import { useEffect, useRef } from "react";
import type { Paczkomat } from "@/components/WyborPaczkomatu";

/* eslint-disable @typescript-eslint/no-explicit-any */

let ladowanie: Promise<void> | null = null;
function zaladujLeaflet(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as any).L) return Promise.resolve();
  if (ladowanie) return ladowanie;
  ladowanie = new Promise<void>((res, rej) => {
    if (!document.getElementById("leaflet-css")) {
      const l = document.createElement("link");
      l.id = "leaflet-css";
      l.rel = "stylesheet";
      l.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(l);
    }
    const s = document.createElement("script");
    s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    s.async = true;
    s.onload = () => res();
    s.onerror = () => rej();
    document.body.appendChild(s);
  });
  return ladowanie;
}

export function MapaPaczkomatow({
  punkty,
  onWybierz,
}: {
  punkty: Paczkomat[];
  onWybierz: (p: Paczkomat) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapa = useRef<any>(null);
  const warstwa = useRef<any>(null);
  const cb = useRef(onWybierz);
  cb.current = onWybierz;

  useEffect(() => {
    let anulowane = false;
    zaladujLeaflet()
      .then(() => {
        const L = (window as any).L;
        if (anulowane || !ref.current || !L) return;
        if (!mapa.current) {
          mapa.current = L.map(ref.current, { scrollWheelZoom: true, attributionControl: true }).setView([52.11, 19.42], 6);
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap",
            maxZoom: 19,
          }).addTo(mapa.current);
        }
        rysuj();
        setTimeout(() => mapa.current?.invalidateSize(), 60);
      })
      .catch(() => {});
    return () => {
      anulowane = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(rysuj, [punkty]);

  function rysuj() {
    const L = (window as any).L;
    if (!L || !mapa.current) return;
    if (warstwa.current) mapa.current.removeLayer(warstwa.current);
    const grupa = L.layerGroup();
    const wsp: [number, number][] = [];
    for (const p of punkty) {
      if (typeof p.lat !== "number" || typeof p.lng !== "number") continue;
      const m = L.marker([p.lat, p.lng]);
      m.bindPopup(
        `<div style="font:600 13px system-ui"><div>Paczkomat ${p.kod}</div><div style="font-weight:400;color:#555">${p.opis ?? ""}</div><button data-kod="${p.kod}" style="margin-top:6px;background:#1f1f1f;color:#fff;border:0;padding:6px 10px;font:600 12px system-ui;cursor:pointer">Wybierz ten paczkomat</button></div>`,
      );
      m.on("popupopen", (e: any) => {
        const btn = e.popup.getElement()?.querySelector("button[data-kod]");
        if (btn) btn.onclick = () => cb.current(p);
      });
      m.addTo(grupa);
      wsp.push([p.lat, p.lng]);
    }
    grupa.addTo(mapa.current);
    warstwa.current = grupa;
    if (wsp.length) mapa.current.fitBounds(wsp, { padding: [30, 30], maxZoom: 14 });
  }

  return <div ref={ref} className="h-full w-full bg-szary" />;
}
