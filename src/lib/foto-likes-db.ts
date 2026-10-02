/**
 * foto-likes-db — PCFC
 * Store de likes con dos backends y el mismo SQL (dialecto sqlite):
 *  - Prod (Workers): binding D1 `DB` (tablas de migrations/0003_photo_likes.sql).
 *  - Dev local (adapter Node, sin binding D1): archivo ./data/foto-likes.db
 *    (better-sqlite3, AUTO-CREADO con el mismo schema; NO toca data/emdash.db
 *    ni el schema de EmDash).
 */
export interface ToggleResult {
  likes: number;
  liked: boolean;
}

export interface LikesStore {
  getCounts(keys: string[]): Promise<Record<string, number>>;
  toggle(photoKey: string, voterHash: string): Promise<ToggleResult>;
}

export class RateLimitedError extends Error {
  constructor() {
    super('rate_limited');
    this.name = 'RateLimitedError';
  }
}

const MAX_IDS = 200;
const VOTES_PER_HOUR = 60;

/** Mismo schema que migrations/0003_photo_likes.sql (duplicado para runtime). */
const SCHEMA = `
CREATE TABLE IF NOT EXISTS photo_likes (
  photo_key TEXT PRIMARY KEY,
  likes INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS photo_like_votes (
  photo_key TEXT NOT NULL,
  voter_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  PRIMARY KEY (photo_key, voter_hash)
);
CREATE INDEX IF NOT EXISTS idx_photo_like_votes_voter_time
  ON photo_like_votes (voter_hash, created_at);
`;

