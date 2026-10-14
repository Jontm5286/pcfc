/**
 * Middleware de seguridad registrado con `order: 'pre'` (ver astro.config.mjs).
 * Corre POR FUERA del middleware de EmDash, así que su CSP gana también en
 * `/_emdash/*`: en prod EmDash fija su propio CSP restrictivo (sin allowlist
 * del beacon de Cloudflare) y el `src/middleware.ts` corre por dentro, por lo
 * que sin este `pre` su header no sobrevivía en el admin.
 */
import { defineMiddleware } from 'astro:middleware';
import { CSP_HEADER } from './lib/csp.js';

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  // APIs y descargas: sin headers de página.
  if (context.url.pathname.startsWith('/api/')) return response;
  response.headers.set('Content-Security-Policy', CSP_HEADER);
  return response;
});
