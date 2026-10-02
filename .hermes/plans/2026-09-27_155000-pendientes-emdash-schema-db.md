# Plan: Pendientes EmDash + Schema/DB (2026-09-27)

## Goal
Sincronizar el esquema de colecciones de EmDash (`.emdash/schema.json`, 11 colecciones) con la base de datos SQLite (`data/emdash.db`, actualmente solo `ec_equipos` + `ec_partidos`), eliminar el reset de la DB al reiniciar, y reparar el parche `registry.ts` que se pierde con `pnpm install`. No tocar `FEATUREDPlayers`, `Sponsors`, `FixturesBar` (ya comiteados/verdes), ni hacer deploy/commit sin OK.

## Current context / assumptions
- Astro 7.3.1 + EmDash 0.36.0 + pnpm 11.11.0 + Node v26; stack en `/Users/johantavarez/Desktop/pcfc/punta-cana-fc`.
- `.env`: `EMDASH_DATABASE_URL="file:./data/emdash.db"` y `DATABASE_URL="file:./data/emdash.db"`.
- `data/emdash.db`: solo tablas `ec_equipos` (2 rows) y `ec_partidos` (10 rows). `_emdash_collections` devuelve **0 rows** (la DB no persiste las collections definidas en schema.json). `_emdash_collections` está vacío → `getCollection("players")` en `src/pages/index.astro:71` devuelve `[]` y cae en `getFeaturedPlayersData()` estático (fallback DEV-only).
- `.emdash/seed.json`: `{"version":"1","collections":[]}` (vacío).
- `.emdash/migrations.json`: dirty / no aplicado.
- `src/lib/academy-feed.ts`: consume `https://app.puntacanafc.com/api/public/matches` → en prod `{upcoming:[],played:[]}` (0/0), en dev (puerto 3001) devuelve 1 partido.
- `node_modules/emdash/src/schema/registry.ts`: parcheado localmente (persistido en `emdash-db` fix) pero `pnpm install` lo pisa (no está en lockfile/patch).
- Dev server live en `http://localhost:4321` (200). Build prod OK (`astro build` → rc=0, `14:35:54`).

## Architecture / proposed approach
1. **Schema ↔ DB sync**: forzar a EmDash a leer `.emdash/schema.json` y crear las 11 tablas `ec_*` correspondientes en `data/emdash.db` (equipos, partidos, sponsors, categories, hero, calendar, next_match, gallery, stats_pillars, teams, match_photos). No tocar `value_pillars`/`pathway_cards` (son SVGs estáticos, no migrables). Enfoque: seed manual + migración explícita con `emdash` CLI, validar tablas, volver a poblar con datos mínimos.
2. **DB que se resetea al reiniciar**: el WAL (`-wal`, `-shm`) se regenera pero la DB base no. Causa probable: EmDash arranca con `setupComplete` y `requireLogin` en `key_value`, pero la tabla `_emdash_collections` nunca se populó → el content loader se saltea las collections. Fix: seed + migración, y confirmar `autoBackupEnabled=false` para que no haga reset sucio.
3. **Parche `registry.ts` persistente**: migrar el hotfix de `node_modules/emdash/src/schema/registry.ts` a un `pnpm` patch oficial en `patches/`, documentar el por-qué (el registry hardcodea `maxHops` o un field que choca con el schema custom).
4. **Feed de convocatorias**: respaldo activo (2A) con datos estáticos en `src/data/academy-data.ts` que respalde el `fetchAcademyFeed()` cuando la API devuelva vacío.

## Step-by-step tasks

### 1. Inspección completa de la DB (diagnóstico)
- **Comando**: `sqlite3 data/emdash.db ".tables"` → 0 filas en `_emdash_collections`.
- **Comando**: `sqlite3 data/emdash.db "SELECT slug, count(*) FROM ec_equipos UNION ALL SELECT 'partidos', count(*) FROM ec_partidos"` → equipos=2, partidos=10.
- **Comando**: `python3 -c "import json; d=json.load(open('.emdash/schema.json')); print([c['slug'] for c in d['collections']])"` → 11 slugs.
- **Verificación**: confirmar mismatch 11 (schema) vs 2 (DB real) y 0 (collections registry).

### 2. Seed manual para poblar `_emdash_collections`
- **Archivo**: `.emdash/seed.json` (actualmente `{"collections":[]}`).
- **Acción**: reescribir con las 9 colecciones migrables (excluye `value_pillars` y `pathway_cards`):
```json
{"$schema":"https://emdashcms.com/seed.schema.json","version":"1","meta":{"name":"Punta Cana FC"},"collections":[
  {"slug":"hero","values":[{"data":{"title":"PCFC Academia","subtitle":"Pasión por el Fútbol","cta_primary_href":"/inscribete"}}]},
  {"slug":"categories","values":[{"data":{"name":"Pre-Formativas","item_slug":"pre","badge":"U6-U8"}}]},
  {"slug":"club_history","values":[{"data":{"name":"Fundación PCFC","type":"fundacion","order":0}}]},
  {"slug":"sponsors","values":[{"data":{"name":"Grupo Duplax","url":"https://grupodupla.com/","published":true}}]},
  {"slug":"teams","values":[{"data":{"name":"Primera Categoría","short_name":"U15","category":"Elite y Reserva"}}]},
  {"slug":"partidos","values":[{"data":{"name":"PCFC vs Cibao","home":"PCFC","away":"Cibao","home_score":2,"away_score":1}}]},
  {"slug":"calendar","values":[{"data":{"date":"2026-09-27T16:00","kind":"partido"}}]},
  {"slug":"next_match","values":[{"data":{"date":"2026-09-27T16:00","home":"PCFC"}}]},
  {"slug":"gallery","values":[{"data":{"title":"Galería"}}]},
  {"slug":"match_photos","values":[{"data":{"name":"Partido 1"}}]},
  {"slug":"stats_pillars","values":[{"data":{"label":"+550 jugadores"}}]}
]}
```
- **Verificación**: `python3 -c "import json; d=json.load(open('.emdash/seed.json')); print(len(d['collections']))"` → 11.

