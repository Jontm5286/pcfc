import type { APIRoute } from 'astro';
import {
  fetchAcademyFeed,
  fetchPublishedGalleries,
  toCalendarItem,
  type AcademyMatch,
  type CalendarMatchItem,
} from '../../lib/academy-feed';
import { buildMatchSlug } from '../../lib/match-photos';

export const prerender = false;

interface FeedVivoPayload {
  upcoming: CalendarMatchItem[];
  played: CalendarMatchItem[];
}

/** Último payload bueno (si Academy cae, se devuelve esto; nunca 500). */
let lastGood: FeedVivoPayload | null = null;
const EMPTY: FeedVivoPayload = { upcoming: [], played: [] };

/**
 * GET /api/feed-vivo
 * Calendario vivo: próximos + jugados mapeados a CalendarMatchItem[]
 * (reutiliza toCalendarItem de academy-feed).
 * photosHref se reconcilia por academy_id con fallback al slug calculado.
 * Caché de 5 min (memoria en fetchAcademyFeed + Cache-Control).
 * Con Academy caído devuelve el último bueno o [] — nunca 500.
 */
export const GET: APIRoute = async () => {
  try {
    const [feed, published] = await Promise.all([
      fetchAcademyFeed(),
      fetchPublishedGalleries().catch(() => ({ galleries: [] as Awaited<ReturnType<typeof fetchPublishedGalleries>>['galleries'] })),
    ]);
    const galleries = published.galleries;

    // Galería publicada por academy_id → slug, y set de slugs publicados.
    const byAcademyId = new Map<string, string>();
    const publishedSlugs = new Set<string>();
    for (const g of galleries) {
      publishedSlugs.add(g.slug);
      if (g.academyId) byAcademyId.set(g.academyId, g.slug);
    }

    const withPhotos = (m: AcademyMatch, past: boolean): CalendarMatchItem => {
      const item = toCalendarItem(m, past);
      const resolved =
        (m.id && byAcademyId.get(m.id)) || buildMatchSlug(item.team1, item.team2, m.matchDate);
      item.slug = resolved;
      if (past && publishedSlugs.has(resolved)) item.photosHref = `/fotos#${resolved}`;
      return item;
    };

    const payload: FeedVivoPayload = {
      upcoming: feed.upcoming.map((m) => withPhotos(m, false)),
      played: feed.played.map((m) => withPhotos(m, true)),
    };
    lastGood = payload;
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Feed vivo con caché de 5 min en CDN.
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch {
    const fallback = lastGood ?? EMPTY;
    return new Response(JSON.stringify(fallback), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
      },
    });
  }
};
