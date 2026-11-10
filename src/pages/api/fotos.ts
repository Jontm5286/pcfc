import type { APIRoute } from 'astro';
import { getPostsPage } from '../../lib/fotos-posts';

export const prerender = false;

/**
 * GET /api/fotos?page=1&limit=10
 * Página de galerías (LIMIT/OFFSET en D1 vía EmDash).
 * Responde { posts, page, perPage, total, totalPages }.
 * `page`/`limit` inválidos se sujetan (nunca 4xx/5xx por query mala).
 */
export const GET: APIRoute = async ({ url }) => {
  const params = url.searchParams;
  const rawPage = Number(params.get('page'));
  const rawLimit = Number(params.get('limit'));
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;
  const limit =
    Number.isFinite(rawLimit) && rawLimit >= 1 ? Math.min(Math.floor(rawLimit), 50) : 10;

  const { posts, perPage, total, totalPages } = await getPostsPage(page, limit);
  return new Response(JSON.stringify({ posts, page, perPage, total, totalPages }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      // Página cambiante con contenido editorial: revalidación corta en CDN.
      'Cache-Control': 'public, max-age=60',
    },
  });
};
