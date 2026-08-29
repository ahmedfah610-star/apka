import { czyAdmin, odmowa } from "@/lib/adminAuth";
import { ga4Skonfigurowane, raport, raportNaZywo, wiersze } from "@/lib/ga4";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Najcenniejsza analityka z GA4 do panelu: podsumowanie 28 dni, wykres dzienny,
// źródła ruchu, top strony i produkty, urządzenia oraz aktywni na żywo.
export async function GET() {
  if (!czyAdmin()) return odmowa();
  if (!ga4Skonfigurowane()) {
    return Response.json({ ok: false, powod: "brak_konfiguracji" });
  }

  const zakres = [{ startDate: "28daysAgo", endDate: "today" }];
  const bezp = async <T>(p: Promise<T>, awaryjnie: T): Promise<T> => {
    try {
      return await p;
    } catch {
      return awaryjnie;
    }
  };

  const [podsum, seria, kanaly, strony, produkty, urzadzenia, zdarzenia, naZywo] = await Promise.all([
    // Podsumowanie 28 dni
    bezp(
      raport({
        dateRanges: zakres,
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
          { name: "engagementRate" },
          { name: "averageSessionDuration" },
        ],
      }),
      null,
    ),
    // Dzienny wykres użytkowników
    bezp(
      raport({
        dateRanges: zakres,
        dimensions: [{ name: "date" }],
        metrics: [{ name: "activeUsers" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      }),
      null,
    ),
    // Źródła ruchu (kanały)
    bezp(
      raport({
        dateRanges: zakres,
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        metrics: [{ name: "sessions" }, { name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 8,
      }),
      null,
    ),
    // Najczęściej oglądane strony
    bezp(
      raport({
        dateRanges: zakres,
        dimensions: [{ name: "pageTitle" }],
        metrics: [{ name: "screenPageViews" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 10,
      }),
      null,
    ),
    // Najczęściej oglądane produkty (ścieżki /produkty/…)
    bezp(
      raport({
        dateRanges: zakres,
        dimensions: [{ name: "pageTitle" }, { name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }],
        dimensionFilter: { filter: { fieldName: "pagePath", stringFilter: { matchType: "BEGINS_WITH", value: "/produkty/" } } },
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 10,
      }),
      null,
    ),
    // Urządzenia
    bezp(
      raport({
        dateRanges: zakres,
        dimensions: [{ name: "deviceCategory" }],
        metrics: [{ name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
      }),
      null,
    ),
    // Kluczowe zdarzenia / konwersje
    bezp(
      raport({
        dateRanges: zakres,
        dimensions: [{ name: "eventName" }],
        metrics: [{ name: "eventCount" }],
        orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
        limit: 8,
      }),
      null,
    ),
    // Aktywni na żywo
    bezp(raportNaZywo({ metrics: [{ name: "activeUsers" }] }), null),
  ]);

  const m = podsum?.rows?.[0]?.metricValues ?? [];
  const num = (i: number) => Number(m[i]?.value ?? 0);

  return Response.json({
    ok: true,
    podsumowanie: {
      uzytkownicy: num(0),
      sesje: num(1),
      odslony: num(2),
      zaangazowanie: num(3), // 0..1
      srCzas: num(4), // sekundy
    },
    seria: wiersze(seria).map((w) => ({ data: w.wymiary[0], uzytkownicy: w.metryki[0] })),
    kanaly: wiersze(kanaly).map((w) => ({ kanal: w.wymiary[0], sesje: w.metryki[0], uzytkownicy: w.metryki[1] })),
    strony: wiersze(strony).map((w) => ({ tytul: w.wymiary[0], odslony: w.metryki[0] })),
    produkty: wiersze(produkty).map((w) => ({ tytul: w.wymiary[0], sciezka: w.wymiary[1], odslony: w.metryki[0] })),
    urzadzenia: wiersze(urzadzenia).map((w) => ({ typ: w.wymiary[0], uzytkownicy: w.metryki[0] })),
    zdarzenia: wiersze(zdarzenia).map((w) => ({ nazwa: w.wymiary[0], liczba: w.metryki[0] })),
    naZywo: Number(naZywo?.rows?.[0]?.metricValues?.[0]?.value ?? 0),
  });
}
