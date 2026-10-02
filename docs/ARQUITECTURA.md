# Arquitectura PCFC — Decisiones (ADR ligero)

> Verificado contra `astro.config.mjs`, `wrangler.jsonc`, `.env.example`,
> `.emdash/schema.json`, `src/lib/*`, `src/data/*`, `src/content.config.ts` y `package.json`.

## ADR-1 — Astro SSR file-based + EmDash DB + feed Academy + fallbacks locales

**Decisión.** Cuatro capas de datos en este orden de prioridad:

1. **EmDash vivo** (DB): `match_photos`, `players`, `hero`, `categories`
   — leídos con `getEmDashCollection` en `src/lib/academy-feed.ts`.
2. **Feed Academy en vivo** (FutbolPro, sin auth, CORS abierto):
   `GET {PUBLIC_ACADEMY_API_URL}/api/public/matches` → `{ upcoming, played }`.
   Lo consumen `/calendario` y `FixturesBar`. Los grupos de la app se mapean a los
   4 niveles web (`pre | form-baja | form-alta | elite`) en `academyCategoryToWeb`.
3. **Contenido local file-based** (`src/content/`, 9 colecciones Astro con Zod en
   `src/content.config.ts`): `blog`, `calendar`, `categories`, `club-history`,
   `gallery`, `hero`, `next-match`, `players`, `stats-pillars`.
4. **Fallbacks estáticos** (`src/data/homeData.ts`, `fixtures.ts`, `sedes.ts` +
   `public/images/fotos-fallback/fb-*.webp`).

**Por qué.** El sitio es SSR (`output: 'server'`, requerido por los endpoints
`/_emdash/*`). Cada fuente externa se consume con `.catch(fallback)` (ver
`src/pages/index.astro`): **la página nunca tumba por feed o EmDash caído**.
El contenido editorial estable vive en archivos (versionable, funciona offline);
lo que cambia cada semana (partidos, fotos) vive en DB + feed.

**Consecuencia.** Hay duplicación aparente (p. ej. `players` existe en EmDash y en
`src/content/players/`): es intencional, el archivo es el respaldo.

## ADR-2 — `match_photos` canónica vs `partidos` legacy

**Decisión.** La colección canónica de galerías es **`match_photos`**
(flag `show_in_hero` alimenta el hero; widget `pcfc-media-gallery:gallery`,
máx. 50 imágenes con `alt`+`caption` por item). Slugs deterministas con
`buildMatchSlug` en `src/lib/match-photos.ts`
(`pcfc-<equipo>-vs-<rival>-<DDmmm>`, ej. `pcfc-sub10-vs-canay-24ago`).

**Contexto.** Existió una colección rival `partidos` (definición archivada en
`docs/archive/schema.partidos.json`; tabla `ec_partidos` aún en `data/emdash.db`).
El lector (`academy-feed.ts:119-123`) ya apunta a `match_photos`.

**⚠️ Discrepancia conocida (no corregir en FASE 4 — solo docs):**
`scripts/sync-match-photos.mjs` (líneas 6, 69–72) y el comentario de cabecera de
`src/lib/fotos-posts.ts` todavía nombran la colección **`partidos`**, y el script
escribe `repo.findBySlug('partidos', …)` / `type: 'partidos'`. Es decir: **lo que
genera el sync no lo lee el sitio**. Además el comentario de `match-photos.ts`
dice que el sync crea `src/content/match_photos/<slug>.md`, pero ese directorio
no existe y `match_photos` no está en `src/content.config.ts` (es solo DB).
Antes de volver a usar `pnpm sync:match-photos`, alinear script ↔ `match-photos.ts`.

## ADR-3 — Colecciones aprovisionadas sin lector (`staff`, `products`, `faqs`, `teams`)

**Hecho.** `scripts/provision-fase2-collections.mjs` creó en `data/emdash.db` las
tablas `ec_staff`, `ec_products`, `ec_faqs` (y existe `ec_teams`), pero:
ninguna está declarada en `.emdash/schema.json` (el admin muestra solo 7
colecciones: `hero`, `categories`, `gallery`, `sponsors`, `stats_pillars`,
`match_photos`, `players`) y **ninguna página las lee** (`grep` de
`getEmDashCollection` solo pide `match_photos`, `players`, `hero`, `categories`).
FAQs, tienda y staff son hoy contenido hardcodeado en código.

