#!/usr/bin/env node
/** CRUD de prueba players vía ContentRepository: create + update + delete.
 * Usa slug temporal `zz-test-jugador`; limpieza total al final (soft + permanent).
 * Falla (exit 1) si algo no funciona o si quedan rastros. */
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Kysely, SqliteDialect } from 'kysely';
import DB from 'better-sqlite3';
import { ContentRepository } from 'emdash';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dbPath = join(root, 'data', 'emdash.db');
const db = new Kysely({ dialect: new SqliteDialect({ database: new DB(dbPath) }) });
const repo = new ContentRepository(db);
const SLUG = 'zz-test-jugador';

const fail = (msg) => { console.error('FAIL:', msg); process.exitCode = 1; };

// Limpieza previa por si un intento anterior quedó a medias
const stale = await repo.findBySlugIncludingTrashed('players', SLUG).catch(() => null);
if (stale) {
  await repo.permanentDelete('players', stale.id).catch(() => {});
  console.log('~ rastro previo eliminado');
}

// CREATE (draft: no contamina el home publicado)
const created = await repo.create({
  type: 'players', slug: SLUG, status: 'draft',
  data: {
    name: 'ZZ Test Jugador', position: 'Atacante', number: 99,
    photo: null, photo_alt: 'ZZ Test', category: 'Academia',
    featured: 0, order: 99, matches: 0, goals: 0, assists: 0, season: '2026/2027',
  },
});
console.log('+ creado id=%s status=%s', created.id, created.status ?? created.data?.status ?? 'draft');

// UPDATE
const updated = await repo.update('players', created.id, { data: { goals: 3, featured: 1 } });
const goals = updated.data?.goals ?? updated.goals;
console.log('~ update goals=%s', JSON.stringify(goals));
if (String(goals) !== '3' && goals !== 3) fail('update no persistió goals=3');

// DELETE (soft + permanente)
await repo.delete('players', created.id);
const trashed = await repo.findBySlugIncludingTrashed('players', SLUG).catch(() => null);
console.log('- soft delete ok (en papelera: %s)', trashed ? 'sí' : 'NO');
if (!trashed) fail('soft delete no dejó rastro en papelera');
await repo.permanentDelete('players', created.id);
const gone = await repo.findBySlugIncludingTrashed('players', SLUG).catch(() => null);
console.log('- permanent delete ok (rastro: %s)', gone ? 'SÍ — MAL' : 'ninguno');
if (gone) fail('quedó rastro tras permanent delete');

// Estado final
const count = await db.selectFrom('ec_players').select(db.fn.countAll().as('c')).executeTakeFirst();
console.log('COUNT ec_players = %s', count.c);
if (String(count.c) !== '4') fail(`COUNT esperado 4, real ${count.c}`);

await db.destroy();
console.log(process.exitCode ? 'CRUD PRUEBA: FALLÓ' : 'CRUD PRUEBA: OK (create+update+delete, DB limpia)');
