import type { APIRoute } from 'astro';
import { fetchPublishedGalleries } from '../../lib/academy-feed';

/**
 * GET /api/foto-descarga?galeria=<slug>&foto=<índice>
 * Descarga de fotos de partidos con gate por fecha (servidor):
 *  - Publicada hace ≤ 30 días → original 4K tal cual se subió.
 *  - Más vieja → variante 2000px on-demand (endpoint /_image EmDash).
 *  - URL externa (no media EmDash) → redirect directo (comportamiento actual).
 * Responde el archivo con Content-Disposition: attachment (mismo downloadName).
 */

const WINDOW_DAYS = 30;

/** Media servida por EmDash (local ./data/media o R2 en prod). */
function isEmdashMedia(src: string): boolean {
  return src.startsWith('/_emdash/') || (src.startsWith('/') && !src.startsWith('//'));
}

export const GET: APIRoute = async ({ url }) => {
  const slug = (url.searchParams.get('galeria') || '').trim();
  const idx = parseInt(url.searchParams.get('foto') || '', 10);

  const { galleries } = await fetchPublishedGalleries();
  const gallery = galleries.find((g) => g.slug === slug);
  const photo =
    gallery && Number.isInteger(idx) && idx >= 0 ? gallery.photos[idx] : undefined;
  if (!gallery || !photo) {
    return new Response('Foto no encontrada', { status: 404 });
  }

  const filename = `${slug}-${String(idx + 1).padStart(2, '0')}.jpg`;

  // Externa: descarga directa como siempre.
  if (!isEmdashMedia(photo.src)) {
    return new Response(null, {
      status: 302,
      headers: { Location: photo.src },
    });
  }

  // Gate 4K (primer mes) vs 2000px.
  let target = photo.src;
  const pub = gallery.publishedAtIso ? Date.parse(gallery.publishedAtIso) : NaN;
  const fresh =
    !Number.isNaN(pub) && Date.now() - pub <= WINDOW_DAYS * 86_400_000;
  if (!fresh) {
    target = `/_image?href=${encodeURIComponent(photo.src)}&w=2000&f=webp`;
  }

  try {
    const upstream = await fetch(new URL(target, url), {
      headers: { accept: 'image/*' },
    });
    if (!upstream.ok || !upstream.body) throw new Error(`upstream ${upstream.status}`);
    return new Response(upstream.body, {
      headers: {
        'Content-Type': upstream.headers.get('Content-Type') || 'image/jpeg',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch {
    // Si falla el proxy/transform, redirige al original como último recurso.
    return new Response(null, {
      status: 302,
      headers: { Location: new URL(photo.src, url).href },
    });
  }
};
