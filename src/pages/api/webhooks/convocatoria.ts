import type { APIRoute } from 'astro';
import { buildMatchSlug } from '../../../lib/match-photos';
import { resolveD1Binding } from '../../../lib/foto-likes-db';
import { readEnv } from '../../../lib/worker-env';

export const prerender = false;

/**
 * POST /api/webhooks/convocatoria — receptor del webhook de nueva convocatoria.
 * ============================================================================
 * CONTRATO
 * - URL producción: https://puntacanafc.com/api/webhooks/convocatoria
 * - Método: POST con Content-Type: application/json.
 * - Payload: { academy_id, equipos, fecha, sede?, categoria?, slug? }
 *   academy_id/equipos/fecha son requeridos (400 si faltan).
 *   equipos: [local, visitante] | {home,away}/{local,visitante} |
 *   "Local vs Visitante" | planos home_team/away_team
 *   (aliases legacy: team1/team2/matchDate/venue/category).
 *   fecha: YYYY-MM-DD (se acepta ISO, se usan los 10 primeros chars).
 *   Si no trae slug se calcula con buildMatchSlug(local, visitante, fecha)
 *   (src/lib/match-photos.ts, el mismo algoritmo de scripts/sync-match-photos.mjs).
 *   Si trae slug debe coincidir con el calculado (400 si no).
 *   sede/categoria se guardan tal cual en los campos `sede`/`categoria`.
 * - Firma: HMAC-SHA256 del body CRUDO (bytes tal cual llegan), en hex,
 *   en el header `x-pcfc-signature` (se acepta con o sin prefijo `sha256=`).
 *   Comparación timing-safe contra WEBHOOK_SECRET. Sin firma válida → 401.
 * - Respuestas: 201 {ok:true, slug} creado · 200 {ok:true, dedup:true, slug}
 *   si el slug ya existe (idempotente, no duplica) · 400 payload inválido ·
 *   401 firma inválida/ausente · 405 método no POST · 500 error interno o
 *   secreto no configurado.
 * - El draft queda con status 'draft' en la colección EmDash `match_photos`,
 *   visible en /_emdash/admin para subir fotos y publicar.
 *
 * NOTA DE ESQUEMA: `academy_id`, `categoria` y `sede` existen como campos
 * de la colección `match_photos` (ver scripts/add-academy-link-fields.mjs:
 * agrega los campos al registro EmDash y las columnas a `ec_match_photos`;
 * en prod el dueño aplica el SQL que imprime ese script). El payload usa
 * `sede`/`categoria` (aliases legacy `venue`/`category`) y aquí se guardan
 * en los campos `sede`/`categoria`. El enlace de /calendario funciona por `academy_id` y por
 * fallback al slug (determinista).
 *
 * SECRETO (dueño, NO ejecutar desde este repo — un solo comando en tu máquina):
 *   wrangler secret put WEBHOOK_SECRET
 * El secreto se lee SOLO de env (Worker env → import.meta.env → process.env
 * vía src/lib/worker-env.ts). Jamás se loguea el secreto ni el body completo.
 *
 * FALLBACK MANUAL: `pnpm sync:match-photos` sigue vigente (recorre el feed y
 * crea los mismos drafts; es idempotente por slug).
 *
 * CURL (firma = HMAC-SHA256 hex del body crudo con el secreto):
 *   export WEBHOOK_SECRET=[REDACTED]
 *   BODY='{"academy_id":"conv-2026-08-09-sub13","equipos":["PCFC Sub-13","Casa España"],"fecha":"2026-08-09","sede":"Cancha Principal","categoria":"Sub-13"}'
 *   S=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | awk '{print $NF}')
 *   curl -s -X POST http://localhost:4321/api/webhooks/convocatoria \
 *     -H 'Content-Type: application/json' -H "x-pcfc-signature: $S" \
 *     -d "$BODY"
 * # Esperado: {"ok":true,"slug":"...","academy_id":"conv-2026-08-09-sub13"} (201)
 * # Repetirlo → {"ok":true,"dedup":true,...} (200, no duplica)
 */

const TABLE = 'ec_match_photos';
const SIGNATURE_HEADER = 'x-pcfc-signature';
const DATE_PREFIX_RE = /^\d{4}-\d{2}-\d{2}/;

/** ULID compacto (mismo formato de ids que ContentRepository). */
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
function ulidLocal(): string {
  let t = Date.now();
  let s = '';
  for (let i = 0; i < 10; i++) {
    s = CROCKFORD[t % 32] + s;
    t = Math.floor(t / 32);
  }
  const rnd = new Uint8Array(16);
  crypto.getRandomValues(rnd);
  for (const b of rnd) s += CROCKFORD[b % 32];
  return s;
}

interface D1Binding {
  prepare(q: string): {
    bind(...args: unknown[]): {
      first(): Promise<Record<string, unknown> | null>;
      run(): Promise<unknown>;
    };
  };
}

/** D1 del request (prod): helper probado en src/lib/foto-likes-db.ts. */

interface LocalDb {
  prepare(q: string): {
    get(...args: unknown[]): Record<string, unknown> | undefined;
    run(...args: unknown[]): unknown;
  };
}

