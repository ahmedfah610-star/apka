"use client";

import { useEffect, useRef } from "react";
import { OPIS_KLASA } from "@/lib/opisStyl";

// Edytor opisu „jak w Wordzie" — bez kodu. Pisze się bezpośrednio w opisie, który wygląda
// tak jak na stronie; przyciski u góry: nagłówek, zwykły tekst, pogrubienie, lista, cofnij.
// Wklejany tekst trafia bez obcego formatowania (np. z Worda czy Allegro).

// Porządkowanie HTML z edytora: tylko bezpieczne znaczniki, bez stylów i atrybutów.
export function czystyHtml(html: string): string {
  if (typeof window === "undefined") return html;
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const DOZWOLONE = new Set(["H2", "H3", "P", "BR", "STRONG", "B", "EM", "I", "U", "UL", "OL", "LI", "IMG"]);
  const czysc = (el: Element) => {
    for (const dziecko of Array.from(el.children)) {
      czysc(dziecko);
      if (dziecko.tagName === "DIV") {
        // Enter w edytorze tworzy <div> — zamieniamy na akapit.
        const p = doc.createElement("p");
        p.innerHTML = dziecko.innerHTML;
        dziecko.replaceWith(p);
      } else if (dziecko.tagName === "H1") {
        const h = doc.createElement("h2");
        h.innerHTML = dziecko.innerHTML;
        dziecko.replaceWith(h);
      } else if (!DOZWOLONE.has(dziecko.tagName)) {
        dziecko.replaceWith(...Array.from(dziecko.childNodes)); // np. <span style> → sam tekst
      } else {
        for (const a of Array.from(dziecko.attributes)) {
          if (!(dziecko.tagName === "IMG" && a.name === "src" && /^https?:\/\//.test(a.value))) dziecko.removeAttribute(a.name);
        }
      }
    }
  };
  const korzen = doc.body.firstElementChild!;
  czysc(korzen);
  return korzen.innerHTML
    .replace(/<p>(\s|&nbsp;|<br>)*<\/p>/g, "")
    .trim();
}

// Zwykły tekst → akapity (dla produktów, które mają tylko krótki opis).
export function tekstNaHtml(t: string): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return t
    .split(/\n{2,}|\r\n\r\n/)
    .map((a) => a.trim())
    .filter(Boolean)
    .map((a) => `<p>${esc(a).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function EdytorOpisu({ poczatkowy, onZmiana }: { poczatkowy: string; onZmiana: (html: string) => void }) {
  const pole = useRef<HTMLDivElement>(null);

  // Treść ustawiamy raz (edytowalne pole nie może być kontrolowane przez React — gubiłby kursor).
  useEffect(() => {
    if (pole.current) pole.current.innerHTML = poczatkowy;
  }, [poczatkowy]);

  const zglos = () => {
    if (pole.current) onZmiana(czystyHtml(pole.current.innerHTML));
  };

  function polecenie(cmd: string, arg?: string) {
    pole.current?.focus();
    document.execCommand(cmd, false, arg);
    zglos();
  }

  const PRZYCISKI: { etykieta: React.ReactNode; tytul: string; akcja: () => void }[] = [
    { etykieta: <span className="text-[15px] font-extrabold">Nagłówek</span>, tytul: "Zamień akapit na nagłówek", akcja: () => polecenie("formatBlock", "H3") },
    { etykieta: <span className="text-[14px]">Zwykły tekst</span>, tytul: "Zwykły akapit", akcja: () => polecenie("formatBlock", "P") },
    { etykieta: <span className="text-[15px] font-extrabold">B</span>, tytul: "Pogrubienie (zaznacz tekst)", akcja: () => polecenie("bold") },
    {
      etykieta: (
        <span className="flex items-center gap-1.5 text-[14px]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M9 6h11M9 12h11M9 18h11" />
            <circle cx="4.5" cy="6" r="1" fill="currentColor" />
            <circle cx="4.5" cy="12" r="1" fill="currentColor" />
            <circle cx="4.5" cy="18" r="1" fill="currentColor" />
          </svg>
          Lista
        </span>
      ),
      tytul: "Lista punktowana",
      akcja: () => polecenie("insertUnorderedList"),
    },
    { etykieta: <span className="text-[14px]">↶ Cofnij</span>, tytul: "Cofnij ostatnią zmianę", akcja: () => polecenie("undo") },
  ];

  return (
    <div className="overflow-hidden rounded-xl border-2 border-linia-2 bg-white focus-within:border-ink">
      <div className="flex flex-wrap gap-1 border-b border-linia bg-szary/60 p-1.5">
        {PRZYCISKI.map((b) => (
          <button
            key={b.tytul}
            type="button"
            title={b.tytul}
            // mousedown zamiast click — żeby nie stracić zaznaczenia tekstu w opisie
            onMouseDown={(e) => {
              e.preventDefault();
              b.akcja();
            }}
            className="rounded-lg px-3 py-1.5 text-ink transition-colors hover:bg-white"
          >
            {b.etykieta}
          </button>
        ))}
      </div>
      <div
        ref={pole}
        contentEditable
        suppressContentEditableWarning
        onInput={zglos}
        onBlur={zglos}
        onPaste={(e) => {
          // Wklejanie bez obcego formatowania — tylko tekst i podział na akapity.
          e.preventDefault();
          const tekst = e.clipboardData.getData("text/plain");
          document.execCommand("insertHTML", false, tekstNaHtml(tekst) || "");
          zglos();
        }}
        className={`${OPIS_KLASA} max-h-[60vh] min-h-[320px] overflow-y-auto px-4 py-3 outline-none [&_h2]:mt-3 [&_h3]:mt-3`}
        aria-label="Opis produktu"
        role="textbox"
        aria-multiline="true"
      />
    </div>
  );
}
