# Nav brand + Fotos (destacadas, paginador, likes) — Plan de implementación

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Añadir "Punta Cana FC" en texto junto al logo del nav (más pequeño en móvil) y reestructurar `/fotos` en destacadas + archivo paginado con contador de likes persistente.

**Architecture:** Cambio CSS/texto en `Navbar.astro`; en fotos se separa descubrimiento (`/fotos` → 8 destacadas + CTA) del archivo (`/fotos/todas` → 10 partidos por página, render server-side); los likes viven en D1 (`photo_likes` + votos anti-spam) con 2 endpoints API y un botón cliente que pinta el conteo.

**Tech Stack:** Astro 7 (SSR), D1 (`DB` binding), vanilla JS + CSS (sin framework cliente), Tailwind, Lightbox existente.

---

## Mockups (aprobar antes de codificar)

### 1. Nav — texto junto al logo

Desktop (texto ~1.05rem, blanco, semibold):

```
┌──────────────────────────────────────────────────┐
│ [ESCUDO 52px] PUNTA CANA FC    Inicio Inscríbete… │
└──────────────────────────────────────────────────┘
```

Móvil (texto ~0.85rem, una línea, sin wrap):

```
┌──────────────────────────────┐
│ [ESC.] PUNTA CANA FC      [☰] │
└──────────────────────────────┘
```

- Texto plano (no imagen), `aria-hidden` decorativo porque el `<a>` ya tiene `aria-label="Punta Cana FC — Inicio"`.
- Alto contraste: `text-white` Tailwind + fallback inline `style="color:#fff!important"` (regla del proyecto).

### 2. `/fotos` — 8 destacadas + CTA

```
HERO (igual que hoy)
─────────────────────────────────
❤️ DESTACADAS
[Etiqueta: las 8 con caption, o las 8 primeras]
┌────┐ ┌────┐ ┌────┐ ┌────┐
│ 4:5│ │ 4:5│ │ 4:5│ │ 4:5│  ← grid 2col móvil / 4col desktop (§7)
│♥ 12│ │♥ 8 │ │♥ 31│ │♥ 5 │  ← like + contador sobre cada foto
└────┘ └────┘ └────┘ └────┘  ×2 filas = 8
        [ Ver todas las fotos → ]   → /fotos/todas
```

### 3. `/fotos/todas` — archivo paginado (10 partidos/página, recientes primero)

```
HERO compacto + [← Volver a destacadas]
─────────────────────────────────
Partido A (22 fotos, con likes)   ← paginador = PARTIDOS, no fotos sueltas
Partido B (18 fotos, con likes)
…hasta 10 partidos…
─────────────────────────────────
[← Anterior]  1 · 2 · 3  [Siguiente →]
```

### 4. Botón like (estados)

```
Default:   ♡ 12        (contorno blanco/navy, según fondo)
Gustada:   ♥ 13        (relleno celeste #0098b7 + guardada en localStorage)
Hover:     escala 1.1 + tooltip "Me gusta"
```

---

## Contexto actual (verificado 2026-10-02)

- `src/components/Navbar.astro:43-48` — brand es solo `<img /Logo-PCFC.svg h-[52px]>`; desktop nav se oculta `<1024px` (menú hamburguesa + `#mobile-menu`).
- `src/pages/fotos.astro` (346 líneas) — hoy pinta **TODOS** los posts × **TODAS** las fotos inline (~8 posts / ~131 fotos): pesado y sin paginador. Fuente: `fetchPublishedGalleries()` (EmDash `partidos`) con fallback hardcodeado de 8 posts.
- `src/components/GalleryGrid.astro:25-32` — `Photo = {src, alt, width?, height?, caption?, downloadName?}`. **No hay campo `tags`** en `GalleryPhoto` (`src/lib/academy-feed.ts:156-160`) ni en `PublishedGallery` (162-176, solo `showInHero` como flag).
- API existente `src/pages/api/foto-descarga.ts` — patrón `APIRoute` + `fetchPublishedGalleries()` reutilizable para likes.
- D1 bound como `DB` en `wrangler.jsonc:8-10`; NO hay carpeta `migrations/` — ver cómo se creó el schema antes de aplicar (ver Tarea 3).
- DESIGN.md §7 (`GaleríaGrid`, línea 276) rige el grid 4:5 — **no editar DESIGN.md** (protegido).
- Prohibido `git commit` / `wrangler deploy` sin pedido explícito; backup DB+schema antes de tocar datos.

