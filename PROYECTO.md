# PROYECTO.md — Punta Cana FC

- Stack: Astro 7.3.1 + EmDash CMS 0.36 (Cloudflare Workers)
- Plugin: `plugins/pcfc-media-gallery` (esquema en `src/schema.ts`)
- Datos CMS: `data.db` → leer con `better-sqlite3` (loader no funciona en dev)
- Estructura: `src/pages/`, `src/content/`, `src/lib/`, `src/data/fixtures.ts`
- Build: `pnpm build:cf` + `npx wrangler deploy`
- Diseño: `DESIGN.md` (v1.0, Sep 2026) — paleta navy, sin glow/slate
- Grafo: `GRAPHI_REPORT.md` (1751 nodos, 219 archivos, indexado con `graphi`)