### 3. Forzar sync de schema → DB
- **Comando**: detener dev server → `node node_modules/astro/bin/astro.mjs dev` (el content loader de EmDash lee `schema.json` al boot) → observar logs `[emdash]` durante 30s → verificar tablas creadas.
- **Fallback** (si EmDash no crea tablas): `sqlite3 data/emdash.db` crear manualmente `ec_sponsors`, `ec_categories`, etc. con la misma columna `status text default 'draft'` + JSON `data` para fields flex. Pero el preferido es que EmDash lo haga.
- **Verificación**: `sqlite3 data/emdash.db "SELECT count(*) FROM _emdash_collections"` → 11.

### 4. Parche registry.ts persistente (pnpm patch)
- **Archivo**: `patches/emdash-registry.patch` (nuevo).
- **Acción**: capturar el diff de `node_modules/emdash/src/schema/registry.ts` (que fixea el schema loading) → `pnpm patch-commit emdash` → persiste en `patches/`.
- **Comando**: `pnpm patch emdash` → edita → `pnpm patch-commit emdash` → `pnpm install --frozen-lockfile` (debe aplicar el patch, no sobreescibirlo).
- **Verificación**: `grep -c "<patrón del fix>" node_modules/emdash/src/schema/registry.ts` > 0 después de install.

### 5. Respaldar feed de convocatorias (ACADEMY_API_URL fallback)
- **Archivo**: `src/lib/academy-feed.ts` (líneas 1-60: interfaz + `fetchAcademyFeed`).
- **Acción**: envolver el fetch en try/catch → si `upcoming`/`played` vacíos, usar datos estáticos de `src/data/academy-data.ts`.
- **Archivo nuevo**: `src/data/academy-data.ts` con un array `staticAcademyMatches` (3 partidos placeholder, marcados `/** PLACEHOLDER MAQUETACIÓN */`).
- Verificación luego: devolver datos estáticos cuando el feed = `[]`.

### 6. Confirmar DB no se resetea
- **Comando**: arrancar dev server → anotar hashes de `ec_equipos`/`ec_partidos` → reiniciar proceso → comparar hashes (deben ser idénticos).
- **Verificación**: hashes idénticos → no hay reset. Si difieren → investigar `miniflare` env (el `.wrangler/state/v3/d1/` está activo en dev; el reset puede venir de ahí).

## Tests / validation (TDD por tarea)
1. **Collections sync**: `sqlite3 data/emdash.db "SELECT slug FROM _emdash_collections"` debe listar 11 slugs ↔ schema.json. Test: script python que compare listas.
2. **registry.ts persiste**: después de `pnpm install`, `git diff --stat` > 0 en registry → patch aplicado; sin patch, `git diff` limpio pero fix lost. Test: `grep` post-install.
3. **Feed fallback**: con `ACADEMY_API_URL` apuntando a un endpoint que devuelva `{upcoming:[],played:[]}`, `getNextMatchData()` debe devolver partido estático. Test: unitario en `src/lib/__tests__/academy-feed.test.ts` (vitest, ya existe en repo).
4. **DB estable**: reiniciar dev server 2× y comprobar row counts idénticos en `ec_equipos`/`ec_partidos`.

## Risks, tradeoffs, open questions
- **Riesgo schema→DB**: EmDash 0.36 puede requerir migración manual si `migrations.json` está dirty. En ese caso, **no fuerzar** `emdash db migrate` (podría borrar data). Prefiere seed manual + content loader.
- **Tradeoff**: sembrar `players` collection → el home pasa de `getFeaturedPlayersData()` (estático) a datos EmDash (dinámico). Si el seed no incluye jugadores featured, el home se queda vacío → **sembrar 4 jugadores mínimos** o dejar el fallback.
- **Open question**: ¿quieres sembrar datos reales de jugadores/equipos en EmDash, o prefieres mantener el fallback estático y que el admin lo rellene?
- **Open question**: el `.wrangler/state/v3/d1/` miniflare está corriendo en dev — ¿usar `emdash.db` local o el D1 remoto? Hoy `.env` apunta a local (`./data/emdash.db`), pero miniflare puede redirigir.
- **Risk registry patch**: si el patch actual en `node_modules` fue un fix puntual de schema loading (no un bug oficial), `patch-commit` puede rechazarlo si el árbol de emdash cambia. Validar con `pnpm install` antes de commitear.