---

## Plan por tareas

### Tarea 1: Texto "Punta Cana FC" en el nav

**Objective:** El brand muestra escudo + texto plano, reducido en móvil.

**Files:**
- Modify: `src/components/Navbar.astro:46-48`

**Step 1: Editar el brand**

```astro
<a href="/" class="flex items-center gap-2.5 shrink-0 no-underline" aria-label="Punta Cana FC — Inicio">
  <img src="/Logo-PCFC.svg" alt="" aria-hidden="true" width="412" height="485" class="h-[52px] w-auto object-contain" />
  <span
    class="font-display font-bold uppercase leading-none tracking-wide text-white text-[0.85rem] sm:text-[1.05rem] whitespace-nowrap"
    style="color:#fff!important"
    aria-hidden="true"
  >Punta Cana FC</span>
</a>
```

Notas: `alt=""` en el img (el link ya nombra la marca, evita doble lectura); `whitespace-nowrap` para que no parta en móvil; el `gap-14` del header (`línea 44`) deja sitio de sobra.

**Step 2: Verificar**

```bash
curl -s http://localhost:4321/ -o /tmp/nav.html -w "HTTP %{http_code}\n"
grep -c "Punta Cana FC</span>" /tmp/nav.html   # esperado: ≥1
```

---

### Tarea 2: Helper `photoKey` + selector de destacadas

**Objective:** Clave estable por foto y función que devuelve las 8 destacadas.

**Files:**
- Create: `src/lib/foto-likes-key.ts` (o añadir a `academy-feed.ts` si el implementador lo ve más limpio — 1 sitio, DRY)

**Step 1: Implementar**

```ts
/** Clave estable de una foto para likes: "<slug>:<indice>". */
export function photoKey(gallerySlug: string, index: number): string {
  return `${gallerySlug}:${index}`;
}

/** Las 8 destacadas: primero fotos CON caption (etiquetadas), luego relleno por fecha. */
export function pickDestacadas(
  posts: { id: string; photos: { src: string; alt: string; caption?: string }[] }[],
  n = 8,
): { galleryId: string; index: number; src: string; alt: string; caption?: string }[] {
  const tagged: ReturnType<typeof pickDestacadas> = [];
  const rest: ReturnType<typeof pickDestacadas> = [];
  for (const p of posts)
    for (let i = 0; i < p.photos.length; i += 1)
      (p.photos[i].caption ? tagged : rest).push({ galleryId: p.id, index: i, ...p.photos[i] });
  return [...tagged, ...rest].slice(0, n);
}
```

**Step 2: Verificar** — importar desde un script Astro temporal o `node --experimental-strip-types` es frágil; verificación real en Tarea 6 (conteo de 8 en HTML). Smoke mínimo: `pnpm astro check` o build de la página sin errores.

---

### Tarea 3: Migración D1 `photo_likes` + votos

**Objective:** Tablas de conteo y anti-doble-voto en D1 local y documentado para prod.

**Files:**
- Create: `migrations/0003_photo_likes.sql` (si existe convención distinta — inspeccionar `wrangler.jsonc` + docs internos primero)

**Step 1: Inspeccionar cómo se aplica schema hoy** (no hay carpeta `migrations/`; EmDash pudo crear las tablas). Decidir: `wrangler d1 execute` directo vs archivo de migración.

**Step 2: SQL**

```sql
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
```

**Step 3: Verificar**

```bash
npx wrangler d1 execute puntacanafc --local --command "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'photo_like%';"
# esperado: photo_likes + photo_like_votes
```

