/**
 * Pure validation for a gallery value.
 *
 * No I/O lives here: these functions only inspect the value and the options.
 * Resolving each `mediaId` to a real file needs the database, so that check
 * lives in the server hook (see `hook.ts`) which calls {@link collectMediaIds}.
 */

import {
  type GalleryItem,
  type GalleryOptions,
  HARD_MAX_ITEMS,
  isRecord,
  isSafeStorageKey,
  toRawArray,
} from "./schema.js";

export interface ValidationResult {
  /** True when the value is a well-formed gallery within bounds. */
  ok: boolean;
  /** Human-readable problems; empty when `ok`. */
  errors: string[];
  /** Parsed, well-formed items (best effort even when `ok` is false). */
  items: GalleryItem[];
}

/**
 * Check the shape and bounds of a gallery value.
 *
 * Validates: array of items; each `mediaId` a non-empty string; `sortOrder` a
 * non-negative integer; `isPrimary` a boolean; `meta` a string map; no
 * duplicate `mediaId`s; at most one primary; size within `minItems`..`maxItems`
 * and the absolute {@link HARD_MAX_ITEMS} cap.
 */
export function validateGallery(value: unknown, options: GalleryOptions): ValidationResult {
  const errors: string[] = [];
  const raw = toRawArray(value);
  const items: GalleryItem[] = [];
  const seen = new Set<string>();
  let primaryCount = 0;

  raw.forEach((entry, index) => {
    if (!isRecord(entry)) {
      errors.push(`elemento ${index}: se esperaba un objeto`);
      return;
    }
    const { mediaId, sortOrder, isPrimary, meta, storageKey, width, height } = entry;

    if (typeof mediaId !== "string" || mediaId.trim() === "") {
      errors.push(`elemento ${index}: "mediaId" debe ser un texto no vacío`);
      return;
    }
    if (seen.has(mediaId)) {
      errors.push(`elemento ${index}: mediaId duplicado "${mediaId}"`);
      return;
    }
    if (sortOrder !== undefined && !isNonNegativeInt(sortOrder)) {
      errors.push(`elemento ${index}: "sortOrder" debe ser un entero no negativo`);
      return;
    }
    if (isPrimary !== undefined && typeof isPrimary !== "boolean") {
      errors.push(`elemento ${index}: "isPrimary" debe ser verdadero o falso`);
      return;
    }
    if (meta !== undefined && !isStringMap(meta)) {
      errors.push(`elemento ${index}: "meta" debe ser un mapa de textos`);
      return;
    }

    if (storageKey !== undefined && !isSafeStorageKey(storageKey)) {
      errors.push(`elemento ${index}: "storageKey" debe ser una clave de medio relativa y segura`);
      return;
    }

    seen.add(mediaId);
    const primary = isPrimary === true;
    if (primary) primaryCount += 1;
    const item: GalleryItem = {
      mediaId,
      sortOrder: isNonNegativeInt(sortOrder) ? sortOrder : index,
      isPrimary: primary,
      meta: isStringMap(meta) ? meta : {},
    };
    // Preserve the optional denormalized render hints when present and valid.
    if (isSafeStorageKey(storageKey)) item.storageKey = storageKey;
    if (isNonNegativeInt(width)) item.width = width;
    if (isNonNegativeInt(height)) item.height = height;
    if (typeof entry.blurhash === "string" && entry.blurhash.length > 0) item.blurhash = entry.blurhash;
    if (typeof entry.dominantColor === "string" && entry.dominantColor.length > 0) item.dominantColor = entry.dominantColor;
    items.push(item);
  });

  if (primaryCount > 1) {
    errors.push(`solo un elemento puede ser principal (hay ${primaryCount})`);
  }
  if (items.length > HARD_MAX_ITEMS) {
    errors.push(`demasiados elementos: ${items.length} (límite absoluto ${HARD_MAX_ITEMS})`);
  }
  if (items.length > options.maxItems) {
    errors.push(`demasiados elementos: ${items.length} (máximo ${options.maxItems})`);
  }
  if (items.length < options.minItems) {
    errors.push(`muy pocos elementos: ${items.length} (mínimo ${options.minItems})`);
  }

  return { ok: errors.length === 0, errors, items };
}

/**
 * Decide whether an arbitrary field value looks like a gallery this plugin owns.
 *
 * The server hook fires for every field on every save, so it must only act on
 * values that are clearly ours. We require a non-empty array whose every entry
 * is an object carrying a string `mediaId` — a shape no built-in field produces.
 */
export function looksLikeGallery(value: unknown): boolean {
  const raw = toRawArray(value);
  if (raw.length === 0) return false;
  return raw.every((entry) => isRecord(entry) && typeof entry.mediaId === "string");
}

/** Unique, ordered list of mediaIds referenced by a value (for resolution checks). */
export function collectMediaIds(value: unknown): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const entry of toRawArray(value)) {
    if (isRecord(entry) && typeof entry.mediaId === "string" && !seen.has(entry.mediaId)) {
      seen.add(entry.mediaId);
      ids.push(entry.mediaId);
    }
  }
  return ids;
}

function isNonNegativeInt(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= 0;
}

function isStringMap(v: unknown): v is Record<string, string> {
  return isRecord(v) && Object.values(v).every((x) => typeof x === "string");
}