/** Dev local: misma SQLite que lee el admin (data/emdash.db). */
async function openLocalDb(): Promise<LocalDb> {
  const mod = (await import(/* @vite-ignore */ 'better-sqlite3')) as unknown as {
    default: new (path: string) => LocalDb;
  };
  const dbPath = new URL('../../../../data/emdash.db', import.meta.url).pathname;
  return new mod.default(dbPath);
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length || a.length === 0) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmacHex(secret: string, rawBody: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function str(v: unknown, max = 200): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

export const POST: APIRoute = async ({ request, locals }) => {
  // 1) Firma HMAC-SHA256 del body crudo.
  const secret = await readEnv('WEBHOOK_SECRET');
  if (!secret) return json({ ok: false, error: 'webhook_no_configurado' }, 500);
  const rawBody = await request.text();
  const provided = (request.headers.get(SIGNATURE_HEADER) || '')
    .trim()
    .toLowerCase()
    .replace(/^sha256=/, '');
  if (!/^[0-9a-f]{64}$/.test(provided)) return json({ ok: false, error: 'firma_invalida' }, 401);
  const expected = await hmacHex(secret, rawBody);
  if (!timingSafeEqual(provided, expected)) {
    return json({ ok: false, error: 'firma_invalida' }, 401);
  }

  // 2) JSON + campos requeridos.
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: 'json_invalido' }, 400);
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return json({ ok: false, error: 'json_invalido' }, 400);
  }
  const academyId = str(body.academy_id, 120);
  // Equipos: array [local, visitante] | objeto {home,away}/{local,visitante} |
  // string "A vs B" | planos home_team/away_team (aliases team1/team2).
  const eq = body.equipos;
  let team1 = '';
  let team2 = '';
  if (Array.isArray(eq) && eq.length >= 2) {
    team1 = str(eq[0]);
    team2 = str(eq[1]);
  } else if (eq && typeof eq === 'object') {
    const o = eq as Record<string, unknown>;
    team1 = str(o.home ?? o.local ?? o.home_team);
    team2 = str(o.away ?? o.visitante ?? o.away_team);
  } else if (typeof eq === 'string' && eq.includes(' vs ')) {
    [team1, team2] = eq.split(' vs ').map((s) => s.trim());
  } else {
    team1 = str(body.team1 ?? body.home_team ?? body.home ?? body.local);
    team2 = str(body.team2 ?? body.away_team ?? body.away ?? body.visitante);
  }
  const matchDate = str(body.fecha ?? body.matchDate, 40);
  const venue = str(body.sede ?? body.venue ?? body.location);
  const category = str(body.categoria ?? body.category, 120);
  if (!academyId || !team1 || !team2 || !matchDate) {
    return json(
      {
        ok: false,
        error: 'faltan_campos',
        requeridos: ['academy_id', 'equipos (local + visitante)', 'fecha (YYYY-MM-DD)'],
      },
      400,
    );
  }
  if (!DATE_PREFIX_RE.test(matchDate) || Number.isNaN(Date.parse(matchDate))) {
    return json({ ok: false, error: 'fecha_invalida' }, 400);
  }

  // 3) Slug: calculado con el algoritmo canónico; si viene, debe coincidir.
  const expectedSlug = buildMatchSlug(team1, team2, matchDate);
  const givenSlug = str(body.slug, 200).toLowerCase();
  if (givenSlug && givenSlug !== expectedSlug) {
    return json({ ok: false, error: 'slug_no_coincide', slug: expectedSlug }, 400);
  }
  const slug = expectedSlug;

  // 4) Escritura directa en la tabla que lee el admin de producción:
  //    D1 (binding del request) en prod, data/emdash.db en dev local.
  //    Se usa SQL directo porque `getDb` no es export público de 'emdash'
  //    y ContentRepository exige el esquema completo del runtime.
  try {
    const fecha = matchDate.slice(0, 10);
    const name = `${team1} vs ${team2}`;
    const now = new Date().toISOString();
    const id = ulidLocal();
    const row = [id, slug, now, now, slug, name, team1, team2, fecha, academyId, category || null, venue || null, null];

    const d1 = (await resolveD1Binding(locals)) as D1Binding | null;
    if (d1) {
      const existing = (await d1
        .prepare(`SELECT id, slug FROM ${TABLE} WHERE slug = ? AND deleted_at IS NULL LIMIT 1`)
        .bind(slug)
        .first()) as { id: string; slug: string } | null;
      if (existing) return json({ ok: true, dedup: true, slug, academy_id: academyId }, 200);
      await d1
        .prepare(
          `INSERT INTO ${TABLE}
           (id, slug, status, created_at, updated_at, published_at, version, locale, translation_group,
            name, home_team, away_team, date, images, academy_id, categoria, sede, partido)
           VALUES (?, ?, 'draft', ?, ?, NULL, 1, 'en', ?, ?, ?, ?, ?, '[]', ?, ?, ?, ?)`,
        )
        .bind(...row)
        .run();
      return json({ ok: true, slug, academy_id: academyId }, 201);
    }

    let db: LocalDb;
    try {
      db = await openLocalDb();
    } catch {
      return json({ ok: false, error: 'webhook_no_configurado' }, 500);
    }
    const existing = db
      .prepare(`SELECT id, slug FROM ${TABLE} WHERE slug = ? AND deleted_at IS NULL LIMIT 1`)
      .get(slug) as { id: string; slug: string } | undefined;
    if (existing) return json({ ok: true, dedup: true, slug, academy_id: academyId }, 200);
    db.prepare(
      `INSERT INTO ${TABLE}
       (id, slug, status, created_at, updated_at, published_at, version, locale, translation_group,
        name, home_team, away_team, date, images, academy_id, categoria, sede, partido)
       VALUES (?, ?, 'draft', ?, ?, NULL, 1, 'en', ?, ?, ?, ?, ?, '[]', ?, ?, ?, ?)`,
    ).run(...row);
    // Solo slug + resultado: jamás secreto ni body.
    return json({ ok: true, slug, academy_id: academyId }, 201);
  } catch {
    return json({ ok: false, error: 'error_interno' }, 500);
  }
};

export const ALL: APIRoute = async () => json({ ok: false, error: 'metodo_no_permitido' }, 405);
