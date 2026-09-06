import { defineCollection } from 'astro:content';
import { z } from 'zod';

/**
 * PCFC Content Collections — EmDash CMS
 * ======================================
 * Cada collection aquí es editable por el cliente en /_emdash/admin/.
 * Los schemas Zod VALIDAN que los valores editados no rompan el layout:
 *   - textos → strings con defaults (nunca empty para headings)
 *   - imágenes → url string (puede ser /images/stock/<name>.webp local o EmDash media URL)
 *   - CTAs → pares label/href (href validado contra rutas sitio)
 *   - enum → categorías/estados (no input libre, evita typos)
 *
 * EL DISEÑO permanece fijo — el cliente cambia text/imagen, no class names ni layout.
 * Ref: astro-cloudflare-deployment skill § Design System + WCAG contrast rules.
 */

// Schema compartido para imágenes (local stock .webp o EmDash media URL)
// Ejemplos válidos:
//   /images/stock/historia.webp
//   https://images.unsplash.com/photo-...
//   https://assets.emdash.com/media/...
const ImageSchema = z.string().url().or(z.string().startsWith('/'));

// Schema shared para CTA (label + href interno)
const CtaSchema = z.object({
  label: z.string().min(1, 'El label del CTA no puede estar vacío'),
  href: z.string().url().startsWith('/'),
});

// ─────────────────────────────────────────────────────────
// COLLECTION 1: hero-section
// Hero principal que aparece en index, categorias, calendario, blog.
// El cliente edita eyebrow, title, desc, backgroundImage.
// ─────────────────────────────────────────────────────────
const heroCollection = defineCollection({
  type: 'content',
  schema: z.object({
    // Identificador de página (home, categorias, calendario, blog)
    page: z.enum(['home', 'categorias', 'calendario', 'blog']),
    // Texto superpuesto (e.g. "Academia · Punta Cana", "Temporada 2026")
    eyebrow: z.string().default('PCFC'),
    // Headline (H1) — requerido, min 3 chars
    title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
    // Párrafo descriptivo
    description: z.string().default('Formando campeones en el Caribe.'),
    // Imagen fondo (local .webp o URL)
    backgroundImage: ImageSchema.default('/images/stock/jugadores-cancha.webp'),
    // Imagen alt (WCAG: siempre requerido)
    backgroundAlt: z
      .string()
      .default('Jugadores de Punta Cana FC entrenando en cancha'),
    // CTAs (opcionales)
    ctaPrimary: CtaSchema.optional(),
    ctaSecondary: CtaSchema.optional(),
    // Gallery images para hero rotator (3-6 fotos)
    galleryImages: z
      .array(
        z.object({
          src: ImageSchema,
          alt: z.string().min(3, 'Alt accesible requerido para WCAG'),
        }),
      )
      .default([]),
  }),
});

// ─────────────────────────────────────────────────────────
// COLLECTION 2: club-history + team-members
// Página /club — historia del club + equipo directivo (3 miembros).
// ─────────────────────────────────────────────────────────
const clubCollection = defineCollection({
  type: 'content',
  schema: z.object({
    // Tipo: 'history' = texto historia, 'teamMember' = miembro directivo
    type: z.enum(['history', 'teamMember']),
    // Para teamMember: nombre, rol, orden
    name: z.string().optional(),
    role: z.string().optional(),
    roleDescription: z.string().optional(),
    // Texto (historia) o imagen
    content: z.array(z.string()).default([]), // párrafos de historia
    image: ImageSchema.optional(),
    imageAlt: z.string().min(3, 'Alt accesible requerido').optional(),
    // Orden en grid (default 99)
    order: z.number().int().default(99),
  }),
});

// ─────────────────────────────────────────────────────────
// COLLECTION 3: categories
// Las 4 categorías formativas de /categorias + CTA por categoría.
// Client puede agregar/quitar categorías.
// ─────────────────────────────────────────────────────────
const categoriesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    slug: z.string(),
    // Badge colores: pre/form-baja/form-alta/elite (enum para consistency)
    badge: z.enum(['badge--pre', 'badge--form-baja', 'badge--form-alta', 'badge--elite']),
    ages: z.string(), // e.g. "4 a 8 años"
    name: z.string(),
    copy: z.string(),
    focus: z.string(),
    format: z.string(),
    schedule: z.string(),
    description: z.string().min(3, 'Descripción requerida'),
    ctaHref: z.string().default('/inscribete'),
  }),
});

