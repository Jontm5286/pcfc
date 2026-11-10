/**
 * fotos-posts — PCFC
 * Fuente única de posts de /fotos y /fotos/todas (+ validación de likes).
 * EmDash (`match_photos`, solo publicadas + con fotos) o respaldo local
 * hardcodeado cuando EmDash viene vacío.
 */
import type { Photo } from '../components/GalleryGrid.astro';
import { fetchPublishedGalleries, type PublishedGallery } from './academy-feed';

export interface MatchPost {
  id: string;
  categorySlug: 'pre' | 'form-baja' | 'form-alta' | 'elite';
  categoryLabel: string;
  team1: string;
  team2: string;
  /** Título display (= `name` del admin, fallback equipos). */
  title: string;
  date: string;
  photoCount: number;
  thumbnail: string;
  thumbnailAlt: string;
  photos: Photo[];
}

// ──────────────────────────────────────────────────────────────
// Respaldo local — pool de assets propios (cero red externa).
// WebP 1000px generados de src/assets (ver public/images/fotos-fallback).
// ──────────────────────────────────────────────────────────────
const FALLBACK_POOL: string[] = Array.from(
  { length: 12 },
  (_, i) => `/images/fotos-fallback/fb-${String(i + 1).padStart(2, '0')}.webp`
);

