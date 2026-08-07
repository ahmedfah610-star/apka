/** @type {import('next').NextConfig} */

// Nagłówki bezpieczeństwa dla wszystkich odpowiedzi.
const naglowkiBezpieczenstwa = [
  // Wymuś HTTPS w przeglądarce na 2 lata (z subdomenami).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Blokuj zgadywanie typu MIME.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Ochrona przed clickjackingiem (osadzaniem w cudzej ramce).
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Ogranicz wyciek adresu URL w nagłówku Referer.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Wyłącz niepotrzebne API przeglądarki (mikrofon, kamera); geolokalizacja
  // tylko dla własnej domeny (mapa paczkomatów/punktów odbioru).
  { key: "Permissions-Policy", value: "camera=(), microphone=(), payment=(), geolocation=(self)" },
  // Bezpieczne dyrektywy CSP, które nie psują zewnętrznych integracji:
  // brak osadzania w ramkach, brak wtyczek, blokada przejęcia <base>,
  // automatyczne podbicie http→https.
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'; upgrade-insecure-requests",
  },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // nie zdradzaj, że to Next.js
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24,
    remotePatterns: [
      { protocol: "https", hostname: "*.allegroimg.com" },
      { protocol: "https", hostname: "allegroimg.com" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: naglowkiBezpieczenstwa }];
  },
};

module.exports = nextConfig;
