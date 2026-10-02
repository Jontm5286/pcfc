## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

Dev URL: `http://localhost:4321` · CMS admin: `http://localhost:4321/_emdash/admin`
(EmDash usa auth `dev` salvo `NODE_ENV=production`; DB local `data/emdash.db`).

## Comandos reales (verificados en `package.json`)

```
pnpm dev               # astro dev
pnpm verify            # bash scripts/verify.sh — check + lint + format:check + build (correr antes de commit)
pnpm check             # astro check (tipos)
pnpm lint / lint:fix   # eslint
pnpm format / format:check
pnpm sync:match-photos # node scripts/sync-match-photos.mjs (drafts de galería desde el feed Academy)
pnpm images:webp       # node scripts/convert-to-webp.mjs --dir=... (default: public/images/sponsors)
pnpm build             # build-pcfc-gallery-admin.mjs + astro build (dev/node)
pnpm build:cf          # idem con DEPLOY_TARGET=cloudflare
pnpm deploy:cf         # build:cf + wrangler deploy (Workers + D1 pcfc-db + R2 pcfc-media)
```

Secrets de prod solo vía `wrangler secret put <NOMBRE>`. Nunca plaintext.

## Convenciones del repo

- **Componentes compartidos primero**: `PageHero`, `FinalCta`, `SedeCards`, `CategoryList`,
  `TwoColMedia`, `CardGrid`, `Sponsors`, `Reveal`, `SectionHeader`, `GalleryGrid`,
  `inscribete/WizardForm`. No crear variantes duplicadas; extender por props.
- **No duplicar CSS**: Tailwind v4 + tokens de `src/styles/global.css` (+ `DESIGN.md` /
  `MANUAL-DE-MARCA.md` como fuente visual). Nada de `<style>` con colores hardcodeados nuevos.
- **Toda fuente externa con fallback**: patrón `fetchX().catch(fallback)` (ver `index.astro`).
  Las páginas nunca deben tumbar por feed/EmDash caído.
- **Galerías canónicas = `match_photos`** (EmDash, flag `show_in_hero` para el hero).
  Slugs deterministas vía `src/lib/match-photos.ts` (`buildMatchSlug`) — si cambias el
  algoritmo, cambia también `scripts/sync-match-photos.mjs`.
- **DB local y media van en `data/`** (`emdash.db`, `foto-likes.db`, `media/`).
- **Docs de sprint cerrado → `docs/archive/`** con `git mv`. Vigentes: `GUIA-CLIENTE.md`,
  `ARQUITECTURA.md`, `convocatorias-api-contract.md`, `DESIGN.md`, `MANUAL-DE-MARCA.md`.
- **Docs Astro oficiales**: https://docs.astro.build — guías de routing, componentes,
  content collections, styling e i18n según tarea.

## Qué NO hacer

- **No tocar R2 (`pcfc-media`) ni D1 (`pcfc-db`) de prod sin aviso explícito.**
  Tampoco `wrangler.jsonc` (routes/dominio `puntacanafc.com`, bindings `DB`/`MEDIA`/`IMAGES`/`SEB`).
- **No commitear `data/`** (`emdash.db*`, `foto-likes.db`, `media/`), `.env`, ni secrets
  (`PLATFORM_API_KEY`, `EMDASH_ENCRYPTION_KEY`). Están (o deben estar) en `.gitignore`.
- **No tocar `scripts/archive/`** (histórico) ni `docs/archive/` salvo para archivar con `git mv`.
- **No editar `DESIGN.md`, `MANUAL-DE-MARCA.md`, `docs/convocatorias-api-contract.md`,
  `.env.example`** sin pedirlo: son fuente de verdad / contratos vigentes.
- **No añadir colecciones EmDash ni campos del schema** desde código sin alinear
  `.emdash/schema.json` + `src/content.config.ts` + `docs/GUIA-CLIENTE.md`.
- **No usar la colección legacy `partidos`** para features nuevas (ver `docs/ARQUITECTURA.md`).
- **No commitear `PLATFORM_URL`/`*_API_KEY` reales** — en prod son secrets de Cloudflare.
