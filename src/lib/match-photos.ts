/**
 * match-photos — helpers compartidos calendario <-> galería
 * ==========================================================
 * El slug de galería de un partido se deriva de forma determinista:
 *   pcfc-<equipo-corto>-vs-<rival>-<DDmmm>
 * Ej: ("PCFC Sub-10", "Canay FC", "2026-08-24") -> "pcfc-sub10-vs-canay-24ago"
 *
 * Lo usan:
 *   - src/pages/calendario.astro → photosHref `/fotos#<slug>` (solo si la
 *     entrada existe en la colección `match_photos` y está publicada).
 *   - scripts/sync-match-photos.mjs → crea el draft `published: false`
 *     en src/content/match_photos/<slug>.md (¡mantener el algoritmo igual!).
 */

const ES_MONTHS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

/** "Atlético Bávaro" -> "atletico-bavaro" (minúsculas, sin tildes ni símbolos). */
export function slugifyTeam(name: string): string {
  return (name || 'rival')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** "2026-08-24" -> "24ago". Acepta también "2026-08-24T10:30:00-04:00". */
export function shortDateEs(iso: string): string {
  const m = (iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return 'fecha';
  const day = String(parseInt(m[3], 10));
  const mon = ES_MONTHS[parseInt(m[2], 10) - 1] || 'mes';
  return `${day}${mon}`;
}

/** Slug de galería para un partido. */
export function buildMatchSlug(team1: string, team2: string, isoDate: string): string {
  return `${slugifyTeam(team1)}-vs-${slugifyTeam(team2)}-${shortDateEs(isoDate)}`;
}
