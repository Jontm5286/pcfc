#!/usr/bin/env node
/**
 * seed-partidos-galleries — PCFC (una sola vez)
 * ============================================
 * Migra las 8 galerías históricas (src/content/match_photos/*.md) a la
 * colección EmDash `partidos` como entradas published con sus fotos.
 * El slug = nombre del archivo → los anchors /fotos#<slug> siguen funcionando.
 * Idempotente: salta slugs que ya existen.
 *
 * Uso: node scripts/seed-partidos-galleries.mjs
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openRepo } from './emdash-db.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const mdDir = join(root, 'src', 'content', 'match_photos');

const ES = { ene: '01', feb: '02', mar: '03', abr: '04', may: '05', jun: '06', jul: '07', ago: '08', sep: '09', oct: '10', nov: '11', dic: '12' };

function parseMd(text) {
  const fm = {};
  const photos = [];
  const lines = text.split('\n');
  let inPhotos = false;
  let cur = null;
  for (const line of lines) {
    if (/^photos:\s*$/.test(line)) { inPhotos = true; continue; }
    if (!inPhotos) {
      const m = line.match(/^([A-Za-z]+):\s*"?([^"]*)"?\s*$/);
      if (m && m[1] !== '---') fm[m[1]] = m[2].replace(/"$/, '');
      continue;
    }
    let m = line.match(/^\s+-\s+src:\s*"([^"]+)"/);
    if (m) { cur = { src: m[1] }; photos.push(cur); continue; }
    m = line.match(/^\s+(alt|caption):\s*"([^"]*)"/);
    if (m && cur) cur[m[1]] = m[2];
  }
  return { fm, photos };
}

/** "21 ago 2026" -> "2026-08-21" */
function toISO(dateStr) {
  const m = (dateStr || '').match(/(\d{1,2})\s+([a-z]{3})\s+(\d{4})/i);
  if (!m) return undefined;
  return `${m[3]}-${ES[m[2].toLowerCase()] || '01'}-${String(m[1]).padStart(2, '0')}`;
}

const { repo, close } = await openRepo();
const files = readdirSync(mdDir).filter((f) => f.endsWith('.md'));
console.log(`Archivos md: ${files.length}`);
let created = 0;
for (const file of files) {
  const slug = basename(file, '.md');
  const exists = await repo.findBySlug('partidos', slug).catch(() => null);
  if (exists) { console.log(`  = existe ${slug}`); continue; }
  const { fm, photos } = parseMd(readFileSync(join(mdDir, file), 'utf8'));
  await repo.create({
    type: 'partidos',
    slug,
    status: 'published',
    data: {
      name: `${fm.team1} vs ${fm.team2}`,
      local: fm.team1,
      visitante: fm.team2,
      categoria: fm.categoryLabel,
      fecha: toISO(fm.date),
      thumbnail: { src: fm.thumbnail, alt: fm.thumbnailAlt || `${fm.team1} vs ${fm.team2}` },
      images: photos,
    },
  });
  created++;
  console.log(`  + published ${slug} (${photos.length} fotos)`);
}
console.log(`Creadas: ${created}.`);
await close();
