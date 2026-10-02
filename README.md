# Punta Cana FC — Sitio Web Oficial

Sitio web de la academia Punta Cana FC. **Astro 7 en modo SSR** + **EmDash CMS 0.36** + **Tailwind CSS v4**.

- Producción: `https://puntacanafc.com` (Cloudflare Workers + D1 `pcfc-db` + R2 `pcfc-media`)
- Desarrollo: Node standalone + SQLite `data/emdash.db`, admin en `http://localhost:4321/_emdash/admin`

## Stack real

| Capa | Tecnología | Detalle verificado |
|---|---|---|
| Framework | Astro 7 (`output: 'server'`) | SSR obligatorio — EmDash expone endpoints `/_emdash/*` |
| CMS | EmDash 0.36 (`emdash/astro`) | Admin UI en `/_emdash/admin`; schemas Astro en `src/content.config.ts` |
| Admin UI | React 19 | Requerido **antes** de EmDash en `astro.config.mjs` |
| Estilos | Tailwind CSS v4 (plugin Vite) | Sin config JS; utilidades + `src/styles/global.css` |
| Dev adapter | `@astrojs/node` (`mode: standalone`) | Activo cuando `DEPLOY_TARGET != 'cloudflare'` |
| Prod adapter | `@astrojs/cloudflare` (`imageService: 'cloudflare-binding'`) | Sharp no corre en Workers; imágenes vía binding `IMAGES` |
| DB dev | SQLite `data/emdash.db` | Vía `sqlite()` de `emdash/db`; media local en `data/media` |
| DB prod | D1 `pcfc-db` (binding `DB`) | Storage R2 `pcfc-media` (binding `MEDIA`) — ver `wrangler.jsonc` |
| Likes fotos | `data/foto-likes.db` (dev) / D1 (prod) | `src/lib/foto-likes-db.ts`; migración `migrations/0003_photo_likes.sql` |
| Feed en vivo | FutbolPro Academy | `PUBLIC_ACADEMY_API_URL` (default en código: `https://app.puntacanafc.com`) |
| Email formularios | Cloudflare Email Service (binding `SEB`) | Sponsors + inscripción; en dev local solo log en consola |
| Plugin propio | `plugins/pcfc-media-gallery` | Widget galería multi-imagen (`pcfc-media-gallery:gallery`) para `match_photos.images` |

## Quickstart

```bash
pnpm install
cp .env.example .env
pnpm dev            # http://localhost:4321
```

| Acción | Comando |
|---|---|
| Dev (background) | `astro dev --background` · `astro dev status` · `astro dev logs` · `astro dev stop` |
| Admin CMS | `http://localhost:4321/_emdash/admin` (auth `dev` salvo `NODE_ENV=production`) |
| Verificación pre-commit | `pnpm verify` (= `bash scripts/verify.sh`: check + lint + format:check + build) |
| Tipos | `pnpm check` |
| Sync galerías desde feed | `pnpm sync:match-photos` |
| Convertir a WebP | `pnpm images:webp` (`--dir=... --max=2000 --quality=82 --replace`) |
| Build + deploy prod | `pnpm deploy:cf` (= `build:cf` con `DEPLOY_TARGET=cloudflare` + `wrangler deploy`) |

> **Secrets de prod** (`PLATFORM_API_KEY`, `EMDASH_ENCRYPTION_KEY`, …) van con
> `wrangler secret put <NOMBRE>`. Nunca en plaintext ni commiteados.

## Estructura de carpetas

```
├── astro.config.mjs          # SSR + adapter dual (node dev / cloudflare prod) + EmDash
├── wrangler.jsonc            # Workers + D1 pcfc-db + R2 pcfc-media + routes puntacanafc.com
├── src/content.config.ts     # Schemas Zod de las 9 content collections de Astro
├── src/content/              # Contenido local file-based (blog, categories, hero, …)
├── src/pages/                # Rutas (index, calendario, fotos, blog, inscribete, tienda, …)
│   └── api/                  # contacto-patrocinio, inscripcion, inscripcion-plataforma,
│                             # foto-likes, foto-descarga
├── src/components/           # Compartidos: PageHero, FinalCta, SedeCards, CategoryList,
│   │                         # TwoColMedia, CardGrid, Sponsors, Reveal, SectionHeader, …
│   └── inscribete/           # WizardForm, ProcessSteps, TrustSignals
├── src/lib/                  # academy-feed.ts (feed + lectores EmDash), fotos-posts.ts,
│                             # match-photos.ts (slugs), foto-likes-db.ts, content.ts
├── src/data/                 # Fallbacks estáticos: homeData.ts, fixtures.ts, sedes.ts
├── src/assets/               # Fotos y logos propios (sponsors, gallery, players, facilities)
├── plugins/pcfc-media-gallery/ # Widget de galería vendorizado como código propio
├── scripts/                  # Vivos: build-pcfc-gallery-admin, sync-match-photos,
│   │                         # convert-to-webp, verify.sh, emdash-db.mjs,
│   │                         # provision-fase2-collections.mjs
│   └── archive/              # Scripts de un solo uso ya ejecutados (no borrar historia)
├── migrations/               # SQL D1 (p. ej. 0003_photo_likes.sql)
├── data/                     # SQLite dev (emdash.db, foto-likes.db) + media local — NO commitear
├── docs/                     # GUIA-CLIENTE.md, ARQUITECTURA.md, contratos y auditorías
│   └── archive/              # Reportes históricos de sprints cerrados
├── DESIGN.md / MANUAL-DE-MARCA.md  # Sistema de diseño y marca (fuente de verdad visual)
└── .env.example              # Plantilla de variables (leer para la matriz en docs/ARQUITECTURA.md)
```