⚠️ Backup DB+schema antes (regla del proyecto). Aplicar a prod SOLO con OK explícito del usuario.

---

### Tarea 4: `GET /api/foto-likes` — conteos en lote

**Objective:** La página pide conteos de N fotos en 1 request.

**Files:**
- Create: `src/pages/api/foto-likes.ts` (GET + POST en el mismo archivo)

```ts
// GET /api/foto-likes?ids=slug:0,slug:1 → { counts: { "slug:0": 12 } }
export const GET: APIRoute = async ({ url, locals }) => {
  const ids = (url.searchParams.get('ids') || '').split(',').map((s) => s.trim()).filter(Boolean).slice(0, 200);
  if (ids.length === 0) return Response.json({ counts: {} });
  const db = (locals as any).runtime?.env?.DB ?? (globalThis as any).DB;
  // placeholders ?,?,? + SELECT photo_key, likes WHERE photo_key IN (...)
  // fotos sin fila → 0
};
```

**Verificar:**

```bash
curl -s "http://localhost:4321/api/foto-likes?ids=a:0,a:1"   # esperado: {"counts":{"a:0":0,"a:1":0}}
```

Nota: confirmar cómo acceden a D1 los endpoints actuales en dev (`locals.runtime.env.DB` con adapter `@astrojs/cloudflare` — revisar `foto-descarga.ts` que NO usa DB; si el runtime difiere, ajustar).

---

### Tarea 5: `POST /api/foto-likes` — votar (toggle, 1 voto/persona)

**Objective:** Sumar/quitar el voto con freno a spam sin cuentas.

```ts
// POST /api/foto-likes { photo_key } → { likes: 13, liked: true }
```

- `voter_hash = sha256(ip + user-agent)` (sin secretos, hash no reversible; suficiente para freno casual).
- Transacción: si existe voto → DELETE + `likes-1`; si no → INSERT + `likes+1` (upsert en `photo_likes`).
- Rate-limit simple: máx 60 votos/hora por `voter_hash` (conteo en `photo_like_votes` por `created_at`).
- Validar `photo_key` contra galerías publicadas (`fetchPublishedGalleries`) para no votar claves inventadas. Límite: recorrer índices es O(n); aceptable (8 posts).

**Verificar:**

```bash
curl -s -X POST http://localhost:4321/api/foto-likes -H 'Content-Type: application/json' -d '{"photo_key":"test:0"}'
# → {"likes":1,"liked":true}; repetir → {"likes":0,"liked":false}
```

---

### Tarea 6: Componente cliente `LikeButton`

**Objective:** Corazón + contador reutilizable en grids y (fase 2) lightbox.

**Files:**
- Create: `src/components/LikeButton.astro` (markup + `<script>` vanilla con `data-photo-key`)
- Modify: CSS global o `<style>` del componente (estados default/liked/hover, focus visible)

Comportamiento: al hidratar, pide conteos en lote (`GET ?ids=` con todas las keys de la página, 1 request); click → optimista + POST; guarda `liked` en `localStorage` (`pcfc-like:<key>`); si el servidor dice lo contrario, corrige. Accesible: `<button aria-pressed>` + `aria-label="Me gusta esta foto (12)"`.

**Verificar:** curl cuenta botones `data-photo-key` == nº de fotos pintadas; click manual en dev suma/resta y persiste tras recargar.

---

### Tarea 7: `/fotos` → 8 destacadas + CTA

**Objective:** `/fotos` liviana: hero + grid de 8 + botón a archivo.

**Files:**
- Modify: `src/pages/fotos.astro:246-333` (sección grid + posts individuales)

Cambios: `pickDestacadas(allPosts, 8)` → `GalleryGrid` dedicado (o markup propio 2col→4col §7) con `LikeButton` por foto; CTA `Ver todas las fotos → /fotos/todas`; **eliminar** los posts individuales de esta página (se mudan a `/fotos/todas`).

**Verificar:**

