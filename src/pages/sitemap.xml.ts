import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getAllPosts } from '../lib/fotos-posts';

// Sitemap dinámico: rutas públicas estáticas + slugs reales de blog y fotos.
// Usa las mismas fuentes que blog/[slug].astro (colección `blog`, published !== false)
// y fotos/[slug].astro (getAllPosts). Excluye /api, /_emdash y /dev.
export const prerender = true;

const STATIC_PATHS = [
  '/',
  '/club',
  '/area-deportiva',
  '/categorias',
  '/calendario',
  '/jugadores',
  '/padres',
  '/sponsors',
  '/tienda',
  '/terminos',
  '/blog',
  '/fotos',
  '/fotos/todas',
  '/inscribete',
];

export const GET: APIRoute = async ({ site }) => {
  const base = site ?? new URL('https://puntacanafc.com');
  const paths = new Set<string>(STATIC_PATHS);

  // Blog: mismas reglas que getStaticPaths() en blog/[slug].astro
  const posts = await getCollection('blog');
  for (const entry of posts) {
    if (entry.data.published === false) continue;
    paths.add(`/blog/${entry.data.slug}`);
  }

  // Fotos: mismas fuente que fotos/[slug].astro (id = slug de la galería)
  try {
    const { posts: photoPosts } = await getAllPosts();
    for (const p of photoPosts) {
      if (p.id) paths.add(`/fotos/${p.id}`);
    }
  } catch {
    // Si la fuente de fotos no responde, el sitemap sigue con el resto de rutas.
  }

  const urls = [...paths]
    .sort()
    .map((p) => `  <url><loc>${new URL(p, base).href}</loc></url>`)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
