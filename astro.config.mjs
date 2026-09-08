// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
// import react from "@astrojs/react";
import emdash, { local } from "emdash/astro";
import { sqlite } from "emdash/db";
import node from "@astrojs/node";

import react from "@astrojs/react";

// ============================================================
// PCFC — Astro 7 + EmDash CMS + Tailwind v4 + Cloudflare
// ============================================================
// El cliente edita content collections desde /_emdash/admin/
// SIN tocar diseño/código. Schemas en src/content.config.ts.
// Dev: SQLite local (data/emdash.db).  Prod: Cloudflare D1 (DB).
// Ref: astro-cloudflare-deployment skill (Eter Studio pattern)
// ============================================================

export default defineConfig({
  site: "https://puntacanafc.com",
  trailingSlash: "ignore",
  output: "server", // EmDash requiere SSR para endpoints /_emdash/*
  adapter: node({
    // Dev/local: Node standalone. Prod: @astrojs/cloudflare.
    mode: "standalone",
  }),
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: ["@emdash-cms/cloudflare", "emdash", "kysely"],
    },
  },
  integrations: [sitemap(), // react(),
  emdash({
    // Dev DB → SQLite local. EmDash auto-detecta EMDASH_DATABASE_URL=.
    database: sqlite({ url: "file:./data.db" }),
    storage: local({
      directory: "./uploads",
      baseUrl: "/_emdash/api/media/file",
    }),
    // Local dev DB — creado por `emdash init` (data/emdash.db)

    // Content collections editable por el cliente (schemas Zod en content.config.ts).
    // Schema valida que los values editados no rompan el layout.
    contentCollections: {
      enabled: true,
      dir: "src/content",
    },
    // Media uploads → R2 (prod) / ./data/media (dev).
    media: {
      enabled: true,
      provider: "local",
      // Local dev: uploads en data/media/. Prod: R2 bucket (R2 binding).
    },
    // Auth: dev bypass (localhost). Prod: Cloudflare Access o email.
    auth: {
      mode: process.env.NODE_ENV === "production" ? "email" : "dev",
    },
  }), react()],
});