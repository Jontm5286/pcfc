#!/usr/bin/env node
/**
 * upload-pack.mjs — sube un pack completo de fotos a una entrada `match_photos`.
 *
 * Uso:
 *   node scripts/upload-pack.mjs <carpeta-local> <slug> [--no-publish] [--name="..."] [--caption="..."]
 *
 * Qué hace (un comando = pack completo):
 *   1. Respalda data/emdash.db → data/emdash.db.bak-<timestamp>.
 *   2. Registra TODAS las imágenes de la carpeta en la Media Library de EmDash
 *      (tabla `media` + copia a data/media/, igual que el upload del admin;
 *      deduplica por content_hash).
 *   3. Actualiza (o crea) la entrada `match_photos` con ese slug:
 *      images[] = [{src, alt, caption}], portada = primera foto, y la publica
 *      (salvo --no-publish).
 *
 * Ejemplos:
 *   node scripts/upload-pack.mjs ./fotos/clasico-01 clasico-j12
 *   node scripts/upload-pack.mjs /tmp/test-pack test-pack
 */
import { readdirSync, readFileSync, copyFileSync, existsSync, mkdirSync, cpSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
import { openRepo } from './emdash-db.mjs';
import DB from 'better-sqlite3';

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif']);
const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif' };

// ULID (Crockford) — mismo formato que usa EmDash.
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const ulid = () => {
  let out = '';
  let ms = Date.now();
  for (let i = 0; i < 10; i++) { out = CROCKFORD[ms % 32] + out; ms = Math.floor(ms / 32); }
  const r = randomBytes(16);
  for (const b of r) { out += CROCKFORD[b & 31]; if (out.length === 26) break; }
  return out.slice(0, 26);
};

function jpegDims(buf) {
  let o = 2;
  while (o + 8 < buf.length) {
    if (buf[o] !== 0xff) break;
    const m = buf[o + 1];
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
      return { height: buf.readUInt16BE(o + 5), width: buf.readUInt16BE(o + 7) };
    }
    o += 2 + buf.readUInt16BE(o + 2);
  }
  return { width: null, height: null };
}
function pngDims(buf) {
  if (buf.length < 24 || buf.readUInt32BE(12) !== 0x49484452) return { width: null, height: null };
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function parseArgs(argv) {
  const [dir, slug, ...rest] = argv;
  const flags = { publish: true, name: null, caption: null };
  for (const a of rest) {
    if (a === '--no-publish') flags.publish = false;
    else if (a.startsWith('--name=')) flags.name = a.slice(7);
    else if (a.startsWith('--caption=')) flags.caption = a.slice(10);
    else throw new Error(`Flag desconocido: ${a}`);
  }
  if (!dir || !slug) throw new Error('Uso: node scripts/upload-pack.mjs <carpeta> <slug> [--no-publish] [--name="..."] [--caption="..."]');
  return { dir, slug, flags };
}

const { dir, slug, flags } = parseArgs(process.argv.slice(2));
if (!existsSync(dir)) throw new Error(`Carpeta no existe: ${dir}`);

const files = readdirSync(dir)
  .filter((f) => IMAGE_EXTS.has(extname(f).toLowerCase()))
  .sort()
  .map((f) => join(dir, f));
if (files.length === 0) throw new Error(`Sin imágenes en ${dir}`);

// 1. Backup de la DB antes de escribir.
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backup = `data/emdash.db.bak-${stamp}`;
cpSync('data/emdash.db', backup);
console.log(`[upload-pack] backup → ${backup}`);

const rawDb = new DB('data/emdash.db');
const { repo, close } = await openRepo();
const db = rawDb;
try {
  mkdirSync('data/media', { recursive: true });
  const author = db.prepare('SELECT id FROM users LIMIT 1').get()?.id
    || db.prepare('SELECT author_id AS id FROM media LIMIT 1').get()?.id;
  if (!author) throw new Error('Sin autor en DB');

  const insertMedia = db.prepare(`INSERT INTO media
    (id, filename, mime_type, size, width, height, alt, caption, storage_key, content_hash, created_at, author_id, status)
    VALUES (@id, @filename, @mime_type, @size, @width, @height, @alt, @caption, @storage_key, @content_hash, @created_at, @author_id, 'ready')`);

  // 2. Registrar cada foto en la Media Library.
  const items = []; // { id, storageKey, src, mimeType, width, height, filename }
  for (const file of files) {
    const buf = readFileSync(file);
    const ext = extname(file).toLowerCase();
    const hash = 'sha1:' + createHash('sha1').update(buf).digest('hex');
    const dup = db.prepare('SELECT id, storage_key, mime_type, width, height, filename FROM media WHERE content_hash = ?').get(hash);
    if (dup) {
      console.log(`[upload-pack] dedup ${basename(file)} → media ${dup.id}`);
      items.push({ id: dup.id, storageKey: dup.storage_key, src: `/_emdash/api/media/file/${dup.storage_key}`, mimeType: dup.mime_type, width: dup.width, height: dup.height, filename: dup.filename });
      continue;
    }
    const id = ulid();
    const key = `${ulid()}.${id}${ext}`;
    copyFileSync(file, join('data/media', key));
    const dims = ext === '.png' ? pngDims(buf) : ext === '.jpg' || ext === '.jpeg' ? jpegDims(buf) : { width: null, height: null };
    insertMedia.run({
      id, filename: basename(file), mime_type: MIME[ext] ?? 'application/octet-stream',
      size: buf.length, width: dims.width, height: dims.height,
      alt: flags.caption ?? basename(file), caption: flags.caption ?? null, storage_key: key,
      content_hash: hash, created_at: new Date().toISOString(), author_id: author,
    });
    console.log(`[upload-pack] media ${id} ← ${basename(file)}`);
    items.push({ id, storageKey: key, src: `/_emdash/api/media/file/${key}`, mimeType: MIME[ext] ?? 'application/octet-stream', width: dims.width, height: dims.height, filename: basename(file) });
  }

  // 3. images[] + portada (primera foto).
  const altBase = flags.name ?? slug;
  const images = items.map((it, i) => ({
    src: it.src,
    alt: `${altBase} — foto ${i + 1}`,
    caption: flags.caption ?? null,
  }));
  const first = items[0];
  const portada = {
    id: first.id, provider: 'local', filename: first.filename, mimeType: first.mimeType,
    width: first.width, height: first.height, alt: images[0].alt,
    meta: { storageKey: first.storageKey, caption: flags.caption ?? null, blurhash: null, dominantColor: null },
  };

  let entry = await repo.findBySlug('match_photos', slug);
  if (!entry) {
    entry = await repo.create({
      type: 'match_photos', slug, status: 'draft',
      data: {
        name: flags.name ?? slug,
        images, portada,
        partido: slug,
        date: new Date().toISOString().slice(0, 10),
      },
    });
    console.log(`[upload-pack] creada entrada match_photos/${slug} (${entry.id})`);
  } else {
    entry = await repo.update('match_photos', entry.id, { data: { ...entry.data, images, portada } });
    console.log(`[upload-pack] actualizada entrada match_photos/${slug} (${entry.id})`);
  }
  if (flags.publish && entry.status !== 'published') {
    entry = await repo.publish('match_photos', entry.id);
    console.log(`[upload-pack] publicada`);
  }
  console.log(`[upload-pack] OK slug=${slug} status=${entry.status} fotos=${images.length}`);
} finally {
  rawDb.close();
  await close();
}
