// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import emdash, { local } from 'emdash/astro';
import { sqlite } from 'emdash/db';
import { d1, r2 } from '@emdash-cms/cloudflare';
import node from '@astrojs/node';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';

// ============================================================
// PCFC — Astro 7 + EmDash CMS + Tailwind v4 + Cloudflare
// ============================================================
// El cliente edita content collections desde /_emdash/admin/
// SIN tocar diseño/código. Schemas en src/content.config.ts.
// Dev: Node + SQLite local (data/emdash.db).
// Prod (DEPLOY_TARGET=cloudflare): Workers + D1 + R2.
// ============================================================

const isCloudflare = process.env.DEPLOY_TARGET === 'cloudflare';

export default defineConfig({
  site: 'https://puntacanafc.com',
  trailingSlash: 'ignore',
  output: 'server', // EmDash requiere SSR para endpoints /_emdash/*
  adapter: isCloudflare
    ? cloudflare()
    : node({
        mode: 'standalone', // Dev/local: Node. Prod: @astrojs/cloudflare
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
    emdash(
      isCloudflare
        ? {
            database: d1({ binding: 'DB', session: 'auto' }),
            storage: r2({ binding: 'MEDIA' }),
            contentCollections: {
              enabled: true,
              dir: 'src/content',
            },
          }
        : {
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
          },
    ),
  ],
});
