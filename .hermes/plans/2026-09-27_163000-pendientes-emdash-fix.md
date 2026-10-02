# Plan: EmDash Schema↔DB Sync + Seed Fix + Registry Patch (2026-09-27)

## Goal
Sincronizar las 11 colecciones de `.emdash/schema.json` con la base de datos `data/emdash.db` (actualmente solo `_emdash_collections` tiene 2 filas: "equipos","partidos"), registrar el seed generado, y estabilizar todo para que el content loader de EmDash sirva `getCollection("players")`, `getCollection("sponsors")`, etc. sin resets.

## Current context / assumptions
- Repo: `/Users/johantavarez/Desktop/pcfc/punta-cana-fc` (Astro 7.3.1 + Emdash 0.36.0).
- `data/emdash.db`: tablas existentes `ec_equipos` (2 rows), `ec_partidos` (10 rows), `_emdash_collections` (2 rows, sólo "equipos"+"partidos" — no son collections del schema real).
- `.emdash/schema.json`: 11 collections con fields en camelCase (`ctaPrimary`, `homeId`, `homeScore`, `awayScore`, `homeTeam`, `awayTeam`).
- `emdash seed` CLI usa `arquero`/`valibad` validator que requiere field slugs `^\w[\w]*$` (solo minúsculas, números, underscore, **NO camelCase**).
- El error exacto: `collections[0].fields[3].slug: must start with a letter and contain only lowercase letters, numbers, and underscores` (afecta `ctaPrimary`→`cta_primary`, etc.).
- El seed debe normalizar a snake_case **antes** de pasar a `emdash seed`.
- Dev server live en localhost:4321 (200). No tocar `hero`/`categories`/`stats_pillars` SVGs reales.
- `value_pillars` + `pathway_cards` NO están en schema.json de este proyecto → excluir del seed (no son collections del admin web).

## Architecture / proposed approach
1. Generar `seed.json` con un script Python (`/tmp/seedgen.py`) que: lea `.emdash/schema.json`, itere collections (excluye `value_pillars`/`pathway_cards` si existieran), **convierta cada field slug a snake_case** (`ctaPrimary`→`cta_primary`, `homeScore`→`home_score`), preserve `label`, `type`, `options`, `required`.
2. `--validate` el seed; si passa, ejecutar `emdash seed .emdash/seed.json --database=./data/emdash.db --on-conflict=skip` (real, no `--validate`).
3. Verificar DB: `SELECT count(*) FROM _emdash_collections` → 11; `SELECT slug` → lista completa.
4. Para el reset-on-restart: investigar si `.env`/`EMDASH_DATABASE_URL` apunta a `/tmp` o a un miniflare D1 shadow que reinicia → confirmar que `data/emdash.db` es el path estable.
5. `registry.ts` parcheado: si el fix está perdido en `node_modules/`, re-aplicarlo + crear `patches/emdash-registry.patch` (pnpm patch-commit) — se trata de la línea ~480-600 del registry que crea tablas `ec_<slug>`.

## Step-by-step tasks

### 1. Generar seed.json con snake_case fields
- **Archivo**: `/tmp/seedgen.py` (existe, con el bug del camelCase — debe normalizar).
- **Fix**: reemplazar en `seedgen.py` la línea `fslug = f.get("slug") or f.get("name")` con:
```python
import re
def to_snake(name):
    s = re.sub(r'([a-z0-9])([A-Z])', r'\1_\2', name)
    return s.replace('-', '_').lower()
...
fslug = to_snake(f.get("slug") or f.get("name"))
```
- **Comando**: `python3 /tmp/seedgen.py` → output esperado: `OK: 11 collections -> ['hero','categories','club_history','calendar','next_match','gallery','sponsors','stats_pillars','teams','partidos','match_photos']`

### 2. Validar seed generado
- **Comando**: `node_modules/.bin/emdash seed .emdash/seed.json --database=./data/emdash.db --validate --no-content --on-conflict=skip`
- **Expected output** (success): `✓ Seed file is valid` o `Validation passed` (sin ERROR).
- Si falla → revisar regex del validator con `grep -n "must start with a letter" node_modules/emdash/src/seed/validate.ts` para confirmar la regla exacta.