// ─────────────────────────────────────────────────────────
// COLLECTION 4: calendar-matches
// Próximos + partidos jugados — /calendario + nextMatch hero en index.
// Client edita fixture fechas/hora.
// ─────────────────────────────────────────────────────────
const calendarCollection = defineCollection({
  type: 'data',
  schema: z.object({
    // 'upcoming' = próximos partidos, 'past' = jugados, 'nextMatch' = featured hero
    kind: z.enum(['upcoming', 'past', 'nextMatch']),
    date: z.string(), // e.g. "SÁB 13 SEP"
    time: z.string(), // "10:00 AM"
    category: z.string(),
    categorySlug: z.enum(['pre', 'form-baja', 'form-alta', 'elite']).optional(),
    home: z.string(),
    homeLogo: ImageSchema.optional(),
    away: z.string(),
    awayLogo: ImageSchema.optional(),
    venue: z.string(),
    // Para partidos pasados: foto galería (opcional)
    photosHref: z.string().optional(),
    // orden de display (0 = nextMatch hero)
    order: z.number().int().default(0),
  }),
});

// ─────────────────────────────────────────────────────────
// COLLECTION 5: sponsors
// 6 patrocinadores en footer/hero — editable nombre/logo/href.
// ─────────────────────────────────────────────────────────
const sponsorsCollection = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    logo: ImageSchema, // puede ser local /Logo-PCFC.svg o external
    href: z.string().url(),
    order: z.number().int().default(99),
  }),
});

// ─────────────────────────────────────────────────────────
// COLLECTION 6: gallery-images
// Fotos community gallery en index hero grid (3x2 rotator).
// ─────────────────────────────────────────────────────────
const galleryCollection = defineCollection({
  type: 'content',
  schema: z.object({
    src: ImageSchema,
    alt: z.string().min(3, 'Alt accesible requerido para WCAG'),
    order: z.number().int().default(99),
  }),
});

// ─────────────────────────────────────────────────────────
// COLLECTION 7: stats-pillars
// Stats hero (700+, 20+, etc.) + value pillars (3 cards).
// ─────────────────────────────────────────────────────────
const statsCollection = defineCollection({
  type: 'data', // simple k/v, no markdown rendering needed
  schema: z.object({
    // 'stat' = counter display, 'pillar' = value pillar card
    kind: z.enum(['stat', 'pillar']),
    // stat fields
    value: z.string().optional(), // "700+"
    label: z.string().optional(), // "Futbolistas"
    // pillar fields
    n: z.string().optional(), // "01"
    title: z.string().optional(), // "Metodología europea"
    copy: z.string().optional(),
    order: z.number().int().default(99),
  }),
});

// ─────────────────────────────────────────────────────────
// COLLECTION 8: next-match (singleton — featured hero fixture)
// Edita fecha/hora/equipos del próximo partido (hero index).
// ─────────────────────────────────────────────────────────
const nextMatchCollection = defineCollection({
  type: 'data',
  schema: z.object({
    date: z.string(), // "SÁB 13 SEP"
    time: z.string(), // "10:00 AM"
    category: z.string(),
    categorySlug: z.enum(['pre', 'form-baja', 'form-alta', 'elite']),
    home: z.string(),
    homeLogo: ImageSchema.optional(),
    away: z.string(),
    awayLogo: ImageSchema.optional(),
    venue: z.string(),
  }),
});

// ─────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────
export const collections = {
  hero: heroCollection,
  'club_history': clubCollection,
  categories: categoriesCollection,
  calendar: calendarCollection,
  sponsors: sponsorsCollection,
  gallery: galleryCollection,
  'stats_pillars': statsCollection,
  'next_match': nextMatchCollection,
};