function schemaStatements(): string[] {
  return SCHEMA.split(';')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Backend D1 (Cloudflare Workers). `db` es el binding `DB` (tipado laxo). */
function d1Store(db: {
  prepare(q: string): {
    bind(...args: unknown[]): {
      all(): Promise<{ results?: Array<Record<string, unknown>> }>;
      first(): Promise<Record<string, unknown> | null>;
      run(): Promise<unknown>;
    };
  };
  batch(stmts: unknown[]): Promise<unknown>;
}): LikesStore {
  let ensured: Promise<unknown> | null = null;
  const ensure = () => {
    if (!ensured) {
      const stmts = schemaStatements().map((s) => db.prepare(s));
      ensured = db.batch(stmts);
    }
    return ensured;
  };

  return {
    async getCounts(keys: string[]) {
      const ids = [...new Set(keys)].slice(0, MAX_IDS);
      const counts: Record<string, number> = {};
      for (const k of ids) counts[k] = 0;
      if (ids.length === 0) return counts;
      await ensure();
      const placeholders = ids.map(() => '?').join(',');
      const res = await db
        .prepare(`SELECT photo_key, likes FROM photo_likes WHERE photo_key IN (${placeholders})`)
        .bind(...ids)
        .all();
      for (const row of res.results ?? []) {
        counts[String(row.photo_key)] = Number(row.likes ?? 0);
      }
      return counts;
    },

    async toggle(photoKey: string, voterHash: string) {
      await ensure();
      const existing = await db
        .prepare('SELECT 1 AS one FROM photo_like_votes WHERE photo_key = ? AND voter_hash = ?')
        .bind(photoKey, voterHash)
        .first();
      if (existing) {
        await db.batch([
          db
            .prepare('DELETE FROM photo_like_votes WHERE photo_key = ? AND voter_hash = ?')
            .bind(photoKey, voterHash),
          db
            .prepare(
              'UPDATE photo_likes SET likes = CASE WHEN likes > 0 THEN likes - 1 ELSE 0 END WHERE photo_key = ?'
            )
            .bind(photoKey),
        ]);
        const row = await db
          .prepare('SELECT likes FROM photo_likes WHERE photo_key = ?')
          .bind(photoKey)
          .first();
        return { likes: Number(row?.likes ?? 0), liked: false };
      }
      const recent = await db
        .prepare(
          "SELECT COUNT(*) AS n FROM photo_like_votes WHERE voter_hash = ? AND created_at > strftime('%s','now') - 3600"
        )
        .bind(voterHash)
        .first();
      if (Number(recent?.n ?? 0) >= VOTES_PER_HOUR) throw new RateLimitedError();
      await db.batch([
        db
          .prepare('INSERT OR IGNORE INTO photo_like_votes (photo_key, voter_hash) VALUES (?, ?)')
          .bind(photoKey, voterHash),
        db
          .prepare(
            'INSERT INTO photo_likes (photo_key, likes) VALUES (?, 1) ON CONFLICT(photo_key) DO UPDATE SET likes = likes + 1'
          )
          .bind(photoKey),
      ]);
      const row = await db
        .prepare('SELECT likes FROM photo_likes WHERE photo_key = ?')
        .bind(photoKey)
        .first();
      return { likes: Number(row?.likes ?? 1), liked: true };
    },
  };
}

/** Backend local dev: better-sqlite3 sobre ./data/foto-likes.db (auto-creado). */
async function localStore(): Promise<LikesStore> {
  // Import dinámico: nunca se empaqueta ni se ejecuta en Workers.
  const mod = (await import(/* @vite-ignore */ 'better-sqlite3')) as unknown as {
    default: new (path: string) => {
      exec(sql: string): void;
      prepare(q: string): {
        all(...args: unknown[]): Array<Record<string, unknown>>;
        get(...args: unknown[]): Record<string, unknown> | undefined;
        run(...args: unknown[]): unknown;
      };
    };
  };
  const dbPath =
    process.env.PCFC_LIKES_DB || new URL('../../data/foto-likes.db', import.meta.url).pathname;
  const db = new mod.default(dbPath);
  db.exec(SCHEMA);

  return {
    async getCounts(keys: string[]) {
      const ids = [...new Set(keys)].slice(0, MAX_IDS);
      const counts: Record<string, number> = {};
      for (const k of ids) counts[k] = 0;
      if (ids.length === 0) return counts;
      const placeholders = ids.map(() => '?').join(',');
      const rows = db
        .prepare(`SELECT photo_key, likes FROM photo_likes WHERE photo_key IN (${placeholders})`)
        .all(...ids);
      for (const row of rows) counts[String(row.photo_key)] = Number(row.likes ?? 0);
      return counts;
    },

    async toggle(photoKey: string, voterHash: string) {
      const existing = db
        .prepare('SELECT 1 AS one FROM photo_like_votes WHERE photo_key = ? AND voter_hash = ?')
        .get(photoKey, voterHash);
      if (existing) {
        db.prepare('DELETE FROM photo_like_votes WHERE photo_key = ? AND voter_hash = ?').run(
          photoKey,
          voterHash
        );
        db.prepare(
          'UPDATE photo_likes SET likes = CASE WHEN likes > 0 THEN likes - 1 ELSE 0 END WHERE photo_key = ?'
        ).run(photoKey);
        const row = db.prepare('SELECT likes FROM photo_likes WHERE photo_key = ?').get(photoKey);
        return { likes: Number(row?.likes ?? 0), liked: false };
      }
      const recent = db
        .prepare(
          "SELECT COUNT(*) AS n FROM photo_like_votes WHERE voter_hash = ? AND created_at > strftime('%s','now') - 3600"
        )
        .get(voterHash);
      if (Number(recent?.n ?? 0) >= VOTES_PER_HOUR) throw new RateLimitedError();
      db.prepare(
        'INSERT OR IGNORE INTO photo_like_votes (photo_key, voter_hash) VALUES (?, ?)'
      ).run(photoKey, voterHash);
      db.prepare(
        'INSERT INTO photo_likes (photo_key, likes) VALUES (?, 1) ON CONFLICT(photo_key) DO UPDATE SET likes = likes + 1'
      ).run(photoKey);
      const row = db.prepare('SELECT likes FROM photo_likes WHERE photo_key = ?').get(photoKey);
      return { likes: Number(row?.likes ?? 1), liked: true };
    },
  };
}

let localCache: LikesStore | null = null;

/** D1 si hay binding; si no, sqlite local (solo dev). */
export async function getLikesStore(d1binding: unknown): Promise<LikesStore> {
  if (d1binding) return d1Store(d1binding as Parameters<typeof d1Store>[0]);
  if (!localCache) localCache = await localStore();
  return localCache;
}
