/**
 * Content-Security-Policy del sitio — FUENTE ÚNICA.
 * La usan `src/middleware.ts` y el middleware `pre` de seguridad
 * (`src/security-headers.ts`, registrado en astro.config.mjs).
 */
export const CSP_HEADER = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://static.cloudflareinsights.com https://www.clarity.ms https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://images.unsplash.com https://tile.openstreetmap.org https://*.tile.openstreetmap.org https://server.arcgisonline.com",
  "media-src 'self' blob:",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' blob: https://www.clarity.ms https://*.clarity.ms https://www.google-analytics.com https://*.google-analytics.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');
