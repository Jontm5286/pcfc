/**
 * Content-Security-Policy del sitio — FUENTE ÚNICA.
 * La usan `src/middleware.ts` y el middleware `pre` de seguridad
 * (`src/security-headers.ts`, registrado en astro.config.mjs).
 */
export const CSP_HEADER = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://static.cloudflareinsights.com https://www.clarity.ms",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: https://images.unsplash.com https://picsum.photos https://images.emdash.com https://tile.openstreetmap.org https://*.tile.openstreetmap.org https://server.arcgisonline.com",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https://www.clarity.ms https://*.clarity.ms",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');
