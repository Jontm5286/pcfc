import { describe, expect, it } from "vitest";
import { type GalleryItem, DEFAULT_OPTIONS, resolveOptions, toRawArray, reindex, isSafeStorageKey, mediaProxyUrl, samePhoto } from "../src/schema.js";
import { collectMediaIds, looksLikeGallery, validateGallery } from "../src/validate.js";
import { hydrateMediaGallery, primaryImage, type MediaRow } from "../src/runtime.js";
import { dedupeGalleryItems } from "../src/hook.js";
import { collectFolderImagePicks } from "../src/bulk.js";

const opts = DEFAULT_OPTIONS;

describe("schema", () => {
  it("parses arrays, JSON strings, and empties", () => {
    expect(toRawArray(null)).toEqual([]);
    expect(toRawArray("")).toEqual([]);
    expect(toRawArray("[{}]")).toEqual([{}]);
    expect(toRawArray([1, 2])).toEqual([1, 2]);
    expect(toRawArray("not json")).toEqual([]);
  });

  it("merges options over defaults and clamps", () => {
    expect(resolveOptions({ maxItems: 5 }).maxItems).toBe(5);
    expect(resolveOptions({ maxItems: 99999 }).maxItems).toBe(200); // hard cap
    expect(resolveOptions("bogus")).toEqual(DEFAULT_OPTIONS);
  });

  it("reindexes by sortOrder", () => {
    const out = reindex([
      { mediaId: "b", sortOrder: 5, isPrimary: false, meta: {} },
      { mediaId: "a", sortOrder: 1, isPrimary: true, meta: {} },
    ]);
    expect(out.map((i) => i.mediaId)).toEqual(["a", "b"]);
    expect(out.map((i) => i.sortOrder)).toEqual([0, 1]);
  });
});

describe("validateGallery", () => {
  it("accepts a well-formed gallery", () => {
    const value = [
      { mediaId: "m1", sortOrder: 0, isPrimary: true, meta: { alt_en: "front" } },
      { mediaId: "m2", sortOrder: 1, isPrimary: false, meta: {} },
    ];
    const res = validateGallery(value, opts);
    expect(res.ok).toBe(true);
    expect(res.items).toHaveLength(2);
  });

  it("rejects duplicates, multiple primaries, and bad fields", () => {
    expect(validateGallery([{ mediaId: "x" }, { mediaId: "x" }], opts).ok).toBe(false);
    expect(
      validateGallery(
        [{ mediaId: "a", isPrimary: true }, { mediaId: "b", isPrimary: true }],
        opts,
      ).ok,
    ).toBe(false);
    expect(validateGallery([{ mediaId: "" }], opts).ok).toBe(false);
    expect(validateGallery([{ mediaId: "a", sortOrder: -1 }], opts).ok).toBe(false);
  });

  it("enforces min/max", () => {
    expect(validateGallery([{ mediaId: "a" }], { ...opts, maxItems: 0 }).ok).toBe(false);
    expect(validateGallery([], { ...opts, minItems: 1 }).ok).toBe(false);
  });
});

describe("looksLikeGallery / collectMediaIds", () => {
  it("detects our shape only", () => {
    expect(looksLikeGallery([{ mediaId: "a" }])).toBe(true);
    expect(looksLikeGallery([])).toBe(false);
    expect(looksLikeGallery([{ foo: 1 }])).toBe(false);
    expect(looksLikeGallery("hello")).toBe(false);
  });

  it("collects unique ids in order", () => {
    expect(collectMediaIds([{ mediaId: "a" }, { mediaId: "b" }, { mediaId: "a" }])).toEqual([
      "a",
      "b",
    ]);
  });
});

describe("hydrateMediaGallery", () => {
  const rows = new Map<string, MediaRow>([
    ["m1", { id: "m1", storage_key: "products/1.jpg", mime_type: "image/jpeg", width: 800, height: 600, alt: "row alt" }],
    ["m2", { id: "m2", storage_key: "products/2.jpg", status: "trashed" }],
    ["m3", { id: "m3", storage_key: null }],
  ]);
  const lookup = async (ids: string[]) =>
    new Map(ids.filter((id) => rows.has(id)).map((id) => [id, rows.get(id)!]));

  it("hydrates, orders, and drops missing/trashed/keyless media", async () => {
    const value = [
      { mediaId: "m2", sortOrder: 0, isPrimary: false, meta: {} }, // trashed → dropped
      { mediaId: "m1", sortOrder: 1, isPrimary: true, meta: { alt: "item alt" } },
      { mediaId: "m3", sortOrder: 2, isPrimary: false, meta: {} }, // no storage key → dropped
      { mediaId: "gone", sortOrder: 3, isPrimary: false, meta: {} }, // missing → dropped
    ];
    const out = await hydrateMediaGallery(value, lookup);
    expect(out.map((i) => i.mediaId)).toEqual(["m1"]);
    expect(out[0]!.url).toBe("/_emdash/api/media/file/products/1.jpg");
    expect(out[0]!.alt).toBe("item alt"); // item meta wins over row alt
    expect(primaryImage(out)?.mediaId).toBe("m1");
  });

  it("returns [] for empty values", async () => {
    expect(await hydrateMediaGallery(null, lookup)).toEqual([]);
    expect(await hydrateMediaGallery("[]", lookup)).toEqual([]);
  });
});

