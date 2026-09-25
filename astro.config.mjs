// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import emdash, { local } from 'emdash/astro';
import { sqlite } from 'emdash/db';
import node from '@astrojs/node';
import react from '@astrojs/react';

// ============================================================
// PCFC — Astro 7 + EmDash CMS + Tailwind v4 + Cloudflare
// ============================================================
// El cliente edita content collections desde /_emdash/admin/
// SIN tocar diseño/código. Schemas en src/content.config.ts.
// Dev: SQLite local (data/emdash.db). Prod: Cloudflare D1 (DB).
// ============================================================

export default defineConfig({
  site: 'https://puntacanafc.com',
  trailingSlash: 'ignore',
  output: 'server', // EmDash requiere SSR para endpoints /_emdash/*
  adapter: node({
    mode: 'standalone', // Dev/local: Node. Prod: cambiar a @astrojs/cloudflare
  }),
  vite: {
    plugins: [tailwindcss()],
    server: {
      watch: {
        ignored: ['**/data/**', '**/src/content/**', '**/.emdash/**'],
      },
    },
    ssr: {
      noExternal: ['@emdash-cms/cloudflare', 'emdash', 'kysely'],
    },
  },
  integrations: [
    sitemap(),
    react(), // Requerido antes de EmDash para renderizar el Admin UI
    emdash({
      // Alineado con el comentario: apunta a data/emdash.db para evitar el error 'unable to open database file'
      database: sqlite({
        url: process.env.EMDASH_DATABASE_URL || 'file:./data/emdash.db',
      }),
      storage: local({
        directory: './data/media',
        baseUrl: '/_emdash/api/media/file',
      }),
      contentCollections: {
        enabled: true,
        dir: 'src/content',
      },
      auth: {
        mode: process.env.NODE_ENV === 'production' ? 'email' : 'dev',
      },
    }),
  ],
});
