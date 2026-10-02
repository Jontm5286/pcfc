#!/usr/bin/env node
/**
 * add-show-in-hero — PCFC (una sola vez)
 * Agrega el campo `show_in_hero` a `match_photos` por la vía propia de EmDash
 * (SchemaRegistry.createField: ALTER TABLE + triggers + registry).
 * Idempotente. Definición espejo de .emdash/schema.json.
 */
import { Kysely, SqliteDialect } from 'kysely';
import DB from 'better-sqlite3';
import { SchemaRegistry } from 'emdash';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const db = new Kysely({ dialect: new SqliteDialect({ database: new DB(join(root, 'data', 'emdash.db')) }) });
const registry = new SchemaRegistry(db);

const has = await registry.getField('match_photos', 'show_in_hero').catch(() => null);
if (has) {
  console.log('= campo show_in_hero ya existe en DB');
} else {
  await registry.createField('match_photos', {
    slug: 'show_in_hero',
    label: 'Mostrar en hero',
    type: 'boolean',
    required: false,
    defaultValue: 0,
  });
  console.log('+ campo show_in_hero creado (columna + triggers + registry)');
}
await db.destroy();
