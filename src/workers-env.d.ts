/**
 * Tipos mínimos para el import dinámico de `cloudflare:workers`
 * (solo existe en el runtime de Workers; en dev el import falla y se usa
 * el fallback local). Ver src/lib/foto-likes-db.ts resolveD1Binding.
 */
declare module 'cloudflare:workers' {
  export const env: Record<string, unknown>;
}