## Colecciones y de dónde viene cada dato

Hay **dos sistemas de contenido** conviviendo:

**A) Content collections Astro** (`src/content/`, schemas en `src/content.config.ts`):
`blog`, `calendar` (next + past-*.json), `categories`, `club-history`, `gallery`,
`hero`, `next-match`, `players`, `stats-pillars`.

**B) Colecciones EmDash en DB** (admin `/_emdash/admin`, declaradas en `.emdash/schema.json`):
`hero`, `categories`, `gallery`, `sponsors`, `stats_pillars`, `match_photos` (canónica
para galerías, con flag `show_in_hero`), `players`.
La DB dev además contiene `staff`, `products`, `faqs`, `partidos` (legacy) y `teams`
(ver discrepancias en `docs/ARQUITECTURA.md`): existen pero **ninguna página las lee**.

### Tabla página → fuente

| Página | Fuente primaria | Fallback |
|---|---|---|
| `/` (index) | EmDash vivo (`match_photos`, `players`, `hero`, `categories` vía `academy-feed.ts`) + feed Academy (upcoming/played) | `src/data/homeData.ts` + `public/images/fotos-fallback/` |
| `/calendario` | Feed Academy en vivo (`fetchAcademyFeed`) + galerías publicadas | `src/content/calendar/*.json` + `src/data/fixtures.ts` |
| `/fotos`, `/fotos/todas` | EmDash `match_photos` publicadas con fotos (`fotos-posts.ts`) + likes (`foto-likes-db.ts`) | Pool local `public/images/fotos-fallback/fb-*.webp` |
| `/blog`, `/blog/[slug]` | `getCollection('blog')` → `src/content/blog/*.md` | — (file-based, sin fallback) |
| `/inscribete` | `WizardForm` → `POST /api/inscripcion` y `/api/inscripcion-plataforma` → plataforma (`PLATFORM_URL`) | Log en consola sin binding `SEB`; sedes desde `src/data/sedes.ts` |
| `/categorias`, `/area-deportiva` | EmDash `categories` en vivo | Contenido local `src/content/categories/` |
| `/club` | `src/content/club-history/` + assets propios | Texto inline en la página |
| `/tienda` | Hardcodeado en la página | — (no lee colección `products`) |
| `/sponsors` | `getSponsorsData()` (`homeData.ts`) + formulario → `/api/contacto-patrocinio` | Logos en `src/assets/sponsors/` |
| `/jugadores`, `/padres` | EmDash `players` / contenido inline | `src/content/players/*.json` |

Prioridad general: **EmDash vivo → feed Academy → contenido local `src/content/` → `homeData.ts`**.
Las páginas nunca tumban por una fuente caída (cada fuente lleva `.catch` con respaldo).

## Scripts vivos (`scripts/`)

| Script | Comando | Qué hace |
|---|---|---|
| `build-pcfc-gallery-admin.mjs` | (auto en `build`/`build:cf`) | Compila el admin del widget galería a JSX-runtime de producción (evita `_jsxDEV is not a function`) |
| `sync-match-photos.mjs` | `pnpm sync:match-photos` | Crea drafts de galería por partido jugado del feed — ⚠️ escribe en `partidos`, ver discrepancia en ARQUITECTURA.md |
| `convert-to-webp.mjs` | `pnpm images:webp` | JPG/PNG → WebP (max 2000px, q82) |
| `verify.sh` | `pnpm verify` | check + lint + format:check + build + archivos críticos |
| `emdash-db.mjs` | (librería) | `openRepo()` compartido: abre `data/emdash.db` con kysely+better-sqlite3 |
| `provision-fase2-collections.mjs` | manual una vez | Crea `staff/products/faqs` en DB si faltan (idempotente) |

El resto vive en `scripts/archive/` (un solo uso, histórico).

## Documentos

- `DESIGN.md`, `MANUAL-DE-MARCA.md` — sistema de diseño y marca (no tocar sin brief).
- `docs/GUIA-CLIENTE.md` — qué puede editar el cliente en el admin.
- `docs/ARQUITECTURA.md` — decisiones (ADR) + matriz env/secrets + discrepancias conocidas.
- `docs/archive/` — reportes de sprints cerrados (solo lectura).
- `docs/convocatorias-api-contract.md` — contrato API convocatorias (vigente, no mover).
