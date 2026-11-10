/**
 * Server-side gallery maintenance, run on every content save.
 *
 * FAIL-OPEN BY DESIGN: this hook must never break a save. EmDash turns any
 * exception thrown from `content:beforeSave` into a generic
 * "A plugin hook failed while saving content" response that aborts the whole
 * save with no actionable detail for the editor. So instead of rejecting bad
 * gallery payloads, we sanitize them (drop unresolvable/duplicate items,
 * strip stale hints, enforce a single primary, reindex) and log a warning
 * describing what was cleaned. The save always proceeds.
 */
import type {
  CollectionSlug,
  ContentHookEvent,
  HookContext,
} from "emdash/plugin";
import {
  type GalleryFieldValue,
  type GalleryItem,
  DEFAULT_OPTIONS,
  reindex,
  resolveOptions,
} from "./schema.js";
import { looksLikeGallery, validateGallery } from "./validate.js";

/** Field-level options used when the collection does not configure any. */
const SERVER_OPTIONS = resolveOptions(DEFAULT_OPTIONS);

/**
 * Merge duplicates that only differ in crop metadata.
 *
 * Two entries can share a `mediaId` with different `blurhash`/`width` hints
 * (e.g. after a folder bulk-add); they render as the same photo, so keep the
 * first occurrence. Items are re-sorted by `sortOrder` when something changes.
 */
export function dedupeGalleryItems(items: GalleryItem[]): GalleryItem[] {
  const pick = new Map<string, GalleryItem>();
  for (const item of items) {
    const key = item.storageKey ?? item.mediaId;
    const prev = pick.get(key);
    if (!prev) {
      pick.set(key, item);
      continue;
    }
    const prevScore = scoreItem(prev);
    const nextScore = scoreItem(item);
    // Prefer the sharpest crop; a primary flag always wins over hints.
    if (nextScore > prevScore) pick.set(key, item);
  }
  const out = [...pick.values()].sort((a, b) => a.sortOrder - b.sortOrder);
  return out.length === items.length &&
    out.every((item, index) => item === items[index])
    ? items
    : reindex(out);
}

function scoreItem(item: GalleryItem): number {
  let score = 0;
  if (item.isPrimary) score += 100;
  if (typeof item.width === "number" && typeof item.height === "number") {
    score += Math.min(50, Math.floor((item.width * item.height) / 250_000));
  }
  if (item.blurhash) score += 1;
  return score;
}

/** Result of resolving gallery items against the media library. */
interface Resolution {
  /** Items that are safe to keep. */
  kept: GalleryItem[];
  /** True when at least one item was dropped or stripped. */
  changed: boolean;
}

/**
 * Keep only items whose media still exists and whose denormalized hints are
 * trustworthy. A photo deleted from the library (or uploaded but not ready
 * yet) can no longer render, so it is dropped with a warning. A stale
 * `storageKey` hint is stripped but the item itself is kept.
 */
async function resolveItems(
  ctx: HookContext,
  where: string,
  items: GalleryItem[],
): Promise<Resolution> {
  const media = ctx.media;
  if (!media || typeof media.get !== "function") {
    ctx.log?.warn?.(
      `pcfc-media-gallery: sin acceso a medios en ${where} — se omite la ` +
        `verificación de medios pero el guardado continúa`,
    );
    return { kept: items, changed: false };
  }
  const kept: GalleryItem[] = [];
  let changed = false;
  for (const item of items) {
    let row: unknown = null;
    try {
      row = await media.get(item.mediaId);
    } catch {
      row = null;
    }
    if (!row || typeof row !== "object") {
      ctx.log?.warn?.(
        `pcfc-media-gallery: medio desconocido en ${where}: ${item.mediaId} ` +
          `(elemento descartado, el guardado continúa)`,
      );
      changed = true;
      continue;
    }
    const storageKey =
      "storageKey" in row && typeof row.storageKey === "string"
        ? row.storageKey
        : undefined;
    if (item.storageKey && storageKey && item.storageKey !== storageKey) {
      ctx.log?.warn?.(
        `pcfc-media-gallery: storageKey no coincide en ${where}: ` +
          `${item.mediaId} (hint descartado, el guardado continúa)`,
      );
      const { storageKey: _dropped, ...rest } = item;
      kept.push(rest);
      changed = true;
      continue;
    }
    kept.push(item);
  }
  return { kept, changed };
}

