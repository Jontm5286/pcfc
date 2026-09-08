import { defineCollection } from "astro:content";
import { z } from "zod";

/**
 * PCFC Content Collections — EmDash CMS v0.36
 * =============================================
 * Este archivo define las **Content Collections** de Astro (filesystem-based).
 *
 * Las collections dinámicas (sponsors, categories, etc.) se consultan en tiempo real
 * desde la DB EmDash via `getEmDashCollection('slug')` en `src/lib/content.ts`.
 * Internamente EmDash usa una **Live Collection** llamada `_emdash` definida en
 * `src/live.config.ts` (REQUERIDO por Astro 7 — las Live Collections NO pueden
 * estar en `content.config.ts`).
 *
 * Flujo de datos:
 *   1. `getEmDashCollection('sponsors')` → Live Collection `_emdash` (SQLite)
 *   2. Fallback → `getCollection('sponsors')` → archivos JSON en src/content/
 *   3. Fallback final → datos estáticos en src/data/homeData.ts
 *
 * Collections estáticas (hero, club_history, blog) usan type:"content"/"data"
 * con archivos en src/content/.
 *
 * Ref: EmDash v0.36 + Astro 7.3.1.
 */

// Schema compartido para imágenes
const ImageSchema = z.string().url().or(z.string().startsWith("/"));

// Schema compartido para CTAs
const CtaSchema = z.object({
  label: z.string().min(1, "El label del CTA no puede estar vacío"),
  href: z.string().startsWith("/"),
});

// ─────────────────────────────────────────────────────────
// COLLECTION 1: hero (static — type:"data")
// Hero principal — archivos JSON en src/content/hero/
// ─────────────────────────────────────────────────────────
const heroCollection = defineCollection({
  type: "data",
  schema: z.object({
    page: z.enum(["home", "categorias", "calendario", "blog"]),
    eyebrow: z.string().default("PCFC"),
    title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
    description: z.string().default("Formando campeones en el Caribe."),
    backgroundImage: ImageSchema.default("/images/stock/jugadores-cancha.webp"),
    backgroundAlt: z
      .string()
      .default("Jugadores de Punta Cana FC entrenando en cancha"),
    ctaPrimary: CtaSchema.optional(),
    ctaSecondary: CtaSchema.optional(),
    galleryImages: z
      .array(z.object({ src: ImageSchema, alt: z.string().min(3) }))
      .default([]),
  }),
});

// ─────────────────────────────────────────────────────────
// COLLECTION 2: club_history (static — type:"content")
// Historia del club + equipo directivo — archivos .md en src/content/club_history/
// ─────────────────────────────────────────────────────────
const clubCollection = defineCollection({
  type: "content",
  schema: z.object({
    type: z.enum(["history", "teamMember"]),
    name: z.string().optional(),
    role: z.string().optional(),
    roleDescription: z.string().optional(),
    content: z.array(z.string()).default([]),
    image: ImageSchema.optional(),
    imageAlt: z.string().min(3).optional(),
    order: z.number().int().default(99),
    published: z.boolean().default(true),
  }),
});

// ─────────────────────────────────────────────────────────
// COLLECTION 3: blog (static — type:"content")
// Posts del blog — archivos .md en src/content/blog/
// ─────────────────────────────────────────────────────────
const blogCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    pubDate: z.coerce.date().optional(),
    author: z.string().default("PCFC"),
    image: ImageSchema.optional(),
    imageAlt: z.string().min(3).optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

// ─────────────────────────────────────────────────────────
// COLLECTIONS 4-9: Dinámicas (leídas via getEmDashCollection)
// Definidas como type:"data" con archivos JSON de respaldo en src/content/.
// Los datos principales vienen de la DB EmDash (Live Collection _emdash).
// ─────────────────────────────────────────────────────────

// COLLECTION 4: categories
const categoriesCollection = defineCollection({
  type: "data",
  schema: z.object({
    slug: z.string(),
    badge: z.enum([
      "badge--pre",
      "badge--form-baja",
      "badge--form-alta",
      "badge--elite",
    ]),
    ages: z.string(),
    name: z.string(),
    copy: z.string(),
    focus: z.string().optional(),
    format: z.string().optional(),
    schedule: z.string().optional(),
    description: z.string().min(3),
    ctaHref: z.string().default("/inscribete"),
    order: z.number().int().default(99),
    published: z.boolean().default(true),
  }),
});

// COLLECTION 5: calendar (matches)
const calendarCollection = defineCollection({
  type: "data",
  schema: z.object({
    kind: z.enum(["upcoming", "past", "nextMatch"]),
    date: z.string(),
    time: z.string(),
    category: z.string(),
    categorySlug: z.enum(["pre", "form-baja", "form-alta", "elite"]).optional(),
    home: z.string(),
    homeLogo: ImageSchema.optional(),
    away: z.string(),
    awayLogo: ImageSchema.optional(),
    venue: z.string().optional(),
    photosHref: z.string().optional(),
    order: z.number().int().default(0),
    equipoId: z.string().optional().or(z.literal("")),
  }),
});

// COLLECTION 6: sponsors
const sponsorsCollection = defineCollection({
  type: "data",
  schema: z.object({
    name: z.string(),
    logo: ImageSchema,
    href: z.string().optional().or(z.literal("")),
    order: z.number().int().default(99),
    published: z.boolean().default(true),
  }),
});


// COLLECTION 9: match-photos
// Fotos por partido — cada entry es un partido con su galería de fotos.
const matchPhotosCollection = defineCollection({
  type: "content",
  schema: z.object({
    categorySlug: z.string().default("elite"),
    categoryLabel: z.string().default("Elite / Reserva"),
    team1: z.string(),
    team2: z.string(),
    date: z.string(),
    thumbnail: ImageSchema,
    thumbnailAlt: z.string().min(3),
    published: z.boolean().default(true),
  }),
});

// COLLECTION 7: gallery
const galleryCollection = defineCollection({
  type: "content",
  schema: z.object({
    src: ImageSchema,
    alt: z.string().min(3),
    order: z.number().int().default(99),
    published: z.boolean().default(true),
    partidoId: z.string().optional().or(z.literal("")),
  }),
});

// COLLECTION 8: stats_pillars
const statsCollection = defineCollection({
  type: "data",
  schema: z.object({
    kind: z.enum(["stat", "pillar"]),
    value: z.string().optional(),
    label: z.string().optional(),
    n: z.string().optional(),
    title: z.string().optional(),
    copy: z.string().optional(),
    order: z.number().int().default(99),
    published: z.boolean().default(true),
  }),
});

// COLLECTION 9: next_match (singleton)
const nextMatchCollection = defineCollection({
  type: "data",
  schema: z.object({
    date: z.string(),
    time: z.string(),
    category: z.string(),
    categorySlug: z.enum(["pre", "form-baja", "form-alta", "elite"]),
    home: z.string(),
    homeLogo: ImageSchema.optional(),
    away: z.string(),
    awayLogo: ImageSchema.optional(),
    venue: z.string(),
    homeId: z.string().optional().or(z.literal("")),
    awayId: z.string().optional().or(z.literal("")),
  }),
});

export const collections = {
  hero: heroCollection,
  club_history: clubCollection,
  blog: blogCollection,
  categories: categoriesCollection,
  calendar: calendarCollection,
  sponsors: sponsorsCollection,
  gallery: galleryCollection,
  "match_photos": matchPhotosCollection,
  stats_pillars: statsCollection,
  next_match: nextMatchCollection,
};
