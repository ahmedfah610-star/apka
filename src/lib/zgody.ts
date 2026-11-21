// Consent Mode v2 — wspólne dla layoutu (serwer) i komponentu Google (przeglądarka).
const ZGODY = ["ad_storage", "ad_user_data", "ad_personalization", "analytics_storage"] as const;

export const stanZgod = (v: "granted" | "denied") => JSON.stringify(Object.fromEntries(ZGODY.map((k) => [k, v])));

// Domyślny stan zgód — wstawiany w <head>, ZANIM cokolwiek Google się wczyta (wymóg Google w UE).
// Jednorazowy (drugie wykonanie nic nie robi) — powtarza go też inicjalizacja tagu w GoogleAnalytics.tsx,
// bo strona 404 Next.js nie ma skryptów z <head> (wcześniej: „gtag is not defined” i tag bez zgód domyślnych).
export const ZGODY_DOMYSLNE = `
window.dataLayer = window.dataLayer || [];
if (typeof window.gtag !== 'function') {
  window.gtag = function(){ window.dataLayer.push(arguments); };
  gtag('consent', 'default', Object.assign(${stanZgod("denied")}, { wait_for_update: 500 }));
  gtag('set', 'ads_data_redaction', true);
  gtag('set', 'url_passthrough', true); // bez zgody: identyfikator kliknięcia w reklamę idzie w adresie, nie w cookie
}
`;
