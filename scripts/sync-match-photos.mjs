#!/usr/bin/env node
/**
 * sync-match-photos — PCFC
 * =========================
 * Por cada partido JUGADO del feed FutbolPro Academy crea un draft en
 * src/content/match_photos/<slug>.md con `published: false` y sin fotos.
 * Ahí es donde luego se suben las fotos de ese partido.
 * Sin fotos no hay galería: /fotos y /calendario solo enlazan entradas
 * con `published: true` + fotos.
 *
 * El slug DEBE coincidir con src/lib/match-photos.ts (buildMatchSlug).
 * Si cambias el algoritmo aquí, cámbialo allá también.
 *
 * Uso: pnpm sync:match-photos
 */

import { mkdirSync, existsSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'src', 'content', 'match_photos');

const ACADEMY_API_URL =
  process.env.PUBLIC_ACADEMY_API_URL ||
  'https://futbolpro-academy.johantavarez89.workers.dev';

// ——— Mismo algoritmo que src/lib/match-photos.ts ———
const ES_MONTHS = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

function slugifyTeam(name) {
  return (name || 'rival')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function shortDateEs(iso) {
  const m = (iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return 'fecha';
  return `${parseInt(m[3], 10)}${ES_MONTHS[parseInt(m[2], 10) - 1] || 'mes'}`;
}

function buildMatchSlug(team1, team2, isoDate) {
  return `${slugifyTeam(team1)}-vs-${slugifyTeam(team2)}-${shortDateEs(isoDate)}`;
}

// ——— Mismo mapeo que academyCategoryToWeb en calendario.astro ———
function academyCategoryToWeb(category) {
  const c = (category || '').toLowerCase();
  const short = (category || '').split('(')[0].trim() || 'Cantera';
  if (c.includes('elite') || c.includes('reserva')) return { slug: 'elite', label: 'Elite / Reserva', short };
  if (c.includes('sub-6') || c.includes('sub-8')) return { slug: 'pre', label: 'Pre-Formativas', short };
  if (c.includes('sub-10') || c.includes('sub-12')) return { slug: 'form-baja', label: 'Formativas Bajas', short };
  if (c.includes('femen')) return { slug: 'form-alta', label: 'Femenino', short };
  return { slug: 'form-alta', label: 'Formativas Altas', short };
}

function displayDate(iso) {
  const m = (iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  return `${parseInt(m[3], 10)} ${ES_MONTHS[parseInt(m[2], 10) - 1]} ${m[1]}`;
}

const res = await fetch(`${ACADEMY_API_URL}/api/public/matches`, { signal: AbortSignal.timeout(15000) });
if (!res.ok) {
  console.error(`Feed respondió ${res.status}. Nada que sincronizar.`);
  process.exit(1);
}
const data = await res.json();
const played = Array.isArray(data?.played) ? data.played : [];
console.log(`Partidos jugados en feed: ${played.length}`);

mkdirSync(outDir, { recursive: true });
const existing = new Set(readdirSync(outDir).map((f) => f.replace(/\.md$/, '')));

let created = 0;
for (const m of played) {
  const cat = academyCategoryToWeb(m.category);
  const team1 = `PCFC ${cat.short}`;
  const team2 = m.opponent || 'Rival por confirmar';
  const slug = buildMatchSlug(team1, team2, m.matchDate);
  if (existing.has(slug)) continue;
  const md = `---\ncategorySlug: "${cat.slug}"\ncategoryLabel: "${cat.label}"\nteam1: "${team1}"\nteam2: "${team2}"\ndate: "${displayDate(m.matchDate)}"\nthumbnail: "/images/stock/partido-sub13.webp"\nthumbnailAlt: "${team1} vs ${team2} — Partido ${cat.label}"\npublished: false\nphotos: []\n---\n\n<!-- Draft auto-generado desde FutbolPro Academy (id: ${m.id || 'n/a'}). Subir fotos y poner published: true. -->\n`;
  writeFileSync(join(outDir, `${slug}.md`), md);
  existing.add(slug);
  created++;
  console.log(`  + draft ${slug}`);
}
console.log(`Drafts creados: ${created}. Existen ${existing.size} entradas en match_photos.`);