// ──────────────────────────────────────────────────────────────
// Datos hardcodeados — 8 posts mínimos
// ──────────────────────────────────────────────────────────────
export const FALLBACK_POSTS: MatchPost[] = [
  {
    id: 'pcfc-vs-atlantico-6sep',
    categorySlug: 'elite',
    categoryLabel: 'Elite / Reserva',
    team1: 'PCFC',
    team2: 'Atlántico FC',
    title: 'PCFC vs Atlántico FC',
    date: '6 sep 2026',
    photoCount: 24,
    thumbnail: FALLBACK_POOL[0],
    thumbnailAlt: 'PCFC vs Atlántico FC — Partido Elite en Cancha Principal',
    photos: Array.from({ length: 24 }, (_, i) => ({
      src: FALLBACK_POOL[i % FALLBACK_POOL.length],
      alt: `PCFC vs Atlántico FC — Foto ${i + 1}`,
      caption: i === 0 ? 'El once inicial' : i === 11 ? 'Gol de cabeza' : undefined,
      downloadName: `pcfc-atlantico-6sep-${String(i + 1).padStart(2, '0')}.jpg`,
    })),
  },
  {
    id: 'pcfc-sub15-vs-santiago-30ago',
    categorySlug: 'form-alta',
    categoryLabel: 'Formativas Altas',
    team1: 'PCFC Sub-15',
    team2: 'Santiago FC',
    title: 'PCFC Sub-15 vs Santiago FC',
    date: '30 ago 2026',
    photoCount: 18,
    thumbnail: FALLBACK_POOL[3],
    thumbnailAlt: 'PCFC Sub-15 vs Santiago FC — Partido Formativas Altas',
    photos: Array.from({ length: 18 }, (_, i) => ({
      src: FALLBACK_POOL[i % FALLBACK_POOL.length],
      alt: `PCFC Sub-15 vs Santiago FC — Foto ${i + 1}`,
      caption: i === 0 ? 'Alineación del equipo' : undefined,
      downloadName: `pcfc-sub15-santiago-30ago-${String(i + 1).padStart(2, '0')}.jpg`,
    })),
  },
  {
    id: 'pcfc-sub10-vs-canay-24ago',
    categorySlug: 'form-baja',
    categoryLabel: 'Formativas Bajas',
    team1: 'PCFC Sub-10',
    team2: 'Canay FC',
    title: 'PCFC Sub-10 vs Canay FC',
    date: '24 ago 2026',
    photoCount: 15,
    thumbnail: FALLBACK_POOL[6],
    thumbnailAlt: 'PCFC Sub-10 vs Canay FC — Partido Formativas Bajas',
    photos: Array.from({ length: 15 }, (_, i) => ({
      src: FALLBACK_POOL[i % FALLBACK_POOL.length],
      alt: `PCFC Sub-10 vs Canay FC — Foto ${i + 1}`,
      downloadName: `pcfc-sub10-canay-24ago-${String(i + 1).padStart(2, '0')}.jpg`,
    })),
  },
  {
    id: 'pcfc-sub8-vs-escuela-bavaro-21ago',
    categorySlug: 'pre',
    categoryLabel: 'Pre-Formativas',
    team1: 'PCFC Sub-8',
    team2: 'Escuela Bávaro',
    title: 'PCFC Sub-8 vs Escuela Bávaro',
    date: '21 ago 2026',
    photoCount: 12,
    thumbnail: FALLBACK_POOL[9],
    thumbnailAlt: 'PCFC Sub-8 vs Escuela Bávaro — Partido Pre-Formativas',
    photos: Array.from({ length: 12 }, (_, i) => ({
      src: FALLBACK_POOL[i % FALLBACK_POOL.length],
      alt: `PCFC Sub-8 vs Escuela Bávaro — Foto ${i + 1}`,
      caption: i === 0 ? '¡El equipo al completo!' : undefined,
      downloadName: `pcfc-sub8-bavaro-21ago-${String(i + 1).padStart(2, '0')}.jpg`,
    })),
  },
  {
    id: 'pcfc-reserva-vs-higuey-28sep',
    categorySlug: 'elite',
    categoryLabel: 'Elite / Reserva',
    team1: 'PCFC Reserva',
    team2: 'Higüey United',
    title: 'PCFC Reserva vs Higüey United',
    date: '28 sep 2026',
    photoCount: 22,
    thumbnail: FALLBACK_POOL[0],
    thumbnailAlt: 'PCFC Reserva vs Higüey United — Partido Elite',
    photos: Array.from({ length: 22 }, (_, i) => ({
      src: FALLBACK_POOL[i % FALLBACK_POOL.length],
      alt: `PCFC Reserva vs Higüey United — Foto ${i + 1}`,
      downloadName: `pcfc-reserva-higuey-28sep-${String(i + 1).padStart(2, '0')}.jpg`,
    })),
  },
  {
    id: 'pcfc-sub14-vs-seleccion-16ago',
    categorySlug: 'form-alta',
    categoryLabel: 'Formativas Altas',
    team1: 'PCFC Sub-14',
    team2: 'Selección Federativa',
    title: 'PCFC Sub-14 vs Selección Federativa',
    date: '16 ago 2026',
    photoCount: 16,
    thumbnail: FALLBACK_POOL[3],
    thumbnailAlt: 'PCFC Sub-14 vs Selección Federativa — Partido Formativas Altas',
    photos: Array.from({ length: 16 }, (_, i) => ({
      src: FALLBACK_POOL[i % FALLBACK_POOL.length],
      alt: `PCFC Sub-14 vs Selección Federativa — Foto ${i + 1}`,
      downloadName: `pcfc-sub14-fed-16ago-${String(i + 1).padStart(2, '0')}.jpg`,
    })),
  },
  {
    id: 'pcfc-sub6-vs-casa-espana-9ago',
    categorySlug: 'pre',
    categoryLabel: 'Pre-Formativas',
    team1: 'PCFC Sub-6',
    team2: 'Casa España',
    title: 'PCFC Sub-6 vs Casa España',
    date: '9 ago 2026',
    photoCount: 10,
    thumbnail: FALLBACK_POOL[6],
    thumbnailAlt: 'PCFC Sub-6 vs Casa España — Partido Pre-Formativas',
    photos: Array.from({ length: 10 }, (_, i) => ({
      src: FALLBACK_POOL[i % FALLBACK_POOL.length],
      alt: `PCFC Sub-6 vs Casa España — Foto ${i + 1}`,
      caption: i === 0 ? 'Nuestros pequeños cracks' : undefined,
      downloadName: `pcfc-sub6-casa-espana-9ago-${String(i + 1).padStart(2, '0')}.jpg`,
    })),
  },
  {
    id: 'pcfc-sub13-vs-casa-espana-2sep',
    categorySlug: 'form-alta',
    categoryLabel: 'Formativas Altas',
    team1: 'PCFC Sub-13',
    team2: 'Casa España',
    title: 'PCFC Sub-13 vs Casa España',
    date: '2 sep 2026',
    photoCount: 14,
    thumbnail: FALLBACK_POOL[9],
    thumbnailAlt: 'PCFC Sub-13 vs Casa España — Partido Formativas Altas',
    photos: Array.from({ length: 14 }, (_, i) => ({
      src: FALLBACK_POOL[i % FALLBACK_POOL.length],
      alt: `PCFC Sub-13 vs Casa España — Foto ${i + 1}`,
      downloadName: `pcfc-sub13-casa-espana-2sep-${String(i + 1).padStart(2, '0')}.jpg`,
    })),
  },
];

