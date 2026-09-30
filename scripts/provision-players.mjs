#!/usr/bin/env node
/**
 * provision-players — PCFC (una sola vez)
 * Crea la colección `players` en la DB con el mecanismo propio de EmDash
 * (SchemaRegistry.createCollection/createField: tabla ec_players + triggers),
 * usando la definición de .emdash/schema.json, y siembra los 4 jugadores de
 * ejemplo vía ContentRepository (create published). Idempotente.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Kysely, SqliteDialect } from 'kysely';
import DB from 'better-sqlite3';
import { SchemaRegistry, ContentRepository } from 'emdash';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dbPath = join(root, 'data', 'emdash.db');
const db = new Kysely({ dialect: new SqliteDialect({ database: new DB(dbPath) }) });
const registry = new SchemaRegistry(db);
const repo = new ContentRepository(db);

const schema = JSON.parse(readFileSync(join(root, '.emdash', 'schema.json'), 'utf8'));
const playersDef = schema.collections.find((c) => c.slug === 'players');
if (!playersDef) throw new Error('players no está en .emdash/schema.json');

// 1. Colección (idempotente)
const existing = await registry.getCollection('players').catch(() => null);
if (existing) {
  console.log('= colección players ya existe en DB');
} else {
  await registry.createCollection({
    slug: playersDef.slug,
    label: playersDef.label,
    labelSingular: playersDef.labelSingular,
    supports: playersDef.supports,
    routable: playersDef.routable,
  });
  console.log('+ colección players creada (tabla ec_players)');
}

// 2. Campos (idempotente)
const toSnake = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
for (const f of playersDef.fields) {
  const slug = toSnake(f.slug);
  const has = await registry.getField('players', slug).catch(() => null);
  if (has) { console.log(`= campo ${f.slug} existe`); continue; }
  try {
    await registry.createField('players', {
      slug, label: f.label, type: f.type,
      required: f.required ?? false, searchable: f.searchable ?? false,
      options: f.options,
    });
    console.log(`+ campo ${f.slug} creado`);
  } catch (e) {
    if (e?.code === 'RESERVED_SLUG') { console.log(`= campo ${f.slug} reservado (columna sistema), omitido`); continue; }
    throw e;
  }
}

// 3. Seeds desde src/content/players/*.json (vía admin: create published)
const dir = join(root, 'src', 'content', 'players');
const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
let created = 0;
for (const file of files) {
  const p = JSON.parse(readFileSync(join(dir, file), 'utf8'));
  const slug = p.slug || basename(file, '.json');
  const found = await repo.findBySlug('players', slug).catch(() => null);
  if (found) { console.log(`= existe ${slug}`); continue; }
  const data = {};
  for (const [k, v] of Object.entries(p)) data[toSnake(k)] = v;
  await repo.create({ type: 'players', slug, status: 'published', data });
  created++;
  console.log(`+ published ${slug}`);
}
console.log(`Jugadores creados: ${created}.`);
await db.destroy();
