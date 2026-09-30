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
  opponentLogo?: string | null;
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
  import.meta.env.PUBLIC_ACADEMY_API_URL || 'https://app.puntacanafc.com';

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

/** Trae el feed con caché en memoria 5 min (por isolate del Worker).
 * El primer hit tras expirar paga el fetch; el resto sirve instantáneo.
 * En error devuelve listas vacías (el llamador usa respaldo). */
const FEED_TTL_MS = 5 * 60 * 1000;
let feedCache: { at: number; feed: AcademyFeed } | null = null;

export async function fetchAcademyFeed(timeoutMs = 8000): Promise<AcademyFeed> {
  const empty: AcademyFeed = { upcoming: [], played: [] };
  if (feedCache && Date.now() - feedCache.at < FEED_TTL_MS) return feedCache.feed;
  try {
    const apiRes = await fetch(`${ACADEMY_API_URL}/api/public/matches`, {
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!apiRes.ok) return feedCache?.feed ?? empty;
    const apiData = await apiRes.json();
    const feed: AcademyFeed = {
      upcoming: Array.isArray(apiData?.upcoming) ? apiData.upcoming : [],
      played: Array.isArray(apiData?.played) ? apiData.played : [],
    };
    feedCache = { at: Date.now(), feed };
    return feed;
  } catch {
    return feedCache?.feed ?? empty;
  }
}

// ─────────────────────────────────────────────────────────
// Galerías EmDash (colección `match_photos`) — fuente de verdad de /fotos.
// Una entrada = una galería. Solo published + con fotos enlaza/renderiza.
// `partido` es el slug (para /fotos#<slug>); cae a entry.id si viene vacío.
// ─────────────────────────────────────────────────────────

const ES_MONTHS_LONG = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

/** "2026-09-06" -> "6 sep 2026". */
export function formatDisplayDate(iso: string): string {
  const m = (iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  const mon = ES_MONTHS_LONG[parseInt(m[2], 10) - 1] || '';
  return `${parseInt(m[3], 10)} ${mon} ${m[1]}`.trim();
}

/** Label de categoría EmDash -> slug web. */
export function categoryLabelToSlug(label: string): WebCategorySlug {
  const c = (label || '').toLowerCase();
  if (c.includes('pre-formativas') || c.includes('preformativas')) return 'pre';
  if (c.includes('bajas') || c.includes('baja')) return 'form-baja';
  if (c.includes('elite') || c.includes('reserva')) return 'elite';
  return 'form-alta';
}

export interface GalleryPhoto {
  src: string;
  alt: string;
  caption?: string;
}

export interface PublishedGallery {
  slug: string;
  academyId?: string;
  categorySlug: WebCategorySlug;
  categoryLabel: string;
  team1: string;
  team2: string;
  date: string;
  /** ISO publishedAt (para el gate de descarga 4K/2000px). */
  publishedAtIso: string | null;
  thumbnail: string;
  thumbnailAlt: string;
  photos: GalleryPhoto[];
  /** Flag EmDash `show_in_hero` — aparece en el rotador del hero. */
  showInHero: boolean;
}

/** Normaliza el flag `show_in_hero` (true/1/"1"/"true"). */
function parseShowInHero(v: unknown): boolean {
  return v === true || v === 1 || v === '1' || v === 'true';
}

/** JSON.parse que nunca tira — devuelve fallback ante texto inválido. */
function safeParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** src de una foto (AMBOS formatos):
 * - Plugin pcfc-media-gallery: {storageKey} o {meta:{storageKey}} → URL del API de medios.
 * - upload-pack legacy: string directa u objeto imagen EmDash {src}. */
function photoSrc(p: Record<string, unknown>): string | null {
  if (typeof p.storageKey === 'string' && p.storageKey) {
    return `/_emdash/api/media/file/${p.storageKey}`;
  }
  const meta = p.meta as Record<string, unknown> | null;
  if (meta && typeof meta === 'object' && typeof meta.storageKey === 'string' && meta.storageKey) {
    return `/_emdash/api/media/file/${meta.storageKey}`;
  }
  if (typeof p.src === 'string') return p.src;
  const nested = p.src as Record<string, unknown> | null;
  if (nested && typeof nested === 'object' && typeof nested.src === 'string') {
    return nested.src;
  }
  return null;
}

/** Texto de un item: campo directo o meta del plugin ({meta:{alt}}). */
function itemText(p: Record<string, unknown>, key: string): string | undefined {
  const v = p[key];
  if (typeof v === 'string' && v) return v;
  const meta = p.meta as Record<string, unknown> | null;
  if (meta && typeof meta === 'object' && typeof meta[key] === 'string' && meta[key]) {
    return String(meta[key]);
  }
  return undefined;
}

/** Orden del item: sortOrder del plugin; legacy conserva el orden de llegada. */
function itemOrder(p: Record<string, unknown>, index: number): number {
  return typeof p.sortOrder === 'number' && Number.isFinite(p.sortOrder) ? p.sortOrder : index;
}

/** src de un valor imagen EmDash: MediaValue {meta:{storageKey}}, {src} o string directa. */
function mediaValueSrc(v: unknown): string | null {
  if (typeof v === 'string') return v || null;
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    const meta = o.meta as Record<string, unknown> | undefined;
    if (meta && typeof meta.storageKey === 'string' && meta.storageKey) {
      return `/_emdash/api/media/file/${meta.storageKey}`;
    }
    if (typeof o.src === 'string' && o.src) return o.src;
  }
  return null;
}

/** Galerías publicadas con fotos desde EmDash. Vacío si falla. */
export async function fetchPublishedGalleries(): Promise<{
  galleries: PublishedGallery[];
  cacheHint?: unknown;
}> {
  try {
    const { getEmDashCollection } = await import('emdash');
    const { entries, cacheHint } = await getEmDashCollection('match_photos', {
      status: 'published',
      limit: 100,
      orderBy: { published_at: 'desc' },
    });
    const galleries: PublishedGallery[] = [];
    for (const entry of entries ?? []) {
      const d = entry.data as Record<string, unknown>;
      const rawPhotos = Array.isArray(d.images)
        ? d.images
        : typeof d.images === 'string'
          ? safeParseJson(d.images)
          : [];
      const photoList: unknown[] = Array.isArray(rawPhotos) ? rawPhotos : [];
      const parsed = photoList
        .map((p, i) => ({ p, i }))
        .filter(
          (e): e is { p: Record<string, unknown>; i: number } =>
            !!e.p && typeof e.p === 'object' && typeof photoSrc(e.p) === 'string',
        )
        .map((e) => ({
          src: String(photoSrc(e.p)),
          alt: itemText(e.p, 'alt') || 'Foto del partido',
          caption: itemText(e.p, 'caption'),
          order: itemOrder(e.p, e.i),
          primary: e.p.isPrimary === true,
        }))
        .sort((a, b) => a.order - b.order);
      if (parsed.length === 0) continue;
      const photos: GalleryPhoto[] = parsed.map(({ src, alt, caption }) => ({ src, alt, caption }));
      // thumbnail: item principal del plugin (isPrimary) > portada legacy
      // (MediaValue, {src} u string) > primera foto.
      const primaryPhoto = parsed.find((p) => p.primary);
      const portadaRaw =
        typeof d.portada === 'string' && d.portada.trim().startsWith('{')
          ? safeParseJson(d.portada)
          : d.portada;
      const thumbSrc = primaryPhoto?.src || mediaValueSrc(portadaRaw) || photos[0].src;
      const thumbAlt =
        portadaRaw && typeof portadaRaw === 'object' && typeof (portadaRaw as Record<string, unknown>).alt === 'string'
          ? String((portadaRaw as Record<string, unknown>).alt)
          : undefined;
      const team1 = String(d.home_team || 'PCFC');
      const team2 = String(d.away_team || 'Rival');
      const label = 'Galería';
      const rawPub = (entry.publishedAt ?? d.publishedAt ?? d.published_at) as unknown;
      const publishedAtIso =
        rawPub instanceof Date
          ? rawPub.toISOString()
          : typeof rawPub === 'string' && rawPub
            ? new Date(rawPub).toISOString()
            : null;
      galleries.push({
        slug: typeof d.partido === 'string' && d.partido ? d.partido : entry.id,
        academyId: typeof d.academy_id === 'string' ? d.academy_id : undefined,
        categorySlug: categoryLabelToSlug(label),
        categoryLabel: label,
        team1,
        team2,
        date: formatDisplayDate(String(d.date || '')),
        publishedAtIso,
        thumbnail: thumbSrc,
        thumbnailAlt: thumbAlt || `${team1} vs ${team2}`,
        photos,
        showInHero: parseShowInHero(d.show_in_hero),
      });
    }
    return { galleries, cacheHint };
  } catch {
    return { galleries: [] };
  }
}

/** Foto simple para hero/mosaico (src URL EmDash o import local). */
export interface HeroGalleryImage {
  src: string;
  alt: string;
  /** Enlace a la galería del partido (p. ej. /fotos#slug). */
  href?: string;
}

/**
 * Fotos para el rotador del hero: partidos published con flag `show_in_hero`,
 * ordenados por publicación (recientes primero), máx `limit` fotos.
 */
export async function fetchHeroGalleryImages(limit = 6): Promise<HeroGalleryImage[]> {
  const { galleries } = await fetchPublishedGalleries();
  return galleries
    .filter((g) => g.showInHero)
    .flatMap((g) =>
      g.photos.map((p) => ({
        src: p.src,
        alt: p.alt || `${g.team1} vs ${g.team2}`,
        href: `/fotos#${g.slug}`,
      })),
    )
    .slice(0, limit);
}

/**
 * Portadas para Comunidad: thumbnail de los últimos `count` partidos
 * published (sin flag — siempre lo más reciente).
 */
export async function fetchLatestGalleryImages(count = 5): Promise<HeroGalleryImage[]> {
  const { galleries } = await fetchPublishedGalleries();
  return galleries.slice(0, count).map((g) => ({
    src: g.thumbnail,
    alt: g.thumbnailAlt,
  }));
}

/* ── Jugadores destacados (EmDash `players`, en vivo) ── */

/** Jugador publicado desde el admin (featured + order mandan el display). */
export interface PublishedPlayer {
  slug: string;
  name: string;
  position: string;
  number: number;
  photo: string | null;
  photoAlt: string;
  category: string | null;
  featured: boolean;
  order: number;
  matches: number;
  goals: number;
  assists: number;
  season: string | null;
}

function numField(v: unknown, fallback = 0): number {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : fallback;
}

function boolField(v: unknown): boolean {
  return v === true || v === 1 || v === '1';
}

/**
 * Jugadores published del admin, solo featured, ordenados por `order`.
 * Mismo patrón vivo que match_photos (getEmDashCollection). Vacío si falla
 * (el home cae al respaldo local + estático).
 */
export async function fetchPublishedPlayers(): Promise<PublishedPlayer[]> {
  try {
    const { getEmDashCollection } = await import('emdash');
    const { entries } = await getEmDashCollection('players', {
      status: 'published',
      limit: 100,
    });
    return (entries ?? [])
      .map((entry) => {
        const d = entry.data as Record<string, unknown>;
        const slug =
          typeof d.slug === 'string' && d.slug ? d.slug : String(entry.id);
        return {
          slug,
          name: String(d.name ?? ''),
          position: String(d.position ?? ''),
          number: numField(d.number),
          photo: mediaValueSrc(d.photo),
          photoAlt: String(d.photo_alt ?? d.photoAlt ?? ''),
          category: typeof d.category === 'string' ? d.category : null,
          featured: boolField(d.featured),
          order: numField(d.order, 99),
          matches: numField(d.matches),
          goals: numField(d.goals),
          assists: numField(d.assists),
          season: typeof d.season === 'string' ? d.season : null,
        } satisfies PublishedPlayer;
      })
      .filter((p) => p.name !== '' && p.featured)
      .sort((a, b) => a.order - b.order);
  } catch {
    return [];
  }
}