/** Mapeo único galería EmDash → MatchPost (lo usan getAllPosts y getPostsPage). */
function mapGalleryToPost(g: PublishedGallery): MatchPost {
  return {
    id: g.slug,
    categorySlug: g.categorySlug,
    categoryLabel: g.categoryLabel,
    team1: g.team1,
    team2: g.team2,
    title: g.title,
    date: g.date,
    photoCount: g.photos.length,
    thumbnail: g.thumbnail,
    thumbnailAlt: g.thumbnailAlt,
    photos: g.photos.map((ph, i) => ({
      src: ph.src,
      alt: ph.alt,
      caption: ph.caption,
      downloadName: `${g.slug}-${String(i + 1).padStart(2, '0')}.jpg`,
    })),
  };
}

/**
 * Todos los posts: EmDash (recientes primero, orderBy published_at desc)
 * o respaldo local si EmDash viene vacío.
 */
export async function getAllPosts(): Promise<{
  posts: MatchPost[];
  cacheHint?: unknown;
}> {
  const { galleries: emdashGalleries, cacheHint } = await fetchPublishedGalleries();
  if (emdashGalleries.length === 0) return { posts: FALLBACK_POSTS };
  return { posts: emdashGalleries.map(mapGalleryToPost), cacheHint };
}

// ──────────────────────────────────────────────────────────────
// Paginación servidor (GET /api/fotos + páginas híbridas).
// La página de items se lee con LIMIT/OFFSET en D1; el total se
// cachea 5 min en memoria para no pagar un full-scan por request.
// ──────────────────────────────────────────────────────────────
const TOTAL_TTL_MS = 5 * 60 * 1000;
let totalCache: { at: number; total: number } | null = null;

async function getGalleriesTotal(): Promise<number> {
  if (totalCache && Date.now() - totalCache.at < TOTAL_TTL_MS) return totalCache.total;
  const { galleries } = await fetchPublishedGalleries();
  const total = galleries.length === 0 ? FALLBACK_POSTS.length : galleries.length;
  totalCache = { at: Date.now(), total };
  return total;
}

export interface PostsPage {
  posts: MatchPost[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

/**
 * Una página de posts. `page` se sujeta a >= 1; páginas más allá
 * del total devuelven `posts: []` (no rompen).
 */
export async function getPostsPage(page: number, perPage: number): Promise<PostsPage> {
  const safePage = Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
  const safePerPage =
    Number.isFinite(perPage) && perPage >= 1 ? Math.min(Math.floor(perPage), 50) : 10;
  const offset = (safePage - 1) * safePerPage;
  const [total, { galleries }] = await Promise.all([
    getGalleriesTotal(),
    fetchPublishedGalleries({ limit: safePerPage, offset }),
  ]);
  const posts =
    galleries.length === 0
      ? FALLBACK_POSTS.slice(offset, offset + safePerPage)
      : galleries.map(mapGalleryToPost);
  return {
    posts,
    page: safePage,
    perPage: safePerPage,
    total,
    totalPages: Math.max(1, Math.ceil(total / safePerPage)),
  };
}

/** Set de claves válidas "<slug>:<indice>" para validar votos. */
export function buildValidKeys(posts: MatchPost[]): Set<string> {
  const keys = new Set<string>();
  for (const p of posts) for (let i = 0; i < p.photos.length; i += 1) keys.add(`${p.id}:${i}`);
  return keys;
}
