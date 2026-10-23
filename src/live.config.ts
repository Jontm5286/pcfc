/**
 * Live Content Collections — PCFC + EmDash CMS
 * ===============================================
 * Este archivo define las Live Collections que se consultan en tiempo real
 * desde EmDash CMS via `emdashLoader()`.
 *
 * IMPORTANTE: Las Live Collections DEBEN estar en src/live.config.ts
 * (NO en src/content.config.ts). Astro lo requiere explícitamente.
 *
 * EmDash usa UNA SOLA Live Collection llamada "_emdash" como proxy
 * para TODAS las content types (sponsors, categories, calendar, etc.).
 * Luego `getEmDashCollection('sponsors')` filtra por tipo específico.
 *
 * El nombre "_emdash" (con guión bajo) está hardcodeado internamente
 * en EmDash (nombre interno estable; no depende de la versión).
 *
 * Ref: emdash Live Content API docs.
 */
import { defineLiveCollection } from 'astro:content';
import { emdashLoader } from 'emdash/runtime';

// Live Collection proxy para EmDash CMS.
// Nombre "_emdash" es REQUERIDO (interno de EmDash).
export const collections = {
  _emdash: defineLiveCollection({
    loader: emdashLoader(),
  }),
};
