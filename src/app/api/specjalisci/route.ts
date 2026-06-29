import { NextRequest, NextResponse } from "next/server";
import { szukajUslugodawcow } from "@/lib/googlePlaces";
import { USLUGODAWCY } from "@/data/uslugodawcy";
import type { TypUslugodawcy } from "@/types/domain";

// Endpoint serwerowy: GET /api/specjalisci?miasto=Warszawa&typ=weterynarz
// Klucz GOOGLE_PLACES_API_KEY czytany jest tylko tutaj, po stronie serwera.
// Gdy klucz nie jest skonfigurowany albo zapytanie do Google się nie powiedzie,
// zwracamy dane demo z src/data/uslugodawcy.ts, żeby aplikacja nigdy nie była pusta.
export async function GET(request: NextRequest) {
  const miasto = request.nextUrl.searchParams.get("miasto");
  const typ = request.nextUrl.searchParams.get("typ") as TypUslugodawcy | null;

  if (!miasto || (typ !== "weterynarz" && typ !== "fryzjer")) {
    return NextResponse.json({ error: "Wymagane parametry: miasto, typ" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      source: "demo",
      wyniki: USLUGODAWCY.filter((u) => u.miasto === miasto && u.typ === typ),
    });
  }

  try {
    const wyniki = await szukajUslugodawcow(miasto, typ, apiKey);
    return NextResponse.json({ source: "google", wyniki });
  } catch (e) {
    console.error("Błąd Google Places API:", e);
    return NextResponse.json({
      source: "demo",
      wyniki: USLUGODAWCY.filter((u) => u.miasto === miasto && u.typ === typ),
    });
  }
}
