// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import { default as emdash } from 'emdash/astro';
import { sqlite } from 'emdash/db';
import node from '@astrojs/node';

/**
 * PCFC — Astro 7 + EmDash CMS + Tailwind v4
 * =========================================
 * - output: 'static' → SSG puro. HTML estático desde src/content/*.
 * - getCollection() lee src/content/ (content.config.ts schemas) en BUILD TIME.
 * - EmDash integration: dev admin UI (/_emdash/admin). El content editable
 *   del cliente se guarda → sync a src/content/*.md por emdash dev server.
 *   Prod: pnpm exec astro build (SSG) → Cloudflare static (NUNCA Vercel).
 * - Dev: node adapter (para /_emdash/admin SSR endpoints).
 *   Prod build: adapter node generando standalone Node (o cloudflare en prod).
 *
 * El cliente edita textos/imágenes vía /_emdash/admin/ sin tocar diseño.
 * Ref: astro-cloudflare-deployment skill.
 */
export default defineConfig({
  site: 'https://puntacanafc.com',
  trailingSlash: 'ignore',
  output: 'server', // SSR: evita prerender React conflict. /_emdash/* = SSR endpoints.
  adapter: node({
    mode: 'single',
  }),
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: ['emdash', 'kysely'],
    },
  },
  integrations: [
    react(),
    sitemap(),
    emdash({
      // Dev DB → SQLite local. emdash init crea data/emdash.db.
      database: sqlite({ url: 'file:./data/emdash.db' }),
      contentCollections: {
        enabled: true,
        dir: 'src/content',
      },
      media: {
        enabled: true,
        provider: 'local',
      },
      auth: {
        mode: process.env.NODE_ENV === 'production' ? 'email' : 'dev',
      },
    }),
  ],
  prefetch: { prefetchDefault: true, prefetchAllRoutes: true },
});
