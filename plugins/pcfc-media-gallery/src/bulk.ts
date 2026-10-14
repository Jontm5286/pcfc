/**
 * Carga masiva para el botón "Añadir todas" del widget de galería.
 * Módulo puro (sin React ni @emdash-cms/admin) para poder testearlo con vitest.
 */

/**
 * Pick listo para `addMediaMany`: subconjunto de `MediaItem` que el widget
 * necesita para crear un `GalleryItem` + thumbnail sin más requests.
 */
export interface FolderPick {
  id: string;
  storageKey?: string;
  width?: number;
  height?: number;
  url?: string;
  blurhash?: string;
  dominantColor?: string;
}

export interface PageLike {
  items: Array<{
    id: string;
    storageKey?: string;
    width?: number;
    height?: number;
    url?: string;
    blurhash?: string;
    dominantColor?: string;
  }>;
  nextCursor?: string;
}

/** Tope de seguridad para no paginar infinito si el servidor repite cursor. */
export const BULK_COLLECT_MAX = 500;

/**
 * Junta todas las imágenes (paginando) para el botón "Añadir todas".
 * `listFn` es `fetchMediaList` del admin (inyectable en tests).
 * Solo imágenes; la carpeta es opcional (toda la librería si se omite).
 */
export async function collectFolderImagePicks(
  listFn: (opts: {
    cursor?: string;
    limit?: number;
    mimeType?: string;
    folderId?: string | null;
  }) => Promise<PageLike>,
  opts: { folderId?: string | null; pageSize?: number } = {}
): Promise<FolderPick[]> {
  const pageSize = opts.pageSize ?? 100;
  const out: FolderPick[] = [];
  let cursor: string | undefined;
  for (let guard = 0; guard < 20; guard++) {
    const page = await listFn({
      cursor,
      limit: pageSize,
      mimeType: "image/",
      folderId: opts.folderId ?? null,
    });
    for (const m of page.items ?? []) {
      if (out.length >= BULK_COLLECT_MAX) return out;
      out.push({
        id: m.id,
        storageKey: m.storageKey,
        width: m.width,
        height: m.height,
        url: m.url,
        blurhash: m.blurhash,
        dominantColor: m.dominantColor,
      });
    }
    if (!page.nextCursor || page.nextCursor === cursor) break;
    cursor = page.nextCursor;
  }
  return out;
}
