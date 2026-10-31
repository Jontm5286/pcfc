# Auditoría PCFC (dev local) — por sprints

Alcance: `http://localhost:4321`, solo reporte (sin tocar código, sin commit, sin deploy).
Base: HEAD `23cadb5` + WIP del usuario sin commitear (FixturesBar, MatchListItem, academy-feed, calendario, migrations.json) — no tocar.

Rutas: `/`, `/club`, `/area-deportiva`, `/categorias`, `/calendario`, `/jugadores`, `/padres`, `/sponsors`, `/tienda`, `/terminos`, `/blog`, `/blog/[slug]`, `/fotos`, `/fotos/todas`, `/fotos/[slug]`, `/inscribete`.
API: `inscripcion`, `inscripcion-plataforma`, `contacto-patrocinio`, `foto-likes`, `foto-descarga`.

## Sprint 1 — Funcional
- Todas las rutas responden 200 (y 404 real para slugs inexistentes).
- Links internos rotos, anclas, imágenes rotas.
- WhatsApp: solo `18299889500` (Village) y `18292464756` (BBS/RD); cero `18096529450`.
- Nav (texto "Punta Cana FC", menú móvil), footer.
- Fotos: grid, paginador (10), `/fotos/[slug]` top-4, lightbox abre/cierra/teclado, likes toggle, descarga.
- Form inscripción: 4 sedes, validaciones (fecha <2000/futura, campos vacíos, email), categoría provisional. **Sin envíos reales** a la plataforma: API solo con payloads inválidos (JSON roto, sede desconocida) para ver respuestas; documentar la causa de "Solicitud inválida".
- Banner cookies + eventos GA (`submit_inscription`, `toggle_like`, `download_photo`, `navigation_toggle`).
- Errores de consola JS por página.

## Sprint 2 — SEO técnico
title/description únicos, canonical, OG/Twitter, robots.txt, sitemap, hreflang/lang, H1 único, jerarquía de headings, alt, schema.org (SportsOrganization/LocalBusiness por sede), 301 de slugs viejos.

## Sprint 3 — Rendimiento
Peso por página, imágenes (formato, tamaño, lazy, dimensiones), JS/CSS enviado, fuentes, scripts de terceros (GA, Clarity), Lighthouse si está disponible.

## Sprint 4 — Accesibilidad y contraste
Contraste WCAG AA (texto sobre fondos oscuros — prioridad del usuario), foco visible, teclado, labels de form, aria del lightbox/nav, tamaño de toques en móvil.

## Pendientes del usuario (fuera de la auditoría)
- Calendario: mostrar la **sede de la convocatoria** en cada partido.
- Regla de diseño: los partidos se renderizan SIEMPRE con Punta Cana FC como local, aunque no lo sea; el backend/feed conserva si somos home o away. No es bug.
- Inscripción: fallback por email al admin cuando falle la plataforma + prompt para el otro agente.

Entregable por sprint: `.hermes/reports/auditoria-sprintN.md` con hallazgos (severidad Alta/Media/Baja, URL, evidencia, fix sugerido).
