/**
 * Claves estables de foto para likes + selector de destacadas.
 * La clave es "<slug-de-galería>:<índice>" y nunca cambia aunque se
 * reordene la página: los conteos en D1 sobreviven al rediseño.
 */

/** Clave estable de una foto para likes: "<slug>:<indice>". */
export function photoKey(gallerySlug: string, index: number): string {
  return `${gallerySlug}:${index}`;
}

export interface DestacadaInput {
  id: string;
  photos: { src: string; alt: string; caption?: string }[];
}

export interface Destacada {
  galleryId: string;
  index: number;
  src: string;
  alt: string;
  caption?: string;
}

/**
 * Las N destacadas: primero fotos CON caption (etiquetadas),
 * luego relleno por orden de llegada. Sin tocar EmDash.
 */
export function pickDestacadas(posts: DestacadaInput[], n = 8): Destacada[] {
  const tagged: Destacada[] = [];
  const rest: Destacada[] = [];
  for (const p of posts) {
    for (let i = 0; i < p.photos.length; i += 1) {
      const ph = p.photos[i];
      (ph.caption ? tagged : rest).push({
        galleryId: p.id,
        index: i,
        src: ph.src,
        alt: ph.alt,
        caption: ph.caption,
      });
    }
  }
  return [...tagged, ...rest].slice(0, n);
}
