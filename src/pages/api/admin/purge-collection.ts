/**
 * POST /api/admin/purge-collection — PCFC
 * Purga quirúrgica de colecciones EmDash legacy cuando el borrado nativo
 * falla (en prod el borrado por schema retorna Ok sin efecto porque la
 * activación de media-usage quedó a medias: sin fila de índice ni triggers
 * de captura, el guard de borrado no avanza).
 *
 * Solo para colecciones en desuso aprobadas (allowlist explícita) y solo
 * con sesión de admin EmDash. NO toca R2 (los archivos quedan) ni
 * colecciones vivas. Equivale a lo que el borrado nativo haría en sincronía:
 * DROP de la tabla de contenido + FTS, borrado de la fila del registry
 * (los fields caen explícitos) y limpieza de rastros en media-usage.
 *
 * Body: { slug: string, force?: boolean }
 * - Sin force: 409 si quedan entradas vivas (deleted_at IS NULL).
 */
import type { APIRoute } from 'astro';

/** Colecciones legacy aprobadas para purga. Todo lo demás → 400. */
const PURGE_ALLOWLIST = new Set(['partidos', 'teams', 'gallery', 'calendar', 'equipos']);

/** Colecciones que sostienen el sitio: jamás purgables por esta vía. */
const PROTECTED = new Set([
  'match_photos',
  'players',
  'hero',
  'categories',
  'sponsors',
  'staff',
  'products',
  'faqs',
  'club_history',
  'stats_pillars',
  'next_match',
]);

const SLUG_RE = /^[a-z][a-z0-9_]{0,62}$/;

function isAdmin(locals: unknown): boolean {
  const user = (locals as Record<string, unknown> | null)?.user as
    Record<string, unknown> | undefined;
  return user?.role === 50 || user?.role === 'admin';
}

interface DbExec {
  run(sql: string, params?: unknown[]): Promise<unknown>;
  first<T>(sql: string, params?: unknown[]): Promise<T | null>;
}

async function openDb(): Promise<{ db: DbExec; close: () => Promise<void> }> {
  // Workers: binding D1. Dev local: ./data/emdash.db vía better-sqlite3.
  try {
    const cf = (await import(/* @vite-ignore */ 'cloudflare:workers')) as unknown as {
      env?: Record<string, unknown>;
    };
    const d1 = cf.env?.DB as
      | {
          prepare: (sql: string) => {
            bind: (...p: unknown[]) => {
              run: () => Promise<{ meta?: { changes?: number } }>;
              first: <T>(col?: string) => Promise<T | null>;
            };
          };
        }
      | undefined;
    if (d1) {
      const db: DbExec = {
        run: (sql, params = []) =>
          d1
            .prepare(sql)
            .bind(...params)
            .run(),
        first: <T>(sql: string, params: unknown[] = []) =>
          d1
            .prepare(sql)
            .bind(...params)
            .first<T>(),
      };
      return { db, close: async () => {} };
    }
  } catch {
    // No es Workers: cae a sqlite local.
  }
  const { default: BetterSqlite3 } = (await import(
    /* @vite-ignore */ 'better-sqlite3'
  )) as unknown as { default: new (path: string) => unknown };
  const path = new URL('../../../../data/emdash.db', import.meta.url).pathname;
  const sqlite = new BetterSqlite3(path) as {
    prepare: (sql: string) => {
      run: (...p: unknown[]) => { changes: number };
      get: (...p: unknown[]) => unknown;
    };
    close: () => void;
  };
  const db: DbExec = {
    run: async (sql, params = []) => sqlite.prepare(sql).run(...params),
    first: async <T>(sql: string, params: unknown[] = []) =>
      (sqlite.prepare(sql).get(...params) as T | undefined) ?? null,
  };
  return { db, close: async () => sqlite.close() };
}

export const POST: APIRoute = async ({ request, locals }) => {
  if (!isAdmin(locals)) {
    return new Response(JSON.stringify({ success: false, error: 'forbidden' }), { status: 403 });
  }
  let body: { slug?: unknown; force?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ success: false, error: 'bad-json' }, { status: 400 });
  }
  const slug = typeof body.slug === 'string' ? body.slug : '';
  const force = body.force === true;
  if (!SLUG_RE.test(slug)) {
    return Response.json({ success: false, error: 'bad-slug' }, { status: 400 });
  }
  if (PROTECTED.has(slug) || !PURGE_ALLOWLIST.has(slug)) {
    return Response.json({ success: false, error: 'not-purgeable' }, { status: 400 });
  }

  const table = `ec_${slug}`;
  const fts = `_emdash_fts_${slug}`;
  const { db, close } = await openDb();
  try {
    const coll = await db.first<{ id: string }>(
      'SELECT id FROM _emdash_collections WHERE slug = ?',
      [slug]
    );
    if (!coll) return Response.json({ success: false, error: 'not-found' }, { status: 404 });

    let liveEntries: number | null = null;
    try {
      const row = await db.first<{ n: number }>(
        `SELECT COUNT(*) AS n FROM "${table}" WHERE deleted_at IS NULL`
      );
      liveEntries = Number(row?.n ?? 0);
    } catch {
      liveEntries = 0; // sin tabla de contenido: nada que contar
    }
    if (liveEntries > 0 && !force) {
      return Response.json({ success: false, error: 'has-content', liveEntries }, { status: 409 });
    }

    const summary: Record<string, unknown> = { slug, liveEntries };
    // 1. Tablas (los triggers de captura caen con el DROP en SQLite/D1).
    await db.run(`DROP TABLE IF EXISTS "${table}"`);
    summary.contentTable = 'dropped';
    await db.run(`DROP TABLE IF EXISTS "${fts}"`);
    summary.ftsTable = 'dropped';
    // 2. Registry: fields explícitos (sin depender del cascade de FK).
    await db.run('DELETE FROM _emdash_fields WHERE collection_id = ?', [coll.id]);
    summary.fields = 'deleted';
    await db.run('DELETE FROM _emdash_collections WHERE id = ?', [coll.id]);
    summary.collection = 'deleted';
    // 3. Rastros en media-usage (índice, fuentes, trabajo y lápidas).
    for (const t of [
      '_emdash_media_usage_index_status',
      '_emdash_media_usage_sources',
      '_emdash_media_usage_work',
      '_emdash_media_usage_collection_deletions',
    ]) {
      try {
        await db.run(`DELETE FROM "${t}" WHERE collection_id = ?`, [coll.id]);
      } catch {
        // Tabla inexistente en schemas viejos: se ignora.
      }
    }
    summary.mediaUsage = 'cleaned';
    return Response.json({ success: true, data: summary });
  } catch (e) {
    console.error(`[purge-collection] falló ${slug}:`, e);
    return Response.json({ success: false, error: 'purge-failed' }, { status: 500 });
  } finally {
    await close();
  }
};
