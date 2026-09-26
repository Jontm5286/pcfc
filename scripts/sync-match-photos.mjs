#!/usr/bin/env node
/**
 * sync-match-photos — PCFC
 * =========================
 * Por cada partido JUGADO del feed FutbolPro Academy crea un draft en la
 * colección EmDash `partidos` (un partido = una galería).
 * Ahí es donde luego se suben las fotos en /_emdash/admin y se publica.
 * Sin fotos no hay galería: /fotos y /calendario solo usan publicadas con fotos.
 *
 * El slug DEBE coincidir con src/lib/match-photos.ts (buildMatchSlug).
 * Si cambias el algoritmo aquí, cámbialo allá también.
 *
 * Uso: pnpm sync:match-photos
 */
import { openRepo } from './emdash-db.mjs';

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

// ——— Mismo mapeo que academyCategoryToWeb (label EmDash para el select) ———
function academyCategoryToWeb(category) {
  const c = (category || '').toLowerCase();
  const short = (category || '').split('(')[0].trim() || 'Cantera';
  if (c.includes('elite') || c.includes('reserva')) return { slug: 'elite', label: 'Elite y Reserva', short };
  if (c.includes('sub-6') || c.includes('sub-8')) return { slug: 'pre', label: 'Pre-Formativas', short };
  if (c.includes('sub-10') || c.includes('sub-12')) return { slug: 'form-baja', label: 'Formativas Bajas', short };
  // Nota: el select EmDash solo tiene los 4 niveles; Femenino va a Formativas Altas.
  return { slug: 'form-alta', label: 'Formativas Altas', short };
}

const res = await fetch(`${ACADEMY_API_URL}/api/public/matches`, { signal: AbortSignal.timeout(15000) });
if (!res.ok) {
  console.error(`Feed respondió ${res.status}. Nada que sincronizar.`);
  process.exit(1);
}
const data = await res.json();
const played = Array.isArray(data?.played) ? data.played : [];
console.log(`Partidos jugados en feed: ${played.length}`);

const { repo, close } = await openRepo();
let created = 0;
for (const m of played) {
  const cat = academyCategoryToWeb(m.category);
  const team1 = `PCFC ${cat.short}`;
  const team2 = m.opponent || 'Rival por confirmar';
  const slug = buildMatchSlug(team1, team2, m.matchDate);
  const exists = await repo.findBySlug('partidos', slug).catch(() => null);
  if (exists) continue;
  await repo.create({
    type: 'partidos',
    slug,
    status: 'draft',
    data: {
      name: `${team1} vs ${team2}`,
      local: team1,
      visitante: team2,
      categoria: cat.label,
      fecha: (m.matchDate || '').slice(0, 10) || undefined,
      academy_id: m.id || undefined,
      thumbnail: { src: '/images/stock/partido-sub13.webp', alt: `${team1} vs ${team2}` },
      images: [],
    },
  });
  created++;
  console.log(`  + draft ${slug}`);
}
console.log(`Drafts creados: ${created}.`);
await close();
