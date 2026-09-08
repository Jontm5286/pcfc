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
import type { NextMatch, Category, Stat, GalleryImage, SponsorItem, Pillar } from '../data/homeData';

// ── next-match (singleton) ──
export async function getNextMatch() {
  const items = await getCollection('next-match');
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
  const items = await getCollection('stats-pillars');
  return items
    .filter((i) => i.data.kind === 'stat')
    .sort((a, b) => (a.data.order ?? 99) - (b.data.order ?? 99))
    .map((i) => ({ value: i.data.value!, label: i.data.label! })) as unknown as Stat[];
}

// ── pillars (Metodología europea, etc.) ──
export async function getPillars() {
  const items = await getCollection('stats-pillars');
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

// ── sponsors ──
export async function getSponsors() {
  const items = await getCollection('sponsors');
  return items
    .sort((a, b) => (a.data.order ?? 99) - (b.data.order ?? 99))
    .map((i) => i.data) as unknown as SponsorItem[];
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
