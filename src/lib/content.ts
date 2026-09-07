/**
 * Content helpers — PCFC + EmDash CMS
 * ===================================
 * Wrap getCollection() para consumir datos editables del cliente
 * desde src/content/ (collections definidos en src/content.config.ts).
 *
 * El cliente edita estos datos vía /_emdash/admin/ SIN tocar:
 *   - SVG iconos (value-pillars, pathway-cards → siguen en homeData.ts como design-fixed)
 *   - class names / layout tokens (navy/sky/white, transition-*)
 *
 * Backward-compat: homeData.ts re-exports estas funciones.
 * Ref: astro-cloudflare-deployment skill + WCAG/§6/§7 tokens.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { getEmDashCollection } from 'emdash';
import { getSponsorsData } from '../data/homeData';
import type { NextMatch, Category, Stat, GalleryImage, SponsorItem, Pillar } from '../data/homeData';

// ── next-match (singleton) ──
export async function getNextMatch() {
  const items = await getCollection('next_match');
  if (items.length === 0) return null;
  return items[0].data as unknown as NextMatch;
}

// ── categories (4: pre, form-baja, form-alta, elite) ──
export async function getCategories() {
  const items = await getCollection('categories');
  return items
    .sort((a, b) => (a.data.order ?? 99) - (b.data.order ?? 99))
    .map((i) => i.data) as unknown as Category[];
}

// ── stats (700+, 20+, etc.) ──
export async function getStats() {
  const items = await getCollection('stats_pillars');
  return items
    .filter((i) => i.data.kind === 'stat')
    .sort((a, b) => (a.data.order ?? 99) - (b.data.order ?? 99))
    .map((i) => ({ value: i.data.value!, label: i.data.label! })) as unknown as Stat[];
}

// ── pillars (Metodología europea, etc.) ──
export async function getPillars() {
  const items = await getCollection('stats_pillars');
  return items
    .filter((i) => i.data.kind === 'pillar')
    .sort((a, b) => (a.data.order ?? 99) - (b.data.order ?? 99))
    .map((i) => ({ n: i.data.n!, title: i.data.title!, copy: i.data.copy! })) as unknown as Pillar[];
}

// ── gallery images ──
export async function getGalleryImages() {
  const items = await getCollection('gallery');
  return items
    .sort((a, b) => (a.data.order ?? 99) - (b.data.order ?? 99))
    .map((i) => ({ src: i.data.src, alt: i.data.alt! })) as unknown as GalleryImage[];
}

/**
 * Resolves media logo URL from EmDash CMS.
 * Handles multiple formats:
 *   - Direct URL string (http/https)
 *   - EmDash media path (/ _emdash/api/media/...)
 *   - JSON string with storageKey/url/id
 *   - Relative local path
 * @param logo Image logo input from JSON or EmDash CMS database
 * @returns Resolved public URL string for <img src="..." />
 */
export function resolveLogoUrl(logo: unknown): string {
  if (!logo) return '';

  // Case 1: Already a valid URL string
  if (typeof logo === 'string') {
    if (logo.startsWith('http://') || logo.startsWith('https://')) {
      return logo;
    }
    // EmDash media path
    if (logo.startsWith('/_emdash/api/media/')) {
      return logo;
    }
    // JSON string from EmDash DB
    if (logo.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(logo);
        return resolveLogoUrl(parsed);
      } catch {
        return logo;
      }
    }
    // Relative path (local file like /Logo-PCFC.svg)
    return logo;
  }

  // Case 2: Object from EmDash DB (has meta.storageKey, url, or id)
  if (typeof logo === 'object' && logo !== null) {
    const obj = logo as Record<string, any>;
    const storageKey = obj.meta?.storageKey || obj.storageKey;
    if (storageKey) {
      return `/_emdash/api/media/file/${storageKey}`;
    }
    if (obj.url) {
      return obj.url;
    }
    if (obj.id) {
      return `/_emdash/api/media/${obj.id}`;
    }
  }

  return String(logo);
}

/**
 * Filters out stock/test sponsors (with Unsplash URLs).
 * Used to avoid showing test data when EmDash has real sponsors.
 */