### 3. Aplicar seed a la DB
- **Comando**: `node_modules/.bin/emdash seed .emdash/seed.json --database=./data/emdash.db --on-conflict=skip`
- **Expected output**: `✓ Seeded N collections to database` (N=11) o `✓ Applied seed`.
- **Verificación**:
```sh
sqlite3 data/emdash.db "SELECT slug FROM _emdash_collections;" | tr '\n' ' '
# esperado: hero categories club_history calendar next_match gallery sponsors stats_pillars teams partidos match_photos
sqlite3 data/emdash.db "SELECT count(*) FROM _emdash_collections;"
# esperado: 11
```

### 4. Verificar content loader (getCollection funciona)
- **Verificación**: curl el endpoint dev o corre Astro build de preview para comprobar que `getCollection("sponsors")` devuelve datos. Comando:
```sh
curl -s http://localhost:4321/ | grep -o '<div class="sponsor[^"]*"' | head -3
# esperado: al menos 1 match (el sponsor sembrado "Grupo Duplax")
```

### 5. Diagnosticar reset-on-restart de la DB
- **Comando (read-only)**: `grep -rn "EMDASH_DATABASE\|data/emdash.db\|data.db" .env* astro.config.mjs 2>/dev/null`
- **Expected**: `.env` debe contener `EMDASH_DATABASE_URL="file:./data/emdash.db"`.
- Si apunta a `/tmp` o a un path de miniflare → corregir a `./data/emdash.db` relativo al repo root.
- **Verificación de estabilidad**: anotar `PRAGMA integrity_check` + row count → reiniciar dev server → comparar (debe ser idéntico).

### 6. Parche registry.ts persistente (solo si el fix está perdido)
- **Archivo**: `node_modules/emdash/src/schema/registry.ts` líneas ~480-600.
- **Acción**: si el parche aplicado previamente (FIELD_UPDATE o snake_case normalization) está ausente → aplicar hotfix + `pnpm patch-commit emdash`.
- **Comando**: `grep -n "FIELD_UPDATE\|normalizeField\|field.*slug" node_modules/emdash/src/schema/registry.ts | head` → si no aparece el fix, crear `patches/emdash-registry.patch`.
- **Verificación**: `grep -c "<patrón>" node_modules/emdash/src/schema/registry.ts` > 0 después de `pnpm install`.

### 7. Feed de convocatorias respaldo 2A (solo si sigue vacío)
- **Archivo**: `src/lib/academy-feed.ts` — envolver `fetchAcademyFeed` en try/catch.
- Si `upcoming`/`played` vacíos → usar fallback estático en `src/data/academy-data.ts`.
- **Comando de test**: apuntar `ACADEMY_API_URL` a un endpoint que devuelva `{"upcoming":[],"played":[]}` → `getNextMatchData()` debe devolver partido estático.

## Tests / validation (read-only por tarea)
1. **Seed validates**: `emdash seed ... --validate` → 0 errores.
2. **DB registro**: `sqlite3 _emdash_collections` → 11 slugs esperados.
3. **DB estable**: row counts idénticos antes/después de reiniciar dev server.
4. **registry patch persiste**: `grep` post-`pnpm install` confirma el fix.
5. **getCollection funciona**: `curl localhost:4321 | grep sponsor` > 0.

## Risks, tradeoffs, open questions
- **Riesgo seed**: si `--on-conflict=skip` salta las 9 nuevas collections (porque ya existen tablas `ec_*` parcialmente), puede dejar `_emdash_collections` incompleto → usar `--on-conflict=update` como fallback.
- **Tradeoff**: sembrar contenido mínimo (4 jugadores, 1 sponsor) vs. sembrar solo collections (sin entries) y dejar el admin rellenar. Propuesta: sembrar solo collections (no content entries) → admin web edita después.
- **Open question**: el `ec_equipos`/`ec_partidos` son legacy tables creadas manualmente, no collections EmDash. ¿Las borro de `_emdash_collections` o las dejo? Recomendación: borrarlas de `_emdash_collections` (no son schema-valid) y volver a registrar las 11 reales. Comando: `sqlite3 data/emdash.db "DELETE FROM _emdash_collections WHERE slug IN ('equipos','partidos');"`.
- **Open question**: el miniflare D1 en `.wrangler/state/v3/d1/` shadowea la DB? Ver tarea 5.
- **Risk registry**: el patch `FIELD_UPDATE` era para un issue específico (no visto en el snapshot) — validar con `git diff` en el repo original o con el hash commit `1d642e2` para confirmar que el fix existe.
