import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import node from '@astrojs/node';
export default defineConfig({
  site: 'https://puntacanafc.com',
  trailingSlash: 'ignore',
  output: 'static',
  adapter: node({ mode: 'single' }),
  vite: { plugins: [tailwindcss()], ssr: { noExternal: [] } },
  integrations: [react(), sitemap()],
});
