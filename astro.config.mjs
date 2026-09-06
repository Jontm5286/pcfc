// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import { default as emdash } from 'emdash/astro';
import { sqlite } from 'emdash/db';
import node from '@astrojs/node';

// PCFC astro.config.mjs — Astro 7 + EmDash CMS integration
// Deploy target: Cloudflare (Workers + D1). Build local usa node adapter (SSR runtime).
export default defineConfig({
  site: 'https://puntacanafc.com',
  trailingSlash: 'ignore',
  output: 'server', // SSR: evita prerender React conflict. /_emdash/* = SSR endpoints.
  adapter: node({
    mode: 'single', // Astro 7.3.1 node adapter v11 API
    types: { runtime: 'nodejs_18' },
  }),
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    react(), // EmDash admin UI hydration (React + TS)
    sitemap(),
    emdash({
      // Dev DB → SQLite local. EmDash v0.36: database = sqlite({ url }) dialect factory.
      // EmDash integration auto-registra content collections desde src/content.config.ts
      // via virtual loader. Auth admin: env EMDASH_DEV_AUTH=1 (dev mode auto-login).
      database: sqlite({ url: 'file:./data-fresh.db' }), // data.db was corrupt; fresh seed applied
    }),
  ],
  // Security headers via Cloudflare (set in wrangler.toml / _headers)
  // Local dev: Astro dev server sin headers extra.
});