describe("per-item meta (alt text)", () => {
  it("preserves meta fields through validation and reindex", () => {
    const value = [
      { mediaId: "m1", sortOrder: 0, isPrimary: true, meta: { alt_en: "Front view", alt_bg: "Отпред" } },
      { mediaId: "m2", sortOrder: 1, isPrimary: false, meta: { alt_en: "Side view" } },
    ];
    const res = validateGallery(value, opts);
    expect(res.ok).toBe(true);
    expect(res.items[0]!.meta).toEqual({ alt_en: "Front view", alt_bg: "Отпред" });
    expect(res.items[1]!.meta).toEqual({ alt_en: "Side view" });
  });

  it("hydrate picks item meta alt over row alt", async () => {
    const rows = new Map<string, MediaRow>([
      ["m1", { id: "m1", storage_key: "products/1.jpg", alt: "row alt" }],
    ]);
    const lookup = async (ids: string[]) =>
      new Map(ids.filter((id) => rows.has(id)).map((id) => [id, rows.get(id)!]));
    const out = await hydrateMediaGallery(
      [{ mediaId: "m1", sortOrder: 0, isPrimary: true, meta: { alt: "item alt" } }],
      lookup,
    );
    expect(out[0]!.alt).toBe("item alt");
  });

  it("hydrate falls back to row alt when meta alt is empty", async () => {
    const rows = new Map<string, MediaRow>([
      ["m1", { id: "m1", storage_key: "products/1.jpg", alt: "fallback" }],
    ]);
    const lookup = async (ids: string[]) =>
      new Map(ids.filter((id) => rows.has(id)).map((id) => [id, rows.get(id)!]));
    const out = await hydrateMediaGallery(
      [{ mediaId: "m1", sortOrder: 0, isPrimary: false, meta: {} }],
      lookup,
    );
    expect(out[0]!.alt).toBe("fallback");
  });

  it("hydrate respects custom altKey option", async () => {
    const rows = new Map<string, MediaRow>([
      ["m1", { id: "m1", storage_key: "products/1.jpg" }],
    ]);
    const lookup = async (ids: string[]) =>
      new Map(ids.filter((id) => rows.has(id)).map((id) => [id, rows.get(id)!]));
    const out = await hydrateMediaGallery(
      [{ mediaId: "m1", sortOrder: 0, isPrimary: false, meta: { alt_en: "english", alt_bg: "bulgarian" } }],
      lookup,
      { altKey: "alt_en" },
    );
    expect(out[0]!.alt).toBe("english");
  });
});

describe("drag-to-reorder (widget commit pattern)", () => {
  // The widget assigns sortOrder from array position after splice,
  // rather than using reindex (which re-sorts by old sortOrder).
  function commitOrder(items: GalleryItem[]): GalleryItem[] {
    return items.map((it, i) => ({ ...it, sortOrder: i }));
  }

  it("handles a move-to-front reorder", () => {
    const items = [
      { mediaId: "a", sortOrder: 0, isPrimary: true, meta: {} },
      { mediaId: "b", sortOrder: 1, isPrimary: false, meta: {} },
      { mediaId: "c", sortOrder: 2, isPrimary: false, meta: {} },
    ];
    const next = [...items];
    const [moved] = next.splice(2, 1);
    next.splice(0, 0, moved!);
    const result = commitOrder(next);
    expect(result.map((i) => i.mediaId)).toEqual(["c", "a", "b"]);
    expect(result.map((i) => i.sortOrder)).toEqual([0, 1, 2]);
  });

  it("handles a move-to-end reorder", () => {
    const items = [
      { mediaId: "a", sortOrder: 0, isPrimary: true, meta: {} },
      { mediaId: "b", sortOrder: 1, isPrimary: false, meta: {} },
      { mediaId: "c", sortOrder: 2, isPrimary: false, meta: {} },
    ];
    const next = [...items];
    const [moved] = next.splice(0, 1);
    next.splice(2, 0, moved!);
    const result = commitOrder(next);
    expect(result.map((i) => i.mediaId)).toEqual(["b", "c", "a"]);
    expect(result.map((i) => i.sortOrder)).toEqual([0, 1, 2]);
  });

  it("reindex restores canonical order from stored sortOrder values", () => {
    // reindex is for the read path: it sorts by sortOrder to reconstruct order from DB
    const stored = [
      { mediaId: "b", sortOrder: 1, isPrimary: false, meta: {} },
      { mediaId: "a", sortOrder: 0, isPrimary: true, meta: {} },
    ];
    const result = reindex(stored);
    expect(result.map((i) => i.mediaId)).toEqual(["a", "b"]);
  });
});

