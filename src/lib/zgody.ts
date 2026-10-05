// Consent Mode v2 — wspólne dla layoutu (serwer) i komponentu Google (przeglądarka).
const ZGODY = ["ad_storage", "ad_user_data", "ad_personalization", "analytics_storage"] as const;

export const stanZgod = (v: "granted" | "denied") => JSON.stringify(Object.fromEntries(ZGODY.map((k) => [k, v])));

// Domyślny stan zgód — wstawiany w <head>, ZANIM cokolwiek Google się wczyta (wymóg Google w UE).
export const ZGODY_DOMYSLNE = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('consent', 'default', Object.assign(${stanZgod("denied")}, { wait_for_update: 500 }));
gtag('set', 'ads_data_redaction', true);
gtag('set', 'url_passthrough', false);
`;
