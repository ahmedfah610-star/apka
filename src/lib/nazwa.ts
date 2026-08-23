// Porządkowanie nazw ofert zaimportowanych z Allegro. Sprzedawca wpisywał tytuły
// „pod wyszukiwarkę Allegro": KRZYCZĄCE WERSALIKI, upchane słowa kluczowe, wiszące
// „cm" po usuniętym rozmiarze, powtórzenia. Tutaj robimy z tego schludny tytuł
// sklepowy — bez utraty sensu. Funkcja czysta, deterministyczna.

// Słowa, które zostawiamy WIELKIMI literami (marki/skróty), gdy tak wpisano.
const AKRONIMY = new Set(["3D", "UV", "XXL", "XL", "PL", "EU"]);

function wersaliki(w: string): boolean {
  const litery = w.replace(/[^A-Za-zÀ-ž]/g, "");
  return litery.length >= 2 && litery === litery.toUpperCase();
}

function kapitalizujPierwsza(s: string): string {
  return s.replace(/^[\p{L}]/u, (c) => c.toUpperCase());
}

// Częste literówki sprzedawcy → poprawna forma (rdzeń, obejmuje odmiany).
function poprawLiterowki(s: string): string {
  return s
    .replace(/dziwczyn/gi, "dziewczyn")
    .replace(/dzieczyn/gi, "dziewczyn")
    .replace(/dzieczyn/gi, "dziewczyn");
}

/** Schludny tytuł sklepowy z surowej nazwy oferty. */
export function ladnaNazwa(surowa: string): string {
  if (!surowa) return surowa;
  let s = String(surowa).replace(/\s+/g, " ").trim();

  // Wiszące jednostki/śmieci po usuniętym rozmiarze: „56 cm" → „", „100% " → „%", „r. 56".
  s = s.replace(/\b\d+\s*cm\b/gi, " ").replace(/\bcm\b/gi, " ");
  s = s.replace(/\brozm\.?\b/gi, " ").replace(/\br\.?\s*\d+\b/gi, " ");
  s = s.replace(/\s{2,}/g, " ").trim();

  const slowa = s.split(" ").filter(Boolean);
  const wynik: string[] = [];
  for (const w of slowa) {
    // Osierocone znaki po usuniętej liczbie: „%", ".", "-", "/".
    if (/^[%./\-–,]+$/.test(w)) continue;
    const poprz = wynik[wynik.length - 1];
    const lw = w.toLowerCase();
    // Dokładny duplikat obok siebie: „na na", „PAJAC pajac" → jeden.
    if (poprz && poprz.toLowerCase() === lw) continue;
    // Przedrostek-duplikat: „PAJAC PAJACYK" → zostaw dłuższy, bardziej konkretny.
    if (poprz) {
      const lp = poprz.toLowerCase();
      const wspolny = (a: string, b: string) => {
        let i = 0;
        while (i < a.length && i < b.length && a[i] === b[i]) i++;
        return i;
      };
      if (wspolny(lp, lw) >= 4 && (lw.startsWith(lp) || lp.startsWith(lw))) {
        wynik[wynik.length - 1] = lw.length >= lp.length ? w : poprz;
        continue;
      }
    }
    wynik.push(w);
  }

  // Casing: KRZYCZĄCE słowa → małe litery (poza akronimami). Pojedyncze wielkie
  // litery w środku (Z, W, I) → małe. Słowa już mieszane (Bluza) zostają.
  const zcasingiem = wynik.map((w) => {
    if (AKRONIMY.has(w.toUpperCase())) return w.toUpperCase();
    if (/^[\p{Lu}]$/u.test(w)) return w.toLowerCase();
    return wersaliki(w) ? w.toLowerCase() : w;
  });

  let out = zcasingiem.join(" ");
  out = out.replace(/\s+([.,;:])/g, "$1").replace(/\.\s*\.+/g, "."); // spacje przed interpunkcją, zdublowane kropki
  out = out.replace(/\s{2,}/g, " ").replace(/^[\s.,;:–-]+/, "").trim();
  return kapitalizujPierwsza(poprawLiterowki(out));
}