function isStockSponsor(logo: string): boolean {
  if (!logo) return true;
  const stockDomains = [
    'images.unsplash.com',
    'picsum.photos',
    'via.placeholder.com',
    'placeholder.com',
    'placehold.it',
  ];
  return stockDomains.some(domain => logo.includes(domain));
}

// ── sponsors ──
// PCFC: Si EmDash tiene sponsors → SOLO esos (excluye stock JSON)
// Si EmDash está vacío → usa archivos JSON locales (incluyendo stock)
export async function getSponsors() {
  // 1. Try EmDash CMS (real-time from admin)
  try {
    const { entries } = await getEmDashCollection('sponsors');
    if (entries && entries.length > 0) {
      console.log(`[getSponsors] ✅ Loaded ${entries.length} sponsors from EmDash CMS`);
      return entries
        .sort((a, b) => ((a.data.order as number) ?? 99) - ((b.data.order as number) ?? 99))
        .map((e) => ({
          name: e.data.name as string,
          logo: resolveLogoUrl(e.data.logo),
          href: (e.data.href as string) ?? '',
        })) as unknown as SponsorItem[];
    }
    console.log('[getSponsors] ℹ️  EmDash empty, falling back to JSON files');
  } catch (err) {
    console.error('[getSponsors] ❌ Error fetching from EmDash:', err);
  }

  // 2. Fallback to Astro Content Collections (JSON files)
  try {
    const items = await getCollection('sponsors');
    if (items && items.length > 0) {
      console.log(`[getSponsors] ✅ Loaded ${items.length} sponsors from JSON files`);
      return items
        .sort((a, b) => (a.data.order ?? 99) - (b.data.order ?? 99))
        .map((i) => ({
          name: i.data.name,
          logo: resolveLogoUrl(i.data.logo),
          href: i.data.href,
        })) as unknown as SponsorItem[];
    }
  } catch (err) {
    console.error('[getSponsors] ❌ Error fetching from Astro collections:', err);
  }

  // 3. Fallback to static data (homeData.ts)
  console.log('[getSponsors] ⚠️  Using static fallback data');
  return getSponsorsData();
}

/**
 * Get sponsors from JSON files ONLY (excluding EmDash).
 * Useful for development or when you want to test with stock data.
 */
export async function getSponsorsFromJson() {
  try {
    const items = await getCollection('sponsors');
    return items
      .sort((a, b) => (a.data.order ?? 99) - (b.data.order ?? 99))
      .map((i) => ({
        name: i.data.name,
        logo: resolveLogoUrl(i.data.logo),
        href: i.data.href,
      })) as unknown as SponsorItem[];
  } catch (err) {
    console.error('[getSponsorsFromJson] Error:', err);
    return [];
  }
}

/**
 * Get sponsors from EmDash CMS ONLY (excluding JSON fallback).
 * Use this when you want to show only real sponsors managed via admin.
 */
export async function getSponsorsFromEmDash() {
  try {
    const { entries } = await getEmDashCollection('sponsors');
    if (!entries || entries.length === 0) return [];
    return entries
      .sort((a, b) => ((a.data.order as number) ?? 99) - ((b.data.order as number) ?? 99))
      .map((e) => ({
        name: e.data.name as string,
        logo: resolveLogoUrl(e.data.logo),
        href: (e.data.href as string) ?? '',
      })) as unknown as SponsorItem[];
  } catch (err) {
    console.error('[getSponsorsFromEmDash] Error:', err);
    return [];
  }
}

// ── calendar (nextMatch already handled via next-match) ──
export async function getCalendar(kind: 'upcoming' | 'past') {
  const all = await getCollection('calendar');
  return all
    .filter((i) => i.data.kind === kind)
    .sort((a, b) => (a.data.order ?? 99) - (b.data.order ?? 99));
}

/**
 * Re-export types para que homeData.ts pueda re-exportar sin duplicar.
 * Los tipos siguen vivos en data/homeData.ts (single source of truth).
 */
export type { NextMatch, Category, Stat, GalleryImage, SponsorItem, Pillar };
