// Prosty limiter w pamięci (per-instancja serverless — najlepszy wysiłek).
// Podnosi próg dla botów, spamu i brute-force. Nie zastępuje WAF/Cloudflare,
// ale skutecznie tłumi masowe nadużycia z jednego adresu.
type Wpis = { count: number; reset: number };
const mapa = new Map<string, Wpis>();

/** Adres IP żądania (Vercel ustawia x-forwarded-for). */
export function ipZadania(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "nieznane";
}

/** true = mieści się w limicie; false = przekroczono. */
export function wLimicie(klucz: string, limit: number, oknoMs: number): boolean {
  const teraz = Date.now();
  // Okazjonalne sprzątanie, żeby mapa nie rosła w nieskończoność.
  if (mapa.size > 5000) {
    for (const [k, v] of mapa) if (teraz > v.reset) mapa.delete(k);
  }
  const w = mapa.get(klucz);
  if (!w || teraz > w.reset) {
    mapa.set(klucz, { count: 1, reset: teraz + oknoMs });
    return true;
  }
  if (w.count >= limit) return false;
  w.count++;
  return true;
}

export function limitOdpowiedz() {
  return Response.json(
    { ok: false, blad: "Zbyt wiele prób — odczekaj chwilę i spróbuj ponownie." },
    { status: 429, headers: { "Retry-After": "60" } },
  );
}
