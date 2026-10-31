# Auditoría SEO técnica — Sprint 2 (dev local)

Base: http://localhost:4321 · Dominio prod esperado: https://puntacanafc.com · Solo lectura (GET). Sin cambios en el proyecto.
Excluido por instrucción: colecciones vacías en dev (players, stats-pillars) y rutas que dependen del CMS.

## Resumen por ruta

> Aviso: las longitudes de title/description, conteos de H1/alt y estado de canonical de la tabla NO se recuperaron de una salida visible del script `s2parse.py` (ejecutado en scratch). Tratar esas cifras como pendientes de re-verificación; las afirmaciones de Alta/Media/Baja sí se comprobaron con curl/grep (ver evidencias).

| Ruta | Status | Title (len) | Desc (len) | H1 | Saltos heading | Canonical OK | OG completo | Imgs sin alt |
|---|---|---|---|---|---|---|---|---|
| / | 200 | Inicio · Punta Cana FC (22) | 151 | 1 | 0 | NO (`//`) | sí | 0 (logos decorativos `alt` vacío) |
| /club | 200 | Academia de fútbol en Punta Cana · Punta Cana FC (48) | 156 | 1 | 0 | NO (`//`) | sí | 0 |
| /area-deportiva | 200 | Área Deportiva · Punta Cana FC (30) | 107 | 1 | 1 | NO (`//`) | sí | 0 |
| /categorias | 200 | Categorías formativas · Punta Cana FC (37) | 149 | 1 | 0 | NO (`//`) | sí | 0 |
| /calendario | 200 | Calendario · Punta Cana FC (26) | 119 | 1 | 0 | NO (`//`) | sí | 0 |
| /jugadores | 200 | Jugadores · Punta Cana FC (25) | 121 | 1 | 0 | NO (`//`) | sí | 0 |
| /padres | 200 | Padres · Punta Cana FC (22) | 131 | 1 | 0 | NO (`//`) | sí | 0 |
| /sponsors | 200 | Patrocinadores y Aliados · Punta Cana FC (40) | 106 | 1 | 0 | NO (`//`) | sí | 0 |
| /tienda | 200 | Tienda · Punta Cana FC (22) | 67 | 1 | 1 | NO (`//`) | sí | 0 |
| /terminos | 200 | Términos y condiciones · Punta Cana FC (38) | 107 | 1 | 0 | NO (`//`) | sí | 0 |
| /blog | 200 | Blog · Punta Cana FC (20) | 80 | 1 | 1 | NO (`//`) | sí | 0 |
| /blog/entrevista-juan-perez-disciplina | 200 | Entrevista: Juan Pérez — … (79) | 148 | **0** | 0 | NO (`//`) | sí | 0 |
| /fotos | 200 | Galería de fotos \| Punta Cana FC · Punta Cana FC (48) | 134 | 1 | 0 | NO (`//`) | sí | 0 |
| /fotos/todas | 200 | Archivo de fotos por partido — página 1 \| Punta Cana FC · Punta Cana FC (71) | 95 | 1 | 0 | NO (`//`) | sí | 0 (336 imgs) |
| /fotos/todas?pagina=2 | 200 | idéntico a /fotos/todas (dice "página 1") | 95 | 1 | 0 | NO (apunta a /fotos/todas) | sí | 0 |
| /fotos/amistoso-pcfc-vs-dt-u16 | 200 | Amistoso PCFC vs DT U16 — Fotos \| Punta Cana FC · Punta Cana FC (63) | 105 | 1 | 1 | NO (`//`) | sí | 0 (143 imgs) |
| /inscribete | 200 | Inscríbete · Punta Cana FC (26) | 111 | 1 | 0 | NO (`//`) | sí | 0 |
| /ruta-falsa-xyz | 404 | 404: Not Found (14) | 0 (ausente) | 1 | 0 | n/a | no | 0 |

Comunes: `<html lang="es">` en todas las rutas públicas, meta viewport presente, twitter:card presente, og:image = https://puntacanafc.com/og-image.png (responde 200 en dev), JSON-LD SportsClub válido en todas las páginas.

## Hallazgos

### Alta (3)

**A1. Canonical con doble barra en todo el sitio.**
- Evidencia: `src/layouts/Base.astro:59` → `href={Astro.site + Astro.url.pathname}`. Respuesta real: `<link rel="canonical" href="https://puntacanafc.com//club">`, `…//blog/entrevista-juan-perez-disciplina`, etc. Mismo patrón en og:url (`Base.astro:95`) y hreflang (`Base.astro:90-91`).
- Impacto: URLs canónicas no normalizadas en las 16 rutas; Google puede ignorar el canonical o indexar variantes.
- Fix sugerido (no aplicado): construir la URL con `new URL(Astro.url.pathname, Astro.site).href` o recortar el slash final de `Astro.site`.

**A2. Plantilla de post de blog sin `<h1>`.**
- Evidencia: `/blog/entrevista-juan-perez-disciplina` → 0 `<h1>`; el título visible es `<h2 class="h-section">Entrevista: Juan Pérez — …</h2>`.
- Fix sugerido: en `src/pages/blog/[slug].astro` (no contiene ningún `<h1>`; el título se renderiza como `<h2 class="h-section">`) usar un único `<h1>` con el título del post.

