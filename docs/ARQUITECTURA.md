# Arquitectura PCFC — Decisiones (ADR ligero)

> Verificado contra `astro.config.mjs`, `wrangler.jsonc`, `.env.example`,
> `.emdash/seed.json`, `src/lib/*`, `src/data/*`, `src/content.config.ts` y `package.json`.

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
hasta 200 imágenes con `alt`+`caption` por item). Slugs deterministas con
`buildMatchSlug` en `src/lib/match-photos.ts`
(`pcfc-<equipo>-vs-<rival>-<DDmmm>`, ej. `pcfc-sub10-vs-canay-24ago`).

**Contexto.** Existió una colección rival `partidos` (definición archivada en
`docs/archive/schema.partidos.json`). En oct-2026 se purgaron de prod las
colecciones sin lector `partidos`, `teams`, `gallery` y `calendar` y se quitaron
de `.emdash/seed.json` para que el seed no las recree. El endpoint temporal
`POST /api/admin/purge-collection` se retiró al subir a EmDash 1.3.1: esa versión
borra colecciones nativamente (media-usage activo + `CollectionDeletionGuard`,
soportado por `@emdash-cms/cloudflare`).

**Resuelto oct-2026:** había una discrepancia (el sync nombraba `partidos`
mientras el sitio leía `match_photos`). Hoy `scripts/sync-match-photos.mjs`
escribe `match_photos` y el comentario de `match-photos.ts` está alineado.

## ADR-3 — Colecciones sin lector ocultas en el admin

**Hecho.** La DB arrastra colecciones de fases anteriores. En dev: `staff`,
`products`, `faqs`, `teams`, `calendar`, `next_match`, `club_history` y
`stats_pillars`. En prod: `partidos`, `gallery` y `equipos`.
Ninguna página las lee (solo se leen `match_photos`, `players`, `hero` y
`categories` con `getEmDashCollection`; `sponsors` se sirve estático desde
`homeData.ts`). Algunas conservan datos huérfanos (`club_history` 1, `faqs` 2,
`products` 2, `staff` 2, `stats_pillars` 4).

**Decisión.** No borrar datos: se marcan con `hidden = 1` en
`_emdash_collections` para que el admin muestre solo las 4 colecciones vivas
(+ `sponsors`, que queda visible aunque hoy no cambie el sitio). Aplicado en dev
por SQL y en prod con `wrangler d1 execute pcfc-db --remote` (reversible). Si se
activan, alinear en este orden: `.emdash/seed.json` → `src/content.config.ts`
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

## EmDash 1.3.1 (oct-2026)

- Migraciones `074`–`091` se aplican solas al arrancar (`data/emdash.db` en dev,
  D1 `pcfc-db` en prod). No requieren token ni paso manual.
- Subida nativa por carpetas en la biblioteca de medios; el widget
  `pcfc-media-gallery` ya las consume (`fetchMediaFolders`).
- CSP con `blob:` en `img-src`/`connect-src` y `media-src 'self' blob:`
  (previews y subida desde el admin).
- Borrado de colecciones nativo (ya no existe `purge-collection`).
