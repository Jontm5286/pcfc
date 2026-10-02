import type { APIRoute } from 'astro';
import { getLikesStore, resolveD1Binding, RateLimitedError } from '../../lib/foto-likes-db';
import { buildValidKeys, getAllPosts } from '../../lib/fotos-posts';

export const prerender = false;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

/**
 * GET /api/foto-likes?keys=<slug:idx>,...
 * Conteos en lote (máx 200 claves). Sin validación: claves
 * desconocidas devuelven 0.
 */
export const GET: APIRoute = async ({ url, locals }) => {
  const raw = (url.searchParams.get('ids') || url.searchParams.get('keys') || '').trim();
  const keys = [
    ...new Set(
      raw
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean)
    ),
  ].slice(0, 200);
  const store = await getLikesStore(resolveD1Binding(locals));
  return json({ counts: await store.getCounts(keys) });
};

async function voterHash(ip: string, ua: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${ip}\n${ua}`));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * POST /api/foto-likes { key: "<slug>:<indice>" }
 * Toggle like/unlike anti-doble-voto (voter_hash=sha256(ip+UA)).
 * La clave se valida contra galerías publicadas; rate-limit 60 votos/h.
 */
export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
  let key = '';
  try {
    const body = await request.json();
    key = String(body?.photo_key ?? body?.key ?? '').trim();
  } catch {
    return json({ error: 'bad_request' }, 400);
  }
  if (!/^[^:,]{1,160}:\d{1,4}$/.test(key)) return json({ error: 'bad_request' }, 400);

  const { posts } = await getAllPosts();
  if (!buildValidKeys(posts).has(key)) return json({ error: 'not_found' }, 404);

  const forwarded = request.headers.get('x-forwarded-for') || '';
  const ip =
    clientAddress ||
    request.headers.get('cf-connecting-ip') ||
    forwarded.split(',')[0].trim() ||
    'unknown';
  const ua = request.headers.get('user-agent') || '';
  const hash = await voterHash(ip, ua);

  const store = await getLikesStore(resolveD1Binding(locals));
  try {
    const { likes, liked } = await store.toggle(key, hash);
    return json({ key, likes, liked });
  } catch (e) {
    if (e instanceof RateLimitedError) return json({ error: 'rate_limited' }, 429);
    throw e;
  }
};