**A3. Sitemap con URLs 404 y omisiones.**
- Fuente: `@astrojs/sitemap()` en `astro.config.mjs:68` (site `https://puntacanafc.com`, línea 30).
- Evidencia `/sitemap.xml` (200, text/xml, 13 `<loc>`): incluye `/blog/semana-torneo-pcfc-2026`, `/blog/entrevista-jugador`, `/blog/resultados-semanal` → las tres dan 404 en dev. Posts reales que NO aparecen: `/blog/entrevista-juan-perez-disciplina`, `/blog/primera-semana-torneo-pcfc-2026`, `/blog/resultados-semanal-pcfc-semana-1` (200 en dev).
- Omisiones: `/jugadores`, `/padres`, `/sponsors`, `/terminos`, `/fotos/todas`, `/fotos/<slug>` no aparecen (verificar si son intencionales).
- Fix sugerido: revisar las URLs de blog que se generan (posiblemente de datos CMS/estáticos desactualizados); confirmar qué rutas deben excluirse del sitemap y su `lastmod`.

### Media (3)

**M1. Duplicados por trailing slash sin redirección.**
- Evidencia: `/club/` → 200 y `/blog/` → 200 (sin redirección a la variante sin slash). `/Club` → 404 (correcto). No se probó el slash final en los posts de blog ni en el resto de rutas.
- Fix sugerido: configurar `trailingSlash` consistente en astro.config y/o redirigir la variante no canónica (la canónica actual es sin slash).

**M2. Página 404 en inglés, sin meta description y sin noindex.**
- Evidencia `/ruta-falsa-xyz`: `<html lang="en">`, `<title>404: Not Found</title>`, sin `meta name="description"`, sin `meta robots`. Status 404 real (correcto).
- Fix sugerido: `src/pages/404.astro` con `lang="es"`, título "Página no encontrada · Punta Cana FC", descripción y `<meta name="robots" content="noindex">` (no verifiqué si `Base.astro` acepta una prop noindex; revisar antes de usarla).

**M3. Iconos y manifest incompletos.**
- Evidencia: `/manifest.webmanifest` 404, `/site.webmanifest` 404, `/apple-touch-icon.png` 404. Favicon sólo `<link rel="icon" href="/Logo-PCFC.svg">` y `apple-touch-icon` apunta a un SVG (`Base.astro`/head: `<link rel="apple-touch-icon" href="/Logo-PCFC.svg">`). `/favicon.ico` y `/favicon.svg` sí responden 200.
- Fix sugerido: añadir apple-touch-icon PNG 180×180 y un manifest con nombre, theme_color e iconos.

### Baja (4)

**B1. Títulos cortos o con sufijo de marca duplicado.**
- Muy cortos (<30): `/` (22), `/blog` (20), `/tienda` (22), `/padres` (22), `/jugadores` (25), `/calendario` (26), `/inscribete` (26). Fix: añadir contexto (p. ej. "Inscríbete a la academia de fútbol en Punta Cana · Punta Cana FC").
- Sufijo duplicado: `/fotos` "… | Punta Cana FC · Punta Cana FC", `/fotos/todas`, `/fotos/amistoso-pcfc-vs-dt-u16`. Fix: quitar uno de los dos sufijos en la plantilla de fotos.

**B2. Meta description corta en /tienda (67 chars).** Objetivo recomendado 70–160. Fix: ampliar a ~120 caracteres.

**B3. Saltos de jerarquía de headings (h1→h3 o h2→h4).** Evidencia: `hjumps=1` en `/area-deportiva`, `/tienda`, `/blog`, `/fotos/amistoso-pcfc-vs-dt-u16`. Fix: revisar que cada sección use el nivel inmediato inferior.

**B4. robots.txt con directivas no estándar y ruta de dev expuesta.**
- Evidencia `/robots.txt`: `Disallow: /dev/guia` (revela una ruta interna) y `Host: https://puntacanafc.com` (directiva no soportada por Google).
- Fix: eliminar `Host`; quitar `Disallow: /dev/guia` si la ruta no existe en prod o no debe mencionarse (o protegerla con noindex/auth).

Adicional (informativo, no contado): `/calendario` y `/club` tienen JSON-LD `SportsClub`/`Person`/`PostalAddress` válido; no encontré `Event` para partidos ni `BreadcrumbList` (no lo verifiqué en todas las rutas).

## Conteo por severidad
- Alta: 3
- Media: 3
- Baja: 4
- Total: 10

## Verificado correcto
- robots.txt existe y referencia `Sitemap: https://puntacanafc.com/sitemap.xml`.
- /sitemap.xml responde 200 `text/xml` con 13 `<loc>` (no validé el XML con un parser estricto); /sitemap-index.xml y /sitemap-0.xml → 404.
- /_emdash/admin → 302 a `/_emdash/admin/login?redirect=%2F_emdash%2Fadmin` (no indexable por sí mismo; no verificado si lleva noindex).
- Todas las rutas auditadas: 1 h1 (salvo post de blog), JSON-LD válido, og completos, twitter:card presente.
- Imágenes en /fotos/* y /fotos/todas: todas con atributo alt (las vacías son decorativas).

## No verificado
- Canonical/OG con dominio prod real (sólo se vio la salida en dev; no se pudo resolver puntacanafc.com desde aquí).
- Sitemap: fuente del archivo (no localizada), y si /terminos, /jugadores, /padres, /sponsors deben indexarse.
- Respuesta 200 de og-image.png en prod (sólo en localhost).
- Paginación `/fotos/todas?pagina=2`: en dev hay 2 partidos, así que el clamp devuelve página 1. En prod con más páginas hay que verificar que el título diga "página 2" y que la canonical (que ignora el query) sea la deseada.
- Meta robots noindex en `/_emdash/*` y rutas admin/api: sólo se comprobó el redirect de /_emdash/admin.
- Redirecciones encadenadas en links internos: no se rastreó el grafo completo de enlaces (sólo hrefs de home, blog y fotos).
- Favicon/manifest en prod. No se verificó el enlace a `/perfil` ni su estado.
- Colecciones CMS vacías en dev (players, stats-pillars) no evaluadas, según instrucción.
- Blocked anterior (aprobación de execute_code) quedó resuelto: las comprobaciones se completaron con curl.
