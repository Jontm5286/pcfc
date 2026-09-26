#!/usr/bin/env node
/**
 * convert-to-webp — PCFC
 * ======================
 * Convierte JPG/PNG → WebP con máximo 2000px (sin ampliar).
 * Uso:
 *   node scripts/convert-to-webp.mjs --dir=public/images/sponsors
 *   node scripts/convert-to-webp.mjs --dir=uploads --max=2000 --quality=82 --replace
 * Flags:
 *   --dir=<ruta>    directorio (recursivo). default: public/images/sponsors
 *   --max=<px>      lado mayor máximo. default: 2000
 *   --quality=<n>   calidad webp 1-100. default: 82
 *   --replace       borra el original tras convertir. default: conserva ambos
 */
import sharp from 'sharp';
import { readdirSync, statSync, unlinkSync } from 'node:fs';
import { join, extname, basename } from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(=(.*))?$/);
    return [m[1], m[3] ?? true];
  }),
);

const DIR = String(args.dir || 'public/images/sponsors');
const MAX = parseInt(args.max || '2000', 10);
const QUALITY = parseInt(args.quality || '82', 10);
const REPLACE = args.replace === true || args.replace === 'true';
const SRC_EXTS = new Set(['.jpg', '.jpeg', '.png']);

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (SRC_EXTS.has(extname(f).toLowerCase())) out.push(p);
  }
  return out;
}

let ok = 0, skip = 0, before = 0, after = 0;
for (const src of walk(DIR)) {
  const dest = join(src.slice(0, -extname(src).length) + '.webp');
  try {
    const meta = await sharp(src).metadata();
    if ((meta.width || 0) <= MAX && (meta.height || 0) <= MAX && extname(src).toLowerCase() === '.webp') { skip++; continue; }
    const info = await sharp(src)
      .resize({ width: MAX, height: MAX, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(dest);
    before += statSync(src).size;
    after += info.size;
    if (REPLACE) unlinkSync(src);
    ok++;
    console.log(`  ✓ ${basename(src)} → ${basename(dest)} (${Math.round(info.size / 1024)}KB)`);
  } catch (e) {
    console.log(`  ✗ ${basename(src)}: ${e.message}`);
  }
}
console.log(`\nListo: ${ok} convertidas, ${skip} omitidas. ${Math.round(before / 1024)}KB → ${Math.round(after / 1024)}KB.`);
