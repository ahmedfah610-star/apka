// Pobiera paczkomaty InPost z publicznego API ShipX (bez tokenu).
// Wołane z przeglądarki jako /api/paczkomaty?q=<miasto> — bez problemów CORS.

interface PunktInPost {
  name: string;
  address?: { line1?: string; line2?: string };
  location_description?: string | null;
  address_details?: { city?: string };
}

export const revalidate = 3600;

// Największe polskie miasta — pozwala trafić też przy pisowni bez polskich znaków
// (np. "gdansk" -> "Gdańsk", "lodz" -> "Łódź").
const MIASTA = [
  "Warszawa", "Kraków", "Łódź", "Wrocław", "Poznań", "Gdańsk", "Szczecin", "Bydgoszcz", "Lublin",
  "Białystok", "Katowice", "Gdynia", "Częstochowa", "Radom", "Sosnowiec", "Toruń", "Kielce", "Rzeszów",
  "Gliwice", "Zabrze", "Olsztyn", "Bielsko-Biała", "Bytom", "Zielona Góra", "Rybnik", "Ruda Śląska",
  "Opole", "Tychy", "Gorzów Wielkopolski", "Dąbrowa Górnicza", "Płock", "Elbląg", "Wałbrzych",
  "Włocławek", "Tarnów", "Chorzów", "Koszalin", "Kalisz", "Legnica", "Grudziądz", "Słupsk", "Jaworzno",
  "Jastrzębie-Zdrój", "Nowy Sącz", "Jelenia Góra", "Siedlce", "Mysłowice", "Konin", "Piotrków Trybunalski",
  "Inowrocław", "Lubin", "Ostrów Wielkopolski", "Suwałki", "Stargard", "Gniezno", "Głogów", "Pabianice",
  "Leszno", "Żory", "Zamość", "Pruszków", "Łomża", "Ełk", "Chełm", "Mielec", "Przemyśl", "Stalowa Wola",
  "Tomaszów Mazowiecki", "Piła", "Legionowo", "Racibórz", "Otwock", "Ostrołęka", "Świdnica", "Sopot",
];
function bezZnakow(s: string): string {
  return s.toLowerCase().replace(/ł/g, "l").normalize("NFKD").replace(/[̀-ͯ]/g, "");
}
const MAPA_MIAST = new Map(MIASTA.map((m) => [bezZnakow(m), m]));

/** Poprawia pisownię miasta pod API InPost (wielkość liter + polskie znaki). */
function normalizujMiasto(s: string): string {
  const znane = MAPA_MIAST.get(bezZnakow(s));
  if (znane) return znane;
  return s.toLocaleLowerCase("pl").replace(/\p{L}+/gu, (w) => w[0].toLocaleUpperCase("pl") + w.slice(1));
}

export async function GET(req: Request) {
  const surowe = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (surowe.length < 2) return Response.json({ items: [] });
  const q = normalizujMiasto(surowe);

  const url =
    `https://api-shipx-pl.easypack24.net/v1/points?type=parcel_locker&status=Operating` +
    `&city=${encodeURIComponent(q)}&per_page=60`;

  try {
    const r = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return Response.json({ items: [] });
    const dane = (await r.json()) as { items?: PunktInPost[] };
    const items = (dane.items ?? []).map((p) => ({
      kod: p.name,
      miasto: p.address_details?.city ?? "",
      opis: [p.address?.line1, p.location_description].filter(Boolean).join(" · "),
    }));
    return Response.json({ items });
  } catch {
    return Response.json({ items: [] });
  }
}
