import { defineMiddleware } from 'astro:middleware';

/**
 * PCFC — Middleware de seguridad
 * Agrega headers HTTP de seguridad a todas las respuestas.
 * Ref: https://owasp.org/www-project-secure-headers/
 */
export const onRequest = defineMiddleware(async (context, next) => {
  // FIX-B: el binding Cloudflare IMAGES responde 500 cuando /_image trae
  // `h` sin `fit`. Astro genera srcsets con w+h, así que se elimina `h`
  // antes del transform. Si el transform sigue fallando, se redirige al
  // asset original (siempre 200) para que ninguna imagen quede rota.
  if (context.url.pathname === '/_image') {
    const imageUrl = new URL(context.url);
    const href = imageUrl.searchParams.get('href');
    if (href) {
      let imageResponse: Response;
      if (imageUrl.searchParams.has('h')) {
        imageUrl.searchParams.delete('h');
        imageResponse = await context.rewrite(imageUrl.pathname + imageUrl.search);
      } else {
        imageResponse = await next();
      }
      if (imageResponse.status === 500 && href.startsWith('/')) {
        return Response.redirect(new URL(href, imageUrl.origin).toString(), 302);
      }
      return imageResponse;
    }
  }

  const response = await next();

  // APIs y descargas: sin headers de página (algunas respuestas como
  // redirects traen headers inmutables y el set() las rompería).
  if (context.url.pathname.startsWith('/api/')) return response;

  // Content Security Policy — protección contra XSS e inyección
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://static.cloudflareinsights.com",
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