```bash
curl -s http://localhost:4321/fotos -o /tmp/fotos.html -w "HTTP %{http_code}\n"
grep -c "data-photo-key" /tmp/fotos.html    # esperado: 8
grep -c "/fotos/todas" /tmp/fotos.html      # esperado: ≥1
```

Peso: comparar bytes antes/después (hoy ~todas las fotos inline).

---

### Tarea 8: `/fotos/todas` — archivo paginado 10 partidos/página

**Objective:** Navegar cientos de fotos sin cargarlas todas.

**Files:**
- Create: `src/pages/fotos/todas.astro` (o `src/pages/fotos/[pagina].astro` — preferir query `?pagina=N` para no tocar routing/file-based extra; 1 archivo)

```astro
const PAGE_SIZE = 10;
const pagina = Math.max(1, parseInt(Astro.url.searchParams.get('pagina') || '1', 10));
const totalPaginas = Math.max(1, Math.ceil(allPosts.length / PAGE_SIZE));
const page = Math.min(pagina, totalPaginas);
const posts = allPosts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
// ... hero compacto + por cada post: encabezado + GalleryGrid + LikeButton ...
// ... nav: Anterior / números / Siguiente con ?pagina=N, rel=prev/next, aria-labels ...
```

Orden: recientes primero (verificar el orden que devuelve `fetchPublishedGalleries`; si no es cronológico, ordenar por fecha antes de paginar).

**Verificar:**

```bash
for p in 1 2 99 abc; do curl -s "http://localhost:4321/fotos/todas?pagina=$p" -o /tmp/t$p.html -w "$p: HTTP %{http_code}\n"; done
grep -c "post-heading-" /tmp/t1.html   # esperado: ≤10
# p=99 → clamp a última; p=abc → página 1
```

---

### Tarea 9: Likes en `GalleryGrid` (ambas páginas)

**Objective:** Cada foto pintada lleva su `LikeButton` con `photoKey(galleryId, index)`.

**Files:**
- Modify: `src/components/GalleryGrid.astro:49-70` (nuevo prop opcional `likes?: boolean`, default `false` para no afectar home/otras vistas)

**Verificar:** `data-photo-key` count == nº de `<img>` del grid en `/fotos` y `/fotos/todas`.

---

### Tarea 10: Pase de verificación + build

- `curl` home `200` (nav texto presente), `/fotos` (8 keys), `/fotos/todas` (paginador), API GET/POST round-trip.
- `pnpm build` verde (o `pnpm build:cf` según convención del repo).
- Revisar contraste del texto del nav y del corazón sobre foto (fondo `bg-navy/70` + `style color` fallback).
- Sin commit ni deploy (esperar OK).

---

## Riesgos y decisiones

- **"Etiquetas"**: hoy no existe campo tags en EmDash `partidos`/`match_photos`; `caption` ≈ etiqueta. Fase 1 = caption-first + relleno. Si quieres etiquetado real (campo `destacada`/`tags` en EmDash), es Fase 2: requiere editar schema con admin cerrado + backup + respetar límite admin 50 vs HARD_MAX 200.
- **Votos sin cuenta**: freno casual (hash IP+UA + localStorage), no antibot real. Suficiente para ranking orientativo; documentarlo.
- **D1 en dev**: confirmar binding (`locals.runtime.env.DB`); `foto-descarga.ts` no usa DB, así que el primer endpoint con DB puede necesitar ajuste del adapter.
- **Lightbox**: los likes no entran al lightbox en Fase 1 (solo grids). Fase 2 trivial porque la key es estable.
- **Reutilización futura**: con `photo_key` estable + conteos en D1, "las más gustadas" es un `SELECT ORDER BY likes DESC LIMIT N` — dejar el query documentado en el plan, no implementarlo (YAGNI).

## Preguntas abiertas — RESUELTO 2026-10-02 ✅

1. Paginador: **10 partidos por página** ✔
2. Destacadas: **caption primero**, sin tocar EmDash ✔
3. Voto: **toggle** ✔
4. Lightbox: **solo grids en fase 1** ✔
