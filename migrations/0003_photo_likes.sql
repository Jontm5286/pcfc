-- 0003_photo_likes.sql — PCFC
-- Conteos de likes por foto + votos anti-doble-voto (freno casual, sin cuentas).
--
-- photo_key = "<slug-de-galería>:<índice>" (ver src/lib/foto-likes-key.ts).
-- voter_hash = sha256(ip + user-agent), no reversible.
--
-- Local:  npx wrangler d1 execute pcfc-db --local --file=migrations/0003_photo_likes.sql
-- Prod:   SOLO con OK explícito del usuario (prohibido aplicar sin pedir).

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