/**
 * Enforce exactly one primary (first one wins, mirroring the admin widget).
 * Returns the same array reference when nothing changed.
 */
function ensureSinglePrimary(items: GalleryItem[]): { items: GalleryItem[]; changed: boolean } {
  if (items.length === 0) return { items, changed: false };
  const firstPrimary = items.findIndex((i) => i.isPrimary === true);
  if (firstPrimary === 0 && items.every((i, idx) => (i.isPrimary === true) === (idx === 0))) {
    return { items, changed: false };
  }
  const target = firstPrimary >= 0 ? firstPrimary : 0;
  const changed =
    firstPrimary === -1 || items.some((i, idx) => (i.isPrimary === true) !== (idx === target));
  if (!changed) return { items, changed: false };
  return {
    items: items.map((i, idx) => ({ ...i, isPrimary: idx === target })),
    changed: true,
  };
}

/**
 * Sanitize every gallery-shaped field in the payload. Invalid, duplicate or
 * unresolvable entries are dropped (with a warning); the save itself always
 * proceeds so editors are never blocked by stale photo references.
 */
export function createGalleryBeforeSave() {
  return async (event: ContentHookEvent<CollectionSlug>, ctx: HookContext) => {
    try {
      const content = event.content as Record<string, unknown>;
      for (const [fieldSlug, value] of Object.entries(content)) {
        if (!looksLikeGallery(value)) continue;
        const where = `${event.collection}.${fieldSlug}`;
        let changed = false;

        const { ok, errors, items } = validateGallery(value, SERVER_OPTIONS);
        if (!ok) {
          ctx.log?.warn?.(
            `pcfc-media-gallery: valor inválido en ${where}: ${errors.join("; ")} ` +
              `(elementos problemáticos descartados, el guardado continúa)`,
          );
          changed = true;
        }
        let kept: GalleryItem[] = items;

        // Enforce the item cap instead of rejecting the save.
        const max = SERVER_OPTIONS.maxItems;
        if (kept.length > max) {
          ctx.log?.warn?.(
            `pcfc-media-gallery: demasiados elementos en ${where}: ` +
              `${kept.length} (máximo ${max}, se conservan los primeros)`,
          );
          kept = kept.slice(0, max);
          changed = true;
        }

        const resolution = await resolveItems(ctx, where, kept);
        kept = resolution.kept;
        changed = changed || resolution.changed;

        const deduped = dedupeGalleryItems(kept);
        if (deduped !== kept) changed = true;

        const primary = ensureSinglePrimary(deduped);
        let finalItems = primary.items;
        changed = changed || primary.changed;

        finalItems = reindex(finalItems);
        if (
          finalItems.length !== (value as unknown[]).length ||
          finalItems.some((item, index) => {
            const orig = (value as GalleryItem[])[index];
            return (
              !orig ||
              orig.mediaId !== item.mediaId ||
              orig.sortOrder !== item.sortOrder ||
              (orig.isPrimary ?? false) !== item.isPrimary
            );
          })
        ) {
          changed = true;
        }

        if (changed) {
          content[fieldSlug] = finalItems as GalleryFieldValue;
          ctx.log?.info?.(
            `pcfc-media-gallery: galería saneada en ${where} ` +
              `(${(value as unknown[]).length} → ${finalItems.length} elementos)`,
          );
        }
      }
    } catch (err) {
      // Fail open: an unexpected error here must never abort the editor's save.
      try {
        ctx.log?.warn?.(
          `pcfc-media-gallery: saneamiento omitido por error inesperado: ` +
            `${err instanceof Error ? err.message : String(err)} ` +
            `(el guardado continúa con el valor original)`,
        );
      } catch {
        /* logging must never throw either */
      }
    }
  };
}
