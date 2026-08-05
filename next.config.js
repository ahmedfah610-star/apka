/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Nowoczesne formaty (mniejszy rozmiar) dla obrazów obsługiwanych przez next/image.
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24,
    // Zdalne źródła zdjęć produktów (na wypadek użycia next/image dla allegroimg).
    remotePatterns: [
      { protocol: "https", hostname: "*.allegroimg.com" },
      { protocol: "https", hostname: "allegroimg.com" },
    ],
  },
};

module.exports = nextConfig;
