/**
 * academy-feed — PCFC + FutbolPro Academy
 * =======================================
 * Feed en vivo de partidos de la app de gestión.
 * GET {ACADEMY_API_URL}/api/public/matches -> { upcoming, played }.
 * Sin auth y con CORS abierto; solo expone datos aptos para publicar.
 *
 * Los grupos de la API (donde están los jugadores) se mapean a nuestros
 * 4 niveles de desarrollo web: pre | form-baja | form-alta | elite.
 * Lo consumen: calendario.astro y FixturesBar (marquee-track).
 * (scripts/sync-match-photos.mjs replica el mapeo en JS — mantener igual.)
 */

export interface AcademyMatch {
  id: string;
  title: string;
  category: string;
  opponent: string;
  matchType: string;
  matchDate: string;
  matchTime?: string | null;
  meetingTime?: string | null;
  location?: string | null;
  isHome: boolean;
  status: 'convocada' | 'jugada' | 'suspendida';
  result?: { home: number; away: number } | null;
}

export type WebCategorySlug = 'pre' | 'form-baja' | 'form-alta' | 'elite';

export interface WebCategory {
  slug: WebCategorySlug;
  label: string;
  /** Nombre corto del grupo en la app, ej. "Sub-15", "Elite". */
  short: string;
}

export const ACADEMY_API_URL =
  import.meta.env.PUBLIC_ACADEMY_API_URL ||
  'https://futbolpro-academy.johantavarez89.workers.dev';

/** Grupos reales de la app -> niveles web (Elite/Reserva es grupo propio). */
export function academyCategoryToWeb(category: string): WebCategory {
  const c = (category || '').toLowerCase();
  const short = (category || '').split('(')[0].trim() || 'Cantera';
  if (c.includes('elite') || c.includes('reserva')) {
    return { slug: 'elite', label: 'Elite / Reserva', short };
  }
  if (c.includes('sub-6') || c.includes('sub-8')) {
    return { slug: 'pre', label: 'Pre-Formativas', short };
  }
  if (c.includes('sub-10') || c.includes('sub-12')) {
    return { slug: 'form-baja', label: 'Formativas Bajas', short };
  }
  if (c.includes('femen')) {
    return { slug: 'form-alta', label: 'Femenino', short };
  }
  return { slug: 'form-alta', label: 'Formativas Altas', short };
}

/** "2026-09-13" -> "Sáb 13 sep". */
export function formatMatchDate(iso: string): string {
  try {
    const d = new Date(`${iso}T12:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    const s = d
      .toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
      .replace(/,/g, '');
    return s.charAt(0).toUpperCase() + s.slice(1);
  } catch {
    return iso;
  }
}

/** "13:00" -> "1:00 PM". Respeta "10:00 AM" ya formateado. */
export function formatMatchTime(t?: string | null): string | undefined {
  if (!t) return undefined;
  const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*([AP]M)?$/i);
  if (!m) return t;
  if (m[3]) return t.toUpperCase();
  let h = parseInt(m[1], 10);
  const suffix = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m[2]} ${suffix}`;
}

export interface AcademyFeed {
  upcoming: AcademyMatch[];
  played: AcademyMatch[];
}

/** Trae el feed; en error devuelve listas vacías (el llamador usa respaldo). */
export async function fetchAcademyFeed(timeoutMs = 8000): Promise<AcademyFeed> {
  const empty: AcademyFeed = { upcoming: [], played: [] };
  try {
    const apiRes = await fetch(`${ACADEMY_API_URL}/api/public/matches`, {
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!apiRes.ok) return empty;
    const apiData = await apiRes.json();
    return {
      upcoming: Array.isArray(apiData?.upcoming) ? apiData.upcoming : [],
      played: Array.isArray(apiData?.played) ? apiData.played : [],
    };
  } catch {
    return empty;
  }
}