describe("storage key safety", () => {
  it("accepts legitimate relative keys", () => {
    expect(isSafeStorageKey("products/zito-zs05/0.jpeg")).toBe(true);
    expect(isSafeStorageKey("projects/e36-v10/12.webp")).toBe(true);
  });

  it("rejects traversal, absolute, scheme, and control-char keys", () => {
    expect(isSafeStorageKey("../secret/key")).toBe(false);
    expect(isSafeStorageKey("a/../../b")).toBe(false);
    expect(isSafeStorageKey("/etc/passwd")).toBe(false);
    expect(isSafeStorageKey("http://evil.example/x")).toBe(false);
    expect(isSafeStorageKey("javascript:alert(1)")).toBe(false);
    expect(isSafeStorageKey("a\nb")).toBe(false);
    expect(isSafeStorageKey("")).toBe(false);
    expect(isSafeStorageKey(123)).toBe(false);
  });

  it("mediaProxyUrl encodes safe keys and refuses unsafe ones", () => {
    expect(mediaProxyUrl("products/a b/0.jpeg")).toBe("/_emdash/api/media/file/products/a%20b/0.jpeg");
    expect(mediaProxyUrl("../x")).toBeNull();
    expect(mediaProxyUrl("//evil.example")).toBeNull();
  });

  it("validation rejects an item with an unsafe storageKey", () => {
    const res = validateGallery(
      [{ mediaId: "m1", storageKey: "../../backups/db.sql" }],
      DEFAULT_OPTIONS,
    );
    expect(res.ok).toBe(false);
    expect(res.items).toHaveLength(0);
  });

  it("hydrate drops an item whose embedded storageKey is unsafe", async () => {
    const lookup = async () => new Map();
    const out = await hydrateMediaGallery(
      [{ mediaId: "m1", sortOrder: 0, isPrimary: false, meta: {}, storageKey: "../../etc" }],
      lookup,
    );
    expect(out).toEqual([]);
  });

  it("samePhoto matches by id, key or perceptual hash", () => {
    const item = { mediaId: "m1", storageKey: "a/1.jpg", blurhash: "LABC123" };
    expect(samePhoto(item, "m1")).toBe(true);
    expect(samePhoto(item, "other", "a/1.jpg")).toBe(true);
    expect(samePhoto(item, "other", "other.jpg", "LABC123")).toBe(true);
    expect(samePhoto(item, "other", "other.jpg", "ZZZ")).toBe(false);
    expect(samePhoto(item, "other")).toBe(false);
    // Sin señales del otro lado no hay match aunque el item tenga clave/hash.
    expect(samePhoto({ mediaId: "m1" }, "m1")).toBe(true);
  });

  it("dedupeGalleryItems keeps the first of each photo and reindexes", () => {
    const mk = (mediaId: string, extra: Partial<GalleryItem> = {}, sortOrder = 0): GalleryItem => ({
      mediaId, sortOrder, isPrimary: false, meta: {}, ...extra,
    });
    const items = [
      mk("m1", { storageKey: "a/1.jpg", blurhash: "H1" }, 0),
      mk("m1", { storageKey: "a/1.jpg", blurhash: "H1" }, 1), // mismo id
      mk("m2", { storageKey: "a/1.jpg", blurhash: "H2" }, 2), // misma clave
      mk("m3", { storageKey: "a/3.jpg", blurhash: "H1" }, 3), // mismo contenido (re-subida)
      mk("m4", { storageKey: "a/4.jpg", blurhash: "H4" }, 4),
    ];
    const out = dedupeGalleryItems(items);
    expect(out.map((i) => i.mediaId)).toEqual(["m1", "m4"]);
    expect(out.map((i) => i.sortOrder)).toEqual([0, 1]);
  });

  it("dedupeGalleryItems returns the same array when there are no dupes", () => {
    const items: GalleryItem[] = [
      { mediaId: "m1", sortOrder: 0, isPrimary: false, meta: {} },
      { mediaId: "m2", sortOrder: 1, isPrimary: false, meta: {} },
    ];
    expect(dedupeGalleryItems(items)).toBe(items);
  });

  it("collectFolderImagePicks paginates and maps to picks", async () => {
    const calls: Array<Record<string, unknown>> = [];
    const pages = [
      { items: [{ id: "a", storageKey: "a.jpg", width: 10, height: 10, blurhash: "H" }], nextCursor: "c1" },
      { items: [{ id: "b", storageKey: "b.jpg" }] },
    ];
    let n = 0;
    const out = await collectFolderImagePicks(
      async (opts) => {
        calls.push({ ...opts });
        return pages[n++] ?? { items: [] };
      },
      { folderId: "f1" }
    );
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ id: "a", storageKey: "a.jpg", blurhash: "H" });
    expect(calls[0]).toMatchObject({ mimeType: "image/", folderId: "f1", limit: 100 });
    expect(calls[1]).toMatchObject({ cursor: "c1" });
  });

  it("collectFolderImagePicks stops on repeated cursor and empty pages", async () => {
    const loop = await collectFolderImagePicks(async () => ({ items: [], nextCursor: "same" }));
    expect(loop).toEqual([]);
    const empty = await collectFolderImagePicks(async () => ({ items: [] }));
    expect(empty).toEqual([]);
  });
});