**Decisión.** No borrar (datos + tablas existen) y no documentar como editables.
Si se activan, alinear en este orden: `.emdash/schema.json` → `src/content.config.ts`
→ lector en `src/lib/` → `docs/GUIA-CLIENTE.md`.

## ADR-4 — Deploy dual (Node dev / Workers prod)

`astro.config.mjs` conmuta por `DEPLOY_TARGET`:

| | Dev (`pnpm dev`/`build`) | Prod (`pnpm build:cf` → `pnpm deploy:cf`) |
|---|---|---|
| Adapter | `@astrojs/node` standalone | `@astrojs/cloudflare` (`imageService: 'cloudflare-binding'`) |
| DB EmDash | SQLite `data/emdash.db` | D1 `pcfc-db` (binding `DB`) |
| Storage | `./data/media` local | R2 `pcfc-media` (binding `MEDIA`) |
| Imágenes | sharp (Node) | binding `IMAGES` (Image Resizing) |
| Auth admin | `dev` (salvo `NODE_ENV=production` → `email`) | `email` |
| Email forms | solo log en consola | Email Service (binding `SEB`) |

Rutas y dominio (`puntacanafc.com`, `www`) + vars no secret en `wrangler.jsonc`.
(NOTA: su comentario interno dice `pnpm deploy`; el script real es **`pnpm deploy:cf`**.)

## Matriz env / secrets

Fuentes: `.env.example` (plantilla) × `grep` de uso real en `src/`, `scripts/`, `astro.config.mjs`.

| Variable | Dónde se usa (verificado) | Efecto | Estado |
|---|---|---|---|
| `EMDASH_DATABASE_URL` | `astro.config.mjs:67`, `scripts/emdash-db.mjs:20` | URL SQLite dev (default `file:./data/emdash.db`) | ✅ vigente |
| `EMDASH_ENCRYPTION_KEY` | runtime EmDash | cifrado de sesiones/datos sensibles | ✅ vigente (secret en prod) |
| `PUBLIC_ACADEMY_API_URL` | `academy-feed.ts`, `sync-match-photos.mjs` | base del feed (default código `https://app.puntacanafc.com`; local `http://localhost:3001`) | ✅ vigente |
| `DEPLOY_TARGET` | `astro.config.mjs:24` | `=cloudflare` → adapter Workers + D1/R2; otro valor → Node+SQLite | ✅ vigente |
| `NODE_ENV` | `astro.config.mjs:79` (+ adapter node) | `=production` en dev-local activa auth `email` del admin | ✅ vigente (efecto: cambia modo auth) |
| `PCFC_LIKES_DB` | `src/lib/foto-likes-db.ts:140` | ruta de `foto-likes.db` (default `data/foto-likes.db`) | ✅ vigente (no está en `.env.example` — pendiente añadir) |
| `PLATFORM_URL` / `PLATFORM_API_KEY` | `src/pages/api/inscripcion-plataforma.ts` | puente web → plataforma (`POST {URL}/api/public/preinscriptions`, header `x-web-key`) | ✅ vigente (solo secrets en prod) |
| `SPONSOR_EMAIL` / `SPONSOR_FROM` | endpoint `contacto-patrocinio` + `wrangler.jsonc` vars | destino/remitente form sponsors | ✅ vigente |
| `ADMISSION_EMAIL` / `ADMISSION_FROM` | endpoint `inscripcion` + `wrangler.jsonc` vars | destino/remitente form inscripción | ✅ vigente |
| `DATABASE_URL` | **ningún uso en código** | — | ⚠️ **obsoleta** (solo plantilla; la que vale es `EMDASH_DATABASE_URL`) |
| `EMDASH_DEV_AUTH` | **ningún uso en código** | — | ⚠️ **obsoleta** (el modo auth lo decide `NODE_ENV`) |

**Discrepancia de plantilla:** `.env.example` sugiere `file:./data.db`; el default
real del código es `file:./data/emdash.db`. Vale el código. No se modifica
`.env.example` en esta fase (contrato vigente: solo lectura aquí).
