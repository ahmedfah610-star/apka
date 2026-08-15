"use client";

import { useState } from "react";

// Przyciski udostępniania wpisu — wspierają dzielenie się treścią (ruch + linki).
export function UdostepnijWpis({ url, tytul }: { url: string; tytul: string }) {
  const [skopiowano, setSkopiowano] = useState(false);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(tytul);
  const linki = [
    { nazwa: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { nazwa: "X", href: `https://twitter.com/intent/tweet?url=${u}&text=${t}` },
    { nazwa: "Pinterest", href: `https://pinterest.com/pin/create/button/?url=${u}&description=${t}` },
    { nazwa: "WhatsApp", href: `https://wa.me/?text=${t}%20${u}` },
  ];

  async function kopiuj() {
    try {
      await navigator.clipboard.writeText(url);
      setSkopiowano(true);
      setTimeout(() => setSkopiowano(false), 2000);
    } catch {
      /* ignoruj */
    }
  }

  const kl = "rounded-lg border border-linia-2 px-3.5 py-2 text-[13px] font-medium text-ink no-underline transition-colors hover:border-ink hover:bg-szary/30";

  return (
    <div className="mt-10 flex flex-wrap items-center gap-2.5 border-t border-linia pt-6">
      <span className="mr-1 text-[13px] font-semibold text-ink-2">Udostępnij:</span>
      {linki.map((l) => (
        <a key={l.nazwa} href={l.href} target="_blank" rel="noopener noreferrer" className={kl}>
          {l.nazwa}
        </a>
      ))}
      <button onClick={kopiuj} className={kl}>
        {skopiowano ? "Skopiowano ✓" : "Kopiuj link"}
      </button>
    </div>
  );
}
