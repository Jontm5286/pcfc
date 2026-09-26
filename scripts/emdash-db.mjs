#!/usr/bin/env node
/**
 * emdash-db — helper compartido para scripts PCFC
 * Abre data/emdash.db con kysely + better-sqlite3 y devuelve ContentRepository.
 * Uso:
 *   import { openRepo } from './emdash-db.mjs';
 *   const { repo, close } = await openRepo();
 *   ...
 *   await close();
 */
import { ContentRepository } from 'emdash';
import { Kysely, SqliteDialect } from 'kysely';
import DB from 'better-sqlite3';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export async function openRepo(dbFile = './data/emdash.db') {
  const url = process.env.EMDASH_DATABASE_URL || `file:${dbFile}`;
  const path = url.startsWith('file:') ? join(root, url.slice(5)) : url;
  const db = new Kysely({
    dialect: new SqliteDialect({ database: new DB(path) }),
  });
  return { repo: new ContentRepository(db), close: () => db.destroy() };
}
