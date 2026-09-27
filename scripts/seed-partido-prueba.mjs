#!/usr/bin/env node
/**
 * seed-partido-prueba — PCFC (prueba del content type `partidos`)
 * ================================================================
 * 1. Registra las fotos JPG de src/assets/partidos-prueba/ en la tabla
 *    `media` de dev (igual que el upload del admin: storage_key +
 *    copia en data/media/) → URLs /_emdash/api/media/file/<key>.
 * 2. Crea el partido `prueba-galeria-fotos` en DRAFT con thumbnail + images.
 * Idempotente: si el slug existe, no duplica (reporta y sale).
 * Publicar después: repo.publish() o desde /_emdash/admin.
 *
 * Uso: node scripts/seed-partido-prueba.mjs [--publish]
 */
import { readdirSync, readFileSync, copyFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { openRepo } from './emdash-db.mjs';

/** ULID mínimo (Crockford base32, time + random) — evita depender de `ulid`. */
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
function ulid() {
  let t = Date.now();
  let s = '';
  for (let i = 0; i < 10; i++) { s = CROCKFORD[t % 32] + s; t = Math.floor(t / 32); }
  for (let i = 0; i < 16; i++) s += CROCKFORD[Math.floor(Math.random() * 32)];
  return s;
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const photoDir = join(root, 'src', 'assets', 'partidos-prueba');
const mediaDir = join(root, 'data', 'media');
const PUBLISH = process.argv.includes('--publish');

const db = new Database(join(root, 'data', 'emdash.db'));
const author = db.prepare('SELECT id FROM users LIMIT 1').get()?.id
  || db.prepare('SELECT author_id AS id FROM media LIMIT 1').get()?.id;
if (!author) throw new Error('Sin autor en DB');

const files = readdirSync(photoDir).filter((f) => /^prueba-\d+\.jpg$/.test(f)).sort();
if (files.length === 0) throw new Error('No hay prueba-NN.jpg en ' + photoDir);

const insertMedia = db.prepare(`INSERT INTO media
  (id, filename, mime_type, size, width, height, alt, caption, storage_key, content_hash, created_at, author_id, status)
  VALUES (@id, @filename, @mime_type, @size, @width, @height, @alt, @caption, @storage_key, @content_hash, @created_at, @author_id, 'ready')`);

const urls = [];
for (const [i, f] of files.entries()) {
  const buf = readFileSync(join(photoDir, f));
  // JPG sips 3024x4032 (verificado); parse rápido del SOF para no asumir.
  const { width, height } = jpegDims(buf);
  const id = ulid();
  const key = `${ulid()}.${id}.jpg`;
  const exists = db.prepare('SELECT id FROM media WHERE content_hash = ?')
    .get('sha1:' + createHash('sha1').update(buf).digest('hex'));
  if (exists) {
    const row = db.prepare('SELECT storage_key FROM media WHERE id = ?').get(exists.id);
    urls.push(`/_emdash/api/media/file/${row.storage_key}`);
    console.log(`  = existe ${f}`);
    continue;
  }
  copyFileSync(join(photoDir, f), join(mediaDir, key));
  insertMedia.run({
    id, filename: f, mime_type: 'image/jpeg', size: buf.length,
    width, height, alt: `Foto de prueba ${i + 1} — partido PCFC`,
    caption: null, storage_key: key,
    content_hash: 'sha1:' + createHash('sha1').update(buf).digest('hex'),
    created_at: new Date().toISOString(), author_id: author,
  });
  urls.push(`/_emdash/api/media/file/${key}`);
  console.log(`  + media ${f} → ${key} (${width}x${height})`);
}

/** Dimensiones de un JPEG (busca el primer marcador SOF). */
function jpegDims(buf) {
  let o = 2;
  while (o < buf.length) {
    if (buf[o] !== 0xff) break;
    const m = buf[o + 1];
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8) {
      return { height: buf.readUInt16BE(o + 5), width: buf.readUInt16BE(o + 7) };
    }
    o += 2 + buf.readUInt16BE(o + 2);
  }
  throw new Error('SOF no encontrado');
}

const { repo, close } = await openRepo();
const slug = 'prueba-galeria-fotos';
const existing = await repo.findBySlug('partidos', slug).catch(() => null);
if (existing) {
  console.log(`Partido ${slug} ya existe (status: ${existing.status ?? '?'}) — nada que crear.`);
} else {
  const photos = urls.map((src, i) => ({
    src, alt: `PCFC vs Rival (Prueba) — Foto ${i + 1}`,
    caption: i === 0 ? 'Once inicial (prueba)' : undefined,
  }));
  const created = await repo.create({
    type: 'partidos',
    slug,
    status: 'draft',
    data: {
      name: 'PCFC vs Rival (Prueba)',
      local: 'PCFC',
      visitante: 'Rival (Prueba)',
      categoria: 'Elite y Reserva',
      fecha: new Date().toISOString().slice(0, 10),
      thumbnail: { src: urls[0], alt: 'PCFC vs Rival (Prueba) — Portada' },
      images: photos,
    },
  });
  console.log(`  + draft ${slug} (${photos.length} fotos) id=${created?.id ?? '?'}`);
  if (PUBLISH) {
    await repo.publish('partidos', created?.id ?? slug);
    console.log('  → publicado');
  }
}
await close();
db.close();
