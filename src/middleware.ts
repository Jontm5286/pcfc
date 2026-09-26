import { defineMiddleware } from 'astro:middleware';

/**
 * PCFC — Middleware de seguridad
 * Agrega headers HTTP de seguridad a todas las respuestas.
 * Ref: https://owasp.org/www-project-secure-headers/
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();

  // APIs y descargas: sin headers de página (algunas respuestas como
  // redirects traen headers inmutables y el set() las rompería).
  if (context.url.pathname.startsWith('/api/')) return response;

  // Content Security Policy — protección contra XSS e inyección
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https://images.unsplash.com https://picsum.photos https://images.emdash.com",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );

  // Prevenir clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevenir MIME sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy — deshabilitar features innecesarias
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
});
