/**
 * Content helpers — PCFC + EmDash CMS
 * ===================================
 * Usa getCollection() de Astro para leer desde archivos JSON en src/content/.
 * El cliente edita estos datos vía /_emdash/admin/ SIN tocar:
 *   - SVG iconos (value-pillars, pathway-cards → siguen en homeData.ts como design-fixed)
 *   - class names / layout tokens (navy/sky/white, transition-*)
 *
 * Backward-compat: homeData.ts re-exports estas funciones.
 */
import { getCollection } from "astro:content";
import type {
  NextMatch,
  Category,
  Stat,
  GalleryImage,
  SponsorItem,
  Pillar,
} from "../data/homeData";

// ── next-match (singleton) ──
export async function getNextMatch() {
  try {
    const entries = await getCollection("next_match");
    if (!entries || entries.length === 0) return null;
    return entries[0].data as unknown as NextMatch;
  } catch (err) {
    console.error("[getNextMatch] Error:", err);
    return null;
  }
}

// ── categories (4: pre, form-baja, form-alta, elite) ──
export async function getCategories() {
  try {
    const entries = await getCollection("categories");
    if (!entries) return [];
    return entries
      .sort(
        (a, b) =>
          ((a.data.order as number) ?? 99) - ((b.data.order as number) ?? 99),
      )
      .map((i) => i.data) as unknown as Category[];
  } catch (err) {
    console.error("[getCategories] Error:", err);
    return [];
  }
}

// ── stats (700+, 20+, etc.) ──
export async function getStats() {
  try {
    const entries = await getCollection("stats_pillars");
    if (!entries) return [];
    return entries
      .filter((i) => i.data.kind === "stat")
      .sort(
        (a, b) =>
          ((a.data.order as number) ?? 99) - ((b.data.order as number) ?? 99),
      )
      .map((i) => ({
        value: i.data.value as string,
        label: i.data.label as string,
      })) as unknown as Stat[];
  } catch (err) {
    console.error("[getStats] Error:", err);
    return [];
  }
}

// ── pillars (Metodología europea, etc.) ──
export async function getPillars() {
  try {
    const entries = await getCollection("stats_pillars");
    if (!entries) return [];
    return entries
      .filter((i) => i.data.kind === "pillar")
      .sort(
        (a, b) =>
          ((a.data.order as number) ?? 99) - ((b.data.order as number) ?? 99),
      )
      .map((i) => ({
        n: i.data.n as string,
        title: i.data.title as string,
        copy: i.data.copy as string,
      })) as unknown as Pillar[];
  } catch (err) {
    console.error("[getPillars] Error:", err);
    return [];
  }
}

// ── gallery images ──
export async function getGalleryImages() {
  try {
    const entries = await getCollection("gallery");
    if (!entries) return [];
    return entries
      .filter((i) => i.data.published !== false)
      .sort(
        (a, b) =>
          ((a.data.order as number) ?? 99) - ((b.data.order as number) ?? 99),
      )
      .map((i) => ({
        src: i.data.src as string,
        alt: i.data.alt as string,
      })) as unknown as GalleryImage[];
  } catch (err) {
    console.error("[getGalleryImages] Error:", err);
    return [];
  }
}

/**
 * Resolves media logo URL.
 * Handles multiple formats:
 *   - Direct URL string (http/https)
 *   - Relative local path
 */
export function resolveLogoUrl(logo: unknown): string {
  if (!logo) return "";

  if (typeof logo === "string") {
    if (logo.startsWith("http://") || logo.startsWith("https://")) {
      return logo;
    }
    if (logo.startsWith("/")) {
      return logo;
    }
    if (logo.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(logo);
        return resolveLogoUrl(parsed);
      } catch {
        return logo;
      }
    }
    return logo;
  }

  if (typeof logo === "object" && logo !== null) {
    const obj = logo as Record<string, any>;
    if (obj.url) return obj.url;
    if (obj.src) return obj.src;
    if (obj.id) return `/_emdash/api/media/${obj.id}`;
  }

  return String(logo);
}

// ── sponsors ──
import fs from "fs";
import path from "path";

export async function getSponsors() {
  try {
    const sponsorsDir = path.resolve("src/content/sponsors");
    const files = fs.readdirSync(sponsorsDir).filter(f => f.endsWith(".json"));
    
    const entries = files.map(f => {
      const raw = JSON.parse(fs.readFileSync(path.join(sponsorsDir, f), "utf-8"));
      return {
        name: raw.name || "",
        logo: resolveLogoUrl(raw.logo),
        href: raw.href || "",
        order: raw.order ?? 99,
        published: raw.published !== false,
      };
    }).filter(e => e.published);

    return entries
      .sort((a, b) => a.order - b.order)
      .map(({ order, ...rest }) => rest) as unknown as SponsorItem[];
  } catch (err) {
    console.error("[getSponsors] Error:", err);
    return [];
  }
}

// ── calendar ──
export async function getCalendar(kind: "upcoming" | "past") {
  try {
    const entries = await getCollection("calendar");
    if (!entries) return [];
    return entries
      .filter((i) => i.data.kind === kind)
      .sort(
        (a, b) =>
          ((a.data.order as number) ?? 99) - ((b.data.order as number) ?? 99),
      );
  } catch (err) {
    console.error("[getCalendar] Error:", err);
    return [];
  }
}

export type { NextMatch, Category, Stat, GalleryImage, SponsorItem, Pillar };
export const getSponsorsFromEmDash = getSponsors;
