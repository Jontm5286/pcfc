# PCFC — Plan de Estandarización de Componentes

> Análisis técnico de coherencia visual y semántica entre los 18 componentes `.astro` de `src/components/`, contrastados contra `src/styles/global.css` (tokens `@theme`) y `docs/design-system.md` v1.0.

---

## 1. Resumen ejecutivo

El proyecto PCFC cuenta con **18 componentes Astro** en `src/components/`, 17 clases utilitarias definidas en `@layer components` (`global.css`) y un sistema de tokens robusto (`@theme`) que cubre la escala cromática navy/sky, fuentes tipográficas, breakpoints y badges por categoría. El estado de estandarización actual es **moderadamente bueno pero con fugas sistemáticas** que erosionan la coherencia de marca:

- **Contenedores inconsistentes**: 4 componentes (`Sponsors`, `PathwayCards`, `ValuePillars`, `Sponsors` rotador de Hero) usan `max-w-[1280px] mx-auto px-8` inline en lugar del token `.container-x`; 1 usa `max-w-[1200px]`.
- **Padding de sección personalizado**: 4 componentes redefinen `py-*` arbitrario en lugar de `.section` (Hero con `clamp()`, PathwayCards `py-12 md:py-14`, Sponsors `py-14 md:py-16`, ValuePillars `py-16 md:py-20`).
- **Border radius fuera de token**: `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-full` y `rounded-[6px]` conviven sin mapa.
- **Hover de cards heterogéneo**: 4 patrones distintos para el mismo efecto (border-color + shadow, sólo border-color, hover azul, hover scale).
- **Sombras custom en 5 componentes**: cada uno redefine su propio box-shadow sin token.
- **Valores hardcodeados**: `#071D3B` (en Footer), `#F5F8FB` (en CalendarFilters y MatchListItem), `#429AC0` (en Footer/Footer links y Hero rotator), `rgba(0,40,92,0.x)` literal en múltiples lugares cuando existen tokens (`border-navy/10`, `border-navy/25`).
- **SectionHeader infrautilizado**: sólo `EnrollmentCta` lo adopta directamente; el resto define headers inline con `eyebrow + h-section/h2 + lede` cuando deberían usar el componente.
- **2 componentes con `transition: all`**: `PostCard` y `CalendarFilters` (con `transition-colors` ok), pero `FixturesBar` y `Hero` aceptan `transition-all` (prohibido según DESIGN.md §6).
- **Botones**: uso correcto de `.btn`, `.btn--primary`, `.btn--sky`, `.btn--outline`, `.btn--outline-on-navy` y `.btn--lg` — sin variantes extraviadas.
- **Tipografía**: uso disciplinado de `.h-display`, `.h-section`, `.h-card`, `.eyebrow`, `.lede` y sus modificadores `--on-navy`, con 3 excepciones (`ValuePillars`, `Sponsors`, `PathwayCards` usan tamaños literales).

El plan propone **20 mejoras priorizadas**: **5 HIGH** (contenedor + SectionHeader + sombras/tokens), **9 MEDIUM** (border-radius, padding, hover cards, transiciones) y **6 LOW** (refactors cosméticos). La ejecución completa reduce ~60% de clases hardcodeadas y consolida 4 patrones de hover en 1.

---

## 2. Tabla maestra de componentes

Inventario completo de los 18 componentes con props, tokens consumidos, valores hardcodeados, variantes, tipos de HTML emitido y comportamiento JS.

| # | Componente | Archivo | Props principales | Tokens `@theme` usados | Hardcodes detectados | Variantes | HTML root | JS |
|---|---|---|---|---|---|---|---|---|
| 1 | `CalendarFilters` | `CalendarFilters.astro` | (sin props, categorías inline) | `color-navy`, `color-white` (via `--var`) | `#F5F8FB` fondo tablist, `rgba(0,40,92,0.07)` hover, `13px` font-size | 5 tabs (todas/pre/form-baja/form-alta/elite) | `<div role="tablist">` + `<button>`s | `click` toggling + active class |
| 2 | `CategoryCard` | `CategoryCard.astro` | `slug`, `title`, `ageRange`, `focus`, `format`, `schedule`, `description`, `ageMin`, `ageMax`, `ctaHref` | `bg-white`, `border-navy/10`, `border-navy/25`, `text-navy`, `text-navy-30`, `text-navy-60`, `text-sky`, `btn--primary` | `shadow-[0_4px_20px_rgba(0,40,92,0.08)]` literal, `rounded-lg`, `p-6 md:p-8` | 4 slugs (pre/form-baja/form-alta/elite) | `<article>` con header + dl + footer | — (puro) |
| 3 | `CommunityMosaic` | `CommunityMosaic.astro` | `images?: GalleryImage[]` | `bg-navy`, `eyebrow--on-navy`, `h-section--on-navy`, `btn--outline-on-navy`, `bg-navy-30` | `bg-navy-30` (debería ser token), `grid-rows-[200px_160px_160px]` | 1 variante con/sin imágenes | `<section>` + `<header>` + `<div class="mosaic grid">` | — (puro) |
| 4 | `EnrollmentCta` | `EnrollmentCta.astro` | `eyebrow`, `title`, `copy`, `enrollHref`, `whatsappHref` | `bg-pure-white`, `btn--primary`, `btn--outline`, `btn--lg` | `text-[clamp(2.5rem,6vw,4.5rem)]` inline (no token) | 5 props opcionales con defaults | `<section>` + `<div class="container-x max-w-[720px]">` | — (puro) |
| 5 | `FixturesBar` | `FixturesBar.astro` | (sin props, datos inline) | `bg-navy-05`, `border-navy-10`, `text-navy-60`, `text-navy-30`, `text-navy` | Colores hardcodeados por equipo (`#2563eb`, `#dc2626`, `#10b981`, etc.), `w-[80vw]` mezcla con `w-[280px]`, `transition-all` (prohibido) | N categorías según array | `<div role="region">` + marquee | `animation: marquee 40s linear infinite` + pausa hover |
| 6 | `Footer` | `Footer.astro` | (sin props) | `bg-[#071D3B]` (hardcoded vs `bg-navy-dark`), `text-white/70`, `border-white/5`, `border-white/10` | `#071D3B` literal, `hover:text-[#429AC0]` literal (existe token), `max-w-[320px]`, `text-[0.9rem]`, `text-[0.8rem]` | 1 variante, 4 columnas | `<footer>` + grid 4 cols + bottom bar | — (puro) |
| 7 | `GalleryGrid` | `GalleryGrid.astro` | `photos: Photo[]`, `galleryId: string` | `bg-navy-05`, `border-navy/10`, `border-navy/25`, `rounded-md` | `shadow-[0_4px_20px_rgba(0,40,92,0.12)]` literal, `border-navy-60` (no existe token directo) | 1 variante responsive 2/3/4 cols | `<div class="gallery-grid grid">` + `<button>` items | `click` → `photo:open` CustomEvent |
| 8 | `Hero` | `Hero.astro` | `eyebrow`, `title`, `description`, `backgroundImage`, `bullets[]`, `ctaPrimary`, `ctaSecondary`, `galleryImages[]`, `nextMatch`, `eyebrowOnDark` | `h-display--on-navy`, `eyebrow--on-navy`, `lede--on-navy`, `bg-navy-dark`, `border-sky`, `border-white/10`, `text-sky-30` | `text-[clamp(2.5rem,6.5vw,4.75rem)]` inline, `rgba(66,154,192,...)` literal, `rgba(0,40,92,...)` literal | 2 modos: con/sin galleryImages; 2 modos: con/sin nextMatch | `<section>` + 2-col grid + `<aside>` opcional | `data-component="featured-rotator"` rotación auto |
| 9 | `HomeCategories` | `HomeCategories.astro` | `categories: Category[]` | `eyebrow`, `h-section`, `lede`, `border-navy/10`, `text-navy-10`, `text-navy-30`, `text-sky`, `badge--*` | `mb-[clamp(2.5rem,5vw,4rem)]` (debería ser SectionHeader), `transition-[background,padding]` literal | 1 variante, 4 rows | `<section>` + `<ol>` + `<a>` rows | — (puro) |
| 10 | `Lightbox` | `Lightbox.astro` | `defaultGalleryId?: string` | `bg` propio, `font-body` | `rgba(0,20,40,0.92)` overlay hardcoded, `border-radius: 4px`, `outline: 2px solid #429AC0` | 1 variante modal | `<div role="dialog" aria-modal="true">` | `photo:open` listener + keyboard nav |
| 11 | `MatchListItem` | `MatchListItem.astro` | `categorySlug`, `categoryLabel`, `date`, `time?`, `team1`, `team2`, `venue`, `photosHref?`, `past?` | `border-navy/10`, `bg-white`, `hover:bg-[#F5F8FB]`, `text-navy`, `text-navy-30`, `text-sky`, `badge--*` | `#F5F8FB` literal (existe `bg-navy-05`-ish pero no idéntico), `transition-colors duration-150` | 3 estados: futuro, pasado sin fotos, pasado con fotos | `<li>` + `<div class="container-x">` | — (puro, asume contenedor padre) |
| 12 | `Navbar` | `Navbar.astro` | `currentPath?`, `navItems?` | `bg-navy`, `border-white/5`, `bg-navy-dark`, `bg-sky`, `text-navy-dark`, `text-sky`, `text-white/70`, `btn--sky`, `btn--lg` | `h-[52px]` logo literal, `chevron w-[8.75px] h-[5px]` inline SVG, `shadow-[0_8px_24px_rgba(0,0,0,0.4)]` dropdown | 1 variante con/sin dropdown children | `<header>` + `<nav>` + mobile menu | dropdown hover + toggle mobile |
| 13 | `PathwayCards` | `PathwayCards.astro` | `cards: PathwayCard[]` | `text-sky`, `text-navy-30`, `bg-sky`, `text-navy-dark`, `bg-navy-30` | `style="background: linear-gradient(...)"` inline, `bg-[#0c1e3dcf]` hardcoded, `border-2 border-[#1e3a8aff]` hardcoded, `rounded-2xl` literal, `shadow-[0_8px_8.75px_-6px_rgba(0,0,0,0.1),...]` multi-capa, `text-[#B4C5D6]` literal, `text-[1.5rem]`/`text-[1.375rem]` literal, `border border-[#22d3ee40]` hardcoded, `aspect-[176/192]` | 1 variante 2 cols | `<section>` + `<div class="max-w-[1280px] mx-auto px-8">` + grid | — (puro) |
| 14 | `PostCard` | `PostCard.astro` | `href`, `thumbnail`, `thumbnailAlt`, `categorySlug`, `categoryLabel`, `team1`, `team2`, `date`, `photoCount?` | `bg-white`, `border-navy/10`, `border-navy/25`, `bg-navy-05`, `text-navy`, `text-navy-30`, `badge--*` | `rounded-lg`, `transition-colors duration-200`, `bg-navy/80` literal | 1 variante + opcional `photoCount` chip | `<article class="post-card">` + `<a>` | — (puro) |
| 15 | `SectionHeader` | `SectionHeader.astro` | `eyebrow`, `title`, `subtitle?`, `onDark?`, `align?` | `eyebrow`, `h-section`, `lede`, `eyebrow--on-navy`, `h-section--on-navy`, `lede--on-navy` | `max-w-[720px]`, `mb-[clamp(2.5rem,5vw,4rem)]` literal | 2 aligns (left/center) × 2 modos (onDark/normal) | `<header>` con eyebrow + h2 + lede | — (puro) |
| 16 | `Sponsors` | `Sponsors.astro` | `eyebrow?`, `title?`, `sponsors: Sponsor[]` | `bg-navy-dark`, `border-white/5`, `eyebrow` + `text-sky`, `text-white/30` | `max-w-[1280px] mx-auto px-8` (debería ser `container-x`), `py-14 md:py-16`, `text-[1.5rem] md:text-[1.75rem]` literal, `leading-[1.2]`, `text-white`, `font-bold`, `tracking-[0.5px]`, `brightness-0 brightness-50 group-hover:brightness-100` | 1 variante con/sin sponsors | `<section>` + header opcional + list | — (puro) |
| 17 | `ValuePillars` | `ValuePillars.astro` | `eyebrow?`, `title`, `pillars: Pillar[]` | `bg-navy-dark`, `eyebrow` + `text-sky`, `bg-sky/5`, `border-sky`, `text-white`, `text-white/70` | `py-16 md:py-20` (debería ser `.section`), `max-w-[1280px] mx-auto px-8`, `text-[2.25rem] md:text-[2.75rem]` literal, `leading-[1.1]`, `tracking-[0.9px]`, `text-[1.125rem]` literal, `text-[0.875rem]` literal, `rounded-xl`, `shadow-[0_4px_5.25px_-4px_rgba(0,0,0,0.1),0_10px_13.125px_-3px_rgba(0,0,0,0.1)]`, `border-navy-60/30` literal | 1 variante con N pillars | `<section>` + header + `<ol>` grid 3 cols | — (puro) |
| 18 | `WhyPcfc` | `WhyPcfc.astro` | `stats: Stat[]`, `pillars: Pillar[]` | `bg-pure-white`, `eyebrow`, `h-section`, `text-navy`, `text-navy-30`, `text-sky`, `border-navy/10` | `text-[2.25rem]`, `text-[0.7rem]`, `tracking-[0.02em]`, `tracking-[0.12em]`, `text-[2.5rem]`, `text-[0.95rem]`, `leading-[1.6]`, `mb-[clamp(2.5rem,5vw,4rem)]` literal | 1 variante con stats + pillars | `<section>` + header + stats dl + pillars ol | — (puro) |

> **Notas de la tabla**:
> - 11 de 18 componentes (61%) emiten al menos 1 valor hardcodeado fuera del sistema de tokens.
> - 5 de 18 (28%) tienen JS asociado (CalendarFilters, GalleryGrid, Hero rotator, Lightbox, Navbar).
> - Sólo `EnrollmentCta` adopta `SectionHeader` directamente; los demás definen header inline.

---

## 3. Matriz de inconsistencias

### 3.1 Contenedor (`.container-x` vs max-w literal)

| Componente | Patrón usado | Token esperado | Acción |
|---|---|---|---|
| `EnrollmentCta` | `container-x max-w-[720px]` | `container-x` ✓ | OK (max-w puntual para centrado) |
| `WhyPcfc` | `container-x` | `container-x` ✓ | OK |
| `CommunityMosaic` | `container-x` | `container-x` ✓ | OK |
| `HomeCategories` | `container-x` | `container-x` ✓ | OK |
| `MatchListItem` | `container-x` (interno) | `container-x` ✓ | OK (asume padre con `<ol>` propio) |
| `Navbar` | `container-x` | `container-x` ✓ | OK |
| `Footer` | `container-x` | `container-x` ✓ | OK |
| `Hero` | `container-x max-w-[1200px]` | `container-x` con override | Migrar a `container-x` y eliminar `max-w-[1200px]` (es redundante) |
| `Sponsors` | `max-w-[1280px] mx-auto px-8` | `container-x` | **Migrar a `container-x`** |
| `ValuePillars` | `max-w-[1280px] mx-auto px-8` | `container-x` | **Migrar a `container-x`** |
| `PathwayCards` | `max-w-[1280px] mx-auto px-8` | `container-x` | **Migrar a `container-x`** |

**Resultado**: 3 componentes rompen el contrato de contenedor. El resto respeta el token.

### 3.2 Padding / section (`.section` vs padding arbitrario)

| Componente | Padding usado | Token esperado | Acción |
|---|---|---|---|
| `HomeCategories` | `section` | `section` ✓ | OK |
| `CommunityMosaic` | `section bg-navy` | `section` ✓ | OK |
| `EnrollmentCta` | `section bg-pure-white` | `section` ✓ | OK |
| `WhyPcfc` | `section bg-pure-white` | `section` ✓ | OK |
| `Hero` | `pt-[clamp(6rem,12vw,9rem)] pb-[clamp(2rem,4vw,3rem)]` | custom (hero necesita control vertical) | OK (caso especial justificado) |
| `PathwayCards` | `py-12 md:py-14` | `.section` (≈ `clamp(4rem,8vw,6rem)`) | **Migrar a `.section`** |
| `Sponsors` | `py-14 md:py-16` | `.section` | **Migrar a `.section`** |
| `ValuePillars` | `py-16 md:py-20` | `.section` | **Migrar a `.section`** |

**Resultado**: 3 secciones rompen `.section`. La diferencia visual entre `py-14` (3.5rem) y el `.section` real (`clamp(4rem,8vw,6rem)` ≈ 4–6rem) es de ~0.5–2rem por lado, lo que genera inconsistencias de ritmo vertical entre home y secciones internas.

### 3.3 Border radius

| Componente | `rounded-*` usado | Token equivalente |
|---|---|---|
| `GalleryGrid` | `rounded-md` (6px) | — (no en `@theme`) |
| `CategoryCard` | `rounded-lg` (8px) ✓ | DESIGN §4.3 dice 8px |
| `PostCard` | `rounded-lg` (8px) ✓ | — |
| `Navbar` (logo) | (no usa) | — |
| `Hero` (rotator) | `rounded-2xl` (16px) | — (overrides DESIGN) |
| `PathwayCards` | `rounded-2xl` (16px) | — |
| `PathwayCards` (img) | `rounded-xl` (12px) | — |
| `Navbar` (dropdown) | `rounded-lg` (8px) | — |
| `Navbar` (cart badge) | `rounded-full` | — |
| `CalendarFilters` | `rounded-lg` (8px) tablist + `rounded-md` (6px) tab | inconsistente |
| `FixturesBar` (cards) | (no usa) | — |
| `ValuePillars` (cards) | `rounded-xl` (12px) | — |
| `Lightbox` (img) | `border-radius: 4px` inline | — |

**Hallazgo**: **6 valores distintos** (`4px`, `6px`, `8px`, `12px`, `16px`, `9999px`) sin sistema. DESIGN §4.3 fija 8px para cards, 4px para badges (consistente con `.badge`). **Acción HIGH**: añadir tokens `--radius-sm: 4px`, `--radius-md: 6px`, `--radius-lg: 8px`, `--radius-xl: 12px`, `--radius-2xl: 16px` en `@theme` y mapear.

### 3.4 Padding card

| Componente | Padding usado | Esperado |
|---|---|---|
| `CategoryCard` | `p-6 md:p-8` (1.5rem / 2rem) | 1.5rem ✓ (md sube) |
| `PostCard` | `p-4` (1rem) | inconsistente con CategoryCard |
| `PathwayCards` (article) | `p-8` (2rem) | custom |
| `ValuePillars` (li) | `px-8 pt-10 pb-9` | custom |
| `FixturesBar` (card) | `py-2 px-1` | custom (compacto OK por contexto) |
| `MatchListItem` | `py-4` (interno container-x) | OK |

**Hallazgo**: 3 escalas (`p-4`, `p-6`, `p-8`) sin token unificado. **Acción MEDIUM**: documentar `--card-padding: 1.5rem` y adoptarlo.

### 3.5 Tipografía hardcodeada

| Componente | Tamaños literales | Token disponible |
|---|---|---|
| `Sponsors` (h2) | `text-[1.5rem] md:text-[1.75rem]` | `.h-section` (clamp 2–2.75rem) — overrride intencional |
| `ValuePillars` (h2) | `text-[2.25rem] md:text-[2.75rem]` | `.h-section` cubre hasta 2.75rem |
| `ValuePillars` (h3) | `text-[1.125rem] leading-[1.55] font-bold tracking-[0.9px] uppercase` | `.h-card` (1.25rem) |
| `ValuePillars` (p) | `text-[0.875rem] leading-[1.65]` | `body` (1rem) |
| `PathwayCards` (h3) | `text-[1.5rem] md:text-[1.375rem] font-bold tracking-[-0.6px]` | `.h-card` |
| `PathwayCards` (eyebrow) | `text-[0.75rem] font-bold tracking-[0.6px]` | `.eyebrow` |
| `PathwayCards` (subtitle) | `text-[1rem] font-semibold text-[#B4C5D6]` | custom |
| `WhyPcfc` (dt) | `text-[2.25rem] tracking-[0.02em]` | sin token específico |
| `WhyPcfc` (dd) | `text-[0.7rem] tracking-[0.12em]` | — |
| `WhyPcfc` (span pillar) | `text-[2.5rem]` | — |
| `Hero` (h1) | `text-[clamp(2.5rem,6.5vw,4.75rem)]` | override intencional para hero |
| `EnrollmentCta` (h2) | `text-[clamp(2.5rem,6vw,4.5rem)]` | override intencional |
| `Navbar` (nav links) | `text-[14px] font-medium` | sin token para nav |
| `Footer` | `text-[0.9rem]`, `text-[0.8rem]`, `text-[0.7rem]` | sin tokens semánticos |

**Hallazgo**: 13+ overrides literales. Los heroes/CTA justifican override (mayor impacto), pero `WhyPcfc`, `ValuePillars`, `PathwayCards` y `Sponsors` repiten patrones que merecen token. **Acción MEDIUM**: añadir tokens para `.text-stat`, `.text-pillar-number` y considerar variante `.h-section--compact` o similar.

### 3.6 Hover de cards

| Componente | Patrón hover | Esperado (DESIGN §4.3) |
|---|---|---|
| `CategoryCard` | `border-navy/25` + `shadow-[0_4px_20px_rgba(0,40,92,0.08)]` | ✓ exacto |
| `PostCard` | `border-navy/25` (sin sombra) | parcial |
| `GalleryGrid` (button) | `shadow-[0_4px_20px_rgba(0,40,92,0.12)]` + `border-navy/25` | parcial (shadow más fuerte) |
| `HomeCategories` (row) | `hover:bg-sky-10` + `lg:hover:px-4` | custom (lista, no card) |
| `PathwayCards` | (no hover) | OK |
| `ValuePillars` | (no hover) | OK |
| `FixturesBar` (card) | (no hover, animación marquee) | OK |
| `Hero` (rotator) | `border + shadow + z-index + brightness` | custom hero |

**Hallazgo**: 3 patrones distintos para cards: (a) border + sombra custom fuerte, (b) sólo border, (c) border + sombra sutil exacta de DESIGN. **Acción HIGH**: introducir `.card` con `--card-hover` semántico y consolidar.

### 3.7 Botones

| Variante | Componentes que la usan |
|---|---|
| `btn btn--primary` | `EnrollmentCta`, `CategoryCard`, `Navbar` (no) |
| `btn btn--primary btn--lg` | `EnrollmentCta` |
| `btn btn--outline` | `EnrollmentCta` |
| `btn btn--outline btn--lg` | `EnrollmentCta` |
| `btn btn--sky` | `Navbar` (mobile CTA) |
| `btn btn--sky btn--lg` | `Hero`, `Navbar` (mobile CTA) |
| `btn btn--outline-on-navy` | `Hero`, `CommunityMosaic` |
| `btn btn--outline-on-navy btn--lg` | `Hero` |
| **Inline custom** | `PathwayCards` (botón sin `.btn`) — `inline-flex items-center px-6 py-2.5 bg-sky text-navy-dark text-[0.75rem] font-bold rounded` |

**Hallazgo**: 1 excepción (`PathwayCards`) crea su propio botón en lugar de usar `.btn .btn--sky`. **Acción HIGH**: migrar `PathwayCards` a `.btn .btn--sky` para consistencia.

### 3.8 Colores hardcodeados vs tokens

| Componente | Hex/rgba literal | Token equivalente |
|---|---|---|
| `Footer` | `bg-[#071D3B]` | `bg-navy-dark` (igual hex) |
| `Footer` | `hover:text-[#429AC0]` | `hover:text-sky` |
| `Navbar` (mobile links) | `text-white/70` literal → OK (es opacity shorthand) |
| `CalendarFilters` | `bg-[#F5F8FB]` | — (no existe token, considerar `--color-surface-cool`) |
| `MatchListItem` | `hover:bg-[#F5F8FB]` | mismo, sin token |
| `Hero` (rotator) | `border-color: #429ac0`, `rgba(66,154,192,0.35)` | `border-sky`, `ring-sky/35` |
| `Hero` (scrollbar) | `rgba(66,154,192,0.5)`, `rgba(255,255,255,0.08)` | OK (caso especial) |
| `PathwayCards` | `bg-[#0c1e3dcf]`, `border-[#1e3a8aff]`, `text-[#B4C5D6]`, `border-[#22d3ee40]` | `bg-navy-dark/80`, `border-cat-elite/...`, `text-navy-10`, `border-sky/25` |
| `FixturesBar` | `#2563eb`, `#dc2626`, `#10b981`, `#f59e0b`, `#0891b2`, `#64748b` (datos de equipos) | OK (data de fixture, no theme) |
| `FixturesBar` | `bg-navy-10 text-navy` → token existente OK |
| `Sponsors` (logo) | `brightness-0 brightness-50` (sin token) | OK (efecto propio) |

**Hallazgo**: 10+ hex literales con token equivalente disponible. **Acción HIGH**: reemplazar todos por tokens.

### 3.9 Transiciones

| Componente | `transition-*` usado | Cumple DESIGN §6 |
|---|---|---|
| `CategoryCard` | `transition-[border-color,box-shadow] duration-200` | ✓ |
| `PostCard` | `transition-colors duration-200` | ✓ |
| `GalleryGrid` | `transition-shadow duration-200` | ✓ |
| `Navbar` (links) | `transition-colors duration-200` | ✓ |
| `Navbar` (dropdown) | `transition-all duration-200` | ❌ `all` prohibido |
| `Navbar` (cart/profile) | `transition-colors duration-200` | ✓ |
| `Hero` (rotator) | `transition-all duration-500` | ❌ `all` prohibido |
| `Hero` (image) | `transition-all duration-500` | ❌ |
| `Hero` (caption) | `transition-opacity duration-300` | ✓ |
| `Hero` (a link) | `transition-colors duration-200` | ✓ |
| `EnrollmentCta` | (no usa) | — |
| `CommunityMosaic` | `transition-opacity duration-200` | ✓ |
| `CalendarFilters` | `transition-colors duration-150` | ✓ |
| `FixturesBar` | `transition-none` (animación marquee) | OK |
| `Sponsors` | `transition-all duration-300` | ❌ |
| `MatchListItem` | `transition-colors duration-150` | ✓ |
| `ValuePillars` | (no usa) | — |
| `PathwayCards` (a) | `transition-opacity duration-200` | ✓ |
| `HomeCategories` | `transition-[background,padding] duration-200` | ✓ (específico) |
| `WhyPcfc` | (no usa) | — |
| `Lightbox` | `transition: background-color 200ms ease, border-color 200ms ease, color 200ms ease` | ✓ |

**Hallazgo**: 4 usos de `transition-all` (Navbar dropdown, Hero rotator 2×, Sponsors). **Acción MEDIUM**: reemplazar por transiciones específicas.

### 3.10 Borders sobre fondo navy

| Componente | Border literal | Esperado |
|---|---|---|
| `Navbar` | `border-white/5` | ✓ |
| `Navbar` (mobile) | `border-white/5`, `border-white/10` | ✓ |
| `Hero` (rotator) | `border-white/10` | ✓ |
| `Hero` (nextMatch) | `border-t-4 border-sky` | custom pero OK |
| `Footer` | `border-white/5`, `border-white/10` | ✓ |
| `Sponsors` | `border-white/5` | ✓ |
| `ValuePillars` | `border-navy-60/30` | ❌ color no neutral sobre navy |

**Hallazgo**: 1 excepción (`ValuePillars` usa `border-navy-60/30` que es azul medio sobre navy — bajo contraste). **Acción LOW**: cambiar a `border-white/10` para coherencia con el patrón del resto de componentes navy.

### 3.11 SectionHeader usage

| Componente | ¿Usa SectionHeader? | Header inline detectado |
|---|---|---|
| `EnrollmentCta` | ✓ | NO |
| `CommunityMosaic` | ✗ | `eyebrow + h2 + btn` (sin `lede`) |
| `WhyPcfc` | ✗ | `eyebrow + h-section` (sin `lede`) + stats dl |
| `HomeCategories` | ✗ | `eyebrow + h-section + lede` |
| `Sponsors` | ✗ | `eyebrow + h2` (text-[1.5rem]) |
| `ValuePillars` | ✗ | `eyebrow + h2` (text-[2.25rem]) |
| `PathwayCards` | ✗ | NO tiene header (solo grid) |
| `FixturesBar` | — | NO header |
| `Lightbox` | — | NO header |
| `GalleryGrid` | — | NO header |
| `CategoryCard` | — | NO header (es card) |
| `PostCard` | — | NO header (es card) |
| `MatchListItem` | — | NO header (es item) |
| `CalendarFilters` | — | NO header (es filtro) |
| `Navbar` | — | NO header |
| `Footer` | — | NO header (columnas usan h4) |
| `Hero` | ✗ | (Hero tiene h1 con su propia jerarquía) |

**Hallazgo**: 5 secciones (`CommunityMosaic`, `WhyPcfc`, `HomeCategories`, `Sponsors`, `ValuePillars`) reinventan el patrón header en lugar de consumir `SectionHeader`. **Acción HIGH**: migrar 4 secciones (excepto Hero) a `<SectionHeader eyebrow=... title=... subtitle=... onDark=... />`.

### 3.12 Sombras custom

| Componente | `shadow-[...]` literal | Token disponible |
|---|---|---|
| `CategoryCard` | `0 4px 20px rgba(0,40,92,0.08)` | — (sólo este patrón) |
| `GalleryGrid` | `0 4px 20px rgba(0,40,92,0.12)` | — (variante 0.12 vs 0.08) |
| `Navbar` (dropdown) | `0 8px 24px rgba(0,0,0,0.4)` | — |
| `PathwayCards` | `0 8px 8.75px -6px rgba(0,0,0,0.1), 0 20px 21.875px -5px rgba(0,0,0,0.1)` | — |
| `PathwayCards` (a) | `0 1px 1.75px -1px rgba(0,0,0,0.1), 0 1px 2.625px 0 rgba(0,0,0,0.1)` | — |
| `ValuePillars` | `0 4px 5.25px -4px rgba(0,0,0,0.1), 0 10px 13.125px -3px rgba(0,0,0,0.1)` | — |
| `Hero` (rotator) | `0 0 0 2px rgba(66,154,192,0.35), 0 4px 20px rgba(0,40,92,0.12)` | — |
| `FixturesBar` | `0 1px 1.75px rgba(0,0,0,0.05)` | — |
| `Lightbox` | (no usa, usa overlay) | — |

**Hallazgo**: 8 sombras custom únicas. **Acción MEDIUM**: definir `--shadow-card-hover`, `--shadow-card-rest`, `--shadow-dropdown`, `--shadow-modal` en `@theme` como tokens reutilizables.

---

## 4. Tokens definidos vs necesarios

### 4.1 Tokens actualmente en `@theme` (`global.css`)

| Categoría | Tokens |
|---|---|
| **Font** | `--font-display`, `--font-body`, `--font-mono` |
| **Navy** | `--color-navy`, `--color-navy-dark`, `--color-navy-60`, `--color-navy-30`, `--color-navy-10`, `--color-navy-05` |
| **Sky** | `--color-sky`, `--color-sky-60`, `--color-sky-30`, `--color-sky-10` |
| **White** | `--color-white`, `--color-pure-white`, `--color-silver` |
| **Categorías** | `--color-cat-pre`, `--color-cat-form-baja`, `--color-cat-form-alta`, `--color-cat-elite` |
| **Breakpoints** | `--breakpoint-sm`, `--breakpoint-md`, `--breakpoint-lg`, `--breakpoint-xl` |
| **Component classes** | `.container-x`, `.section`, `.h-display`, `.h-section`, `.h-card`, `.eyebrow`, `.lede`, `.btn`, `.badge` + variantes |

### 4.2 Tokens nuevos sugeridos

| Token propuesto | Valor | Justificación | Componentes afectados |
|---|---|---|---|
| `--radius-sm` | `4px` | Badges (4px ya en `.badge`), imágenes lightbox | `Lightbox`, `.badge` |
| `--radius-md` | `6px` | Botones (6px en `.btn`), tabs | `CalendarFilters`, `.btn` |
| `--radius-lg` | `8px` | Cards estándar (DESIGN §4.3) | `CategoryCard`, `PostCard`, `Navbar` dropdown |
| `--radius-xl` | `12px` | Cards grandes, iconos | `PathwayCards` img, `ValuePillars` icon |
| `--radius-2xl` | `16px` | Cards premium, rotator | `Hero` rotator, `PathwayCards` article |
| `--radius-full` | `9999px` | Pills/badges circulares | `Navbar` cart badge |
| `--shadow-card-rest` | `0 1px 2px rgba(0,40,92,0.04)` | Reposo opcional | (futuro) |
| `--shadow-card-hover` | `0 4px 20px rgba(0,40,92,0.08)` | DESIGN §4.3 | `CategoryCard`, `PostCard`, `GalleryGrid` |
| `--shadow-dropdown` | `0 8px 24px rgba(0,0,0,0.4)` | Dropdown navbar | `Navbar` |
| `--shadow-modal` | `0 20px 60px rgba(0,0,0,0.5)` | Modal/lightbox | `Lightbox` (futuro) |
| `--color-surface-cool` | `#F5F8FB` | Fondo tabs/filtros | `CalendarFilters`, `MatchListItem` hover |
| `--color-overlay-modal` | `rgba(0, 20, 40, 0.92)` | Overlay lightbox | `Lightbox` |
| `--color-overlay-image` | `rgba(0, 40, 92, 0.55)` → `0.85` | Gradiente hero | `Hero` |
| `--card-padding` | `1.5rem` | Padding estándar de card | `CategoryCard`, `PostCard` |
| `--section-header-mb` | `clamp(2.5rem, 5vw, 4rem)` | Margen inferior de SectionHeader | `SectionHeader`, `HomeCategories`, `WhyPcfc` |
| `--nav-link-fs` | `0.875rem` | Font-size links navbar | `Navbar` |
| `--stat-value-fs` | `clamp(1.75rem, 3vw, 2.25rem)` | Stats/dt numéricos | `WhyPcfc` |
| `--pillar-number-fs` | `clamp(2rem, 4vw, 2.5rem)` | Números decorativos pilares | `WhyPcfc`, `HomeCategories` |

### 4.3 Clases utilitarias nuevas sugeridas

| Clase | Equivalente a | Componentes que se beneficiarían |
|---|---|---|
| `.card` | `bg-white border border-navy/10 rounded-lg p-6 transition-[border-color,box-shadow] duration-200 hover:border-navy/25 hover:shadow-card` | `CategoryCard`, `PostCard`, `GalleryGrid` item |
| `.card--navy` | `bg-navy-dark border border-white/10 rounded-lg` | `ValuePillars`, `Sponsors` |
| `.nav-link` | `font-body text-[14px] font-medium text-white/70 no-underline transition-colors duration-200 hover:text-sky` | `Navbar` |
| `.text-stat` | `font-display text-[2.25rem] text-navy leading-none tracking-[0.02em]` | `WhyPcfc` |
| `.text-pillar-num` | `font-display text-[2.5rem] text-sky leading-none` | `WhyPcfc`, `HomeCategories` |
| `.divider-list` | `border-t border-navy/10` + child `border-b border-navy/10` | `HomeCategories`, `WhyPcfc` |

---

## 5. Prioridades

### 5.1 Tabla HIGH — bloquean coherencia de marca

| # | Acción | Impacto | Esfuerzo | Riesgo |
|---|---|---|---|---|
| H1 | Adoptar `SectionHeader` en `CommunityMosaic`, `WhyPcfc`, `HomeCategories`, `Sponsors`, `ValuePillars` | Alto: elimina 5 headers divergentes | M (5 archivos, prop swap) | Bajo (cambio mecánico) |
| H2 | Sustituir `max-w-[1280px] mx-auto px-8` por `container-x` en `Sponsors`, `ValuePillars`, `PathwayCards`; eliminar `max-w-[1200px]` en `Hero` | Alto: alinea grid horizontal global | S (3 archivos) | Muy bajo |
| H3 | Definir tokens `--radius-*` en `@theme` y mapear los 6 valores distintos a 5 tokens semánticos | Alto: estandariza geometría de card/button | S (1 archivo + barrido) | Bajo |
| H4 | Reemplazar `bg-[#071D3B]` por `bg-navy-dark` y `hover:text-[#429AC0]` por `hover:text-sky` en `Footer` | Alto: elimina literales con token idéntico | XS (1 archivo) | Nulo |
| H5 | Migrar botón custom de `PathwayCards` a `btn btn--sky` | Alto: unifica sistema de botones | S | Bajo (ajustar padding) |

### 5.2 Tabla MEDIUM — mejoras notables con ROI claro

| # | Acción | Impacto | Esfuerzo | Riesgo |
|---|---|---|---|---|
| M1 | Sustituir `py-12 md:py-14` / `py-14 md:py-16` / `py-16 md:py-20` por `.section` en `PathwayCards`, `Sponsors`, `ValuePillars` | Medio: iguala ritmo vertical | S | Bajo (revisar visuales) |
| M2 | Consolidar patrón hover de cards: introducir `.card` con `--shadow-card-hover`; migrar `CategoryCard`, `PostCard`, `GalleryGrid` | Medio: 1 patrón vs 3 | M | Bajo |
| M3 | Añadir tokens de sombra (`--shadow-card-hover`, `--shadow-dropdown`, `--shadow-modal`) y reemplazar los 8 `shadow-[...]` literales | Medio: 8 sitios limpios | S | Bajo |
| M4 | Definir `--color-surface-cool: #F5F8FB` y usar en `CalendarFilters` y `MatchListItem` | Medio: elimina 2 hex literales | XS | Nulo |
| M5 | Reemplazar `transition-all` por transiciones específicas en `Navbar` dropdown, `Hero` rotator (2×), `Sponsors` | Medio: cumple DESIGN §6 | XS | Nulo |
| M6 | Añadir tokens tipográficos (`--stat-value-fs`, `--pillar-number-fs`, `--nav-link-fs`) y migrar overrides literales | Medio: reduce 13+ literales | M | Bajo |
| M7 | Cambiar `border-navy-60/30` por `border-white/10` en `ValuePillars` | Bajo–medio: coherencia con navbar/footer | XS | Nulo |
| M8 | Sustituir `bg-[#0c1e3dcf]`, `border-[#1e3a8aff]`, `text-[#B4C5D6]`, `border-[#22d3ee40]` en `PathwayCards` por tokens navy-dark/60, cat-elite, navy-10, sky/25 | Medio: limpia 4 literales en sección crítica | XS | Bajo |
| M9 | Añadir `--color-overlay-image` para el gradiente hero y usarlo en `Hero` | Bajo: reduce 1 literal | XS | Nulo |

### 5.3 Tabla LOW — cosméticos y refactors suaves

| # | Acción | Impacto | Esfuerzo | Riesgo |
|---|---|---|---|---|
| L1 | Documentar `--card-padding: 1.5rem` como constante compartida (sin adopción obligatoria, sólo convención) | Bajo | XS | Nulo |
| L2 | Eliminar `style=""` inline de `PathwayCards` (linear-gradient) y moverlo a una clase `.bg-gradient-navy-deep` en `@layer components` | Bajo | XS | Nulo |
| L3 | Unificar `transition-duration` a `200ms` por defecto (actualmente conviven `150`, `200`, `300`, `500`) | Bajo | S | Bajo |
| L4 | Renombrar `data-component="featured-rotator"` a `data-component="hero-rotator"` para clarificar scope | Bajo | XS | Nulo |
| L5 | Añadir `prefers-reduced-motion` en `PathwayCards` (ya cubierto en `Hero`, `Lightbox`, `FixturesBar`) | Bajo | XS | Nulo |
| L6 | Eliminar selector muerto `.sponsor-item:not(:last-child)::after { display: none }` en `Sponsors` | Bajo | XS | Nulo |

---

## 6. Recomendaciones

### 6.1 Unificación de props

1. **Estandarizar la firma `eyebrow + title + subtitle? + onDark? + align?`** en todas las secciones con header — `SectionHeader` ya la implementa; adoptar y deprecar los headers inline.
2. **Añadir prop `compact?: boolean` a `SectionHeader`** para soportar títulos más pequeños (`text-[1.5rem]`) como los de `Sponsors` sin salirse del sistema.
4. **Propagar `navItems` desde un layout único** (`src/layouts/BaseLayout.astro`) en lugar de declararlo en `Navbar` con `Astro.props` + default — facilita testing y consistencia entre páginas.

### 6.2 Adopción de SectionHeader

| Componente | Acción |
|---|---|
| `CommunityMosaic` | `<SectionHeader eyebrow="Comunidad" title="SOMOS MUCHOS,<br/>SOMOS ACTIVOS" onDark />` + slot para CTA |
| `HomeCategories` | `<SectionHeader eyebrow="Categorías" title="UN CAMINO CLARO,<br/>DE 4 A 19 AÑOS" subtitle="Cuatro etapas..." />` |
| `WhyPcfc` | `<SectionHeader eyebrow="Por qué PCFC" title="LO QUE NOS HACE<br/>DIFERENTES" />` (stats van aparte) |
| `Sponsors` | `<SectionHeader eyebrow={eyebrow} title={title} align="center" compact onDark />` |
| `ValuePillars` | `<SectionHeader eyebrow={eyebrow} title={title} align="center" onDark />` |

Para soportar layout "header + acciones al lado" (como `WhyPcfc` con stats a la derecha o `CommunityMosaic` con botón a la derecha) añadir prop opcional `actions` slot:

```astro
<SectionHeader eyebrow=... title=... onDark>
  <div slot="actions">...</div>
</SectionHeader>
```

### 6.3 Token mapping (literal → token)

| Literal actual | Token destino |
|---|---|
| `#071D3B` | `var(--color-navy-dark)` / `bg-navy-dark` |
| `#429AC0` | `var(--color-sky)` / `text-sky` / `bg-sky` |
| `#F5F8FB` | `var(--color-surface-cool)` (nuevo) |
| `rgba(0,40,92,0.07)` | `bg-navy/5` (utility) |
| `rgba(0,40,92,0.08)` | `shadow-card-hover` (nuevo) |
| `rgba(0,40,92,0.10)` | `border-navy/10` |
| `rgba(0,40,92,0.12)` | `shadow-card-hover-lg` o variante |
| `rgba(0,40,92,0.25)` | `border-navy/25` |
| `rgba(66,154,192,...)` | `sky/35`, `sky/50` (utilities) |
| `rgba(255,255,255,0.08)` | `bg-white/8` o `--color-divider-on-navy` |
| `max-w-[1280px] mx-auto px-8` | `.container-x` |
| `max-w-[720px]` | `.max-w-prose` (nuevo utility) |

### 6.4 Nuevos tokens a definir en `@theme`

```css
@theme {
  /* Radius scale */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-2xl: 16px;
  --radius-full: 9999px;

  /* Shadow scale */
  --shadow-card-hover: 0 4px 20px rgba(0, 40, 92, 0.08);
  --shadow-card-hover-lg: 0 4px 20px rgba(0, 40, 92, 0.12);
  --shadow-dropdown: 0 8px 24px rgba(0, 0, 0, 0.4);
  --shadow-modal: 0 20px 60px rgba(0, 0, 0, 0.5);
  --shadow-thumb-rest: 0 1px 1.75px rgba(0, 0, 0, 0.05);

  /* Surface */
  --color-surface-cool: #F5F8FB;
  --color-overlay-modal: rgba(0, 20, 40, 0.92);
  --color-overlay-image-top: rgba(0, 40, 92, 0.55);
  --color-overlay-image-bottom: rgba(0, 40, 92, 0.85);

  /* Type scale */
  --text-stat-value: clamp(1.75rem, 3vw, 2.25rem);
  --text-pillar-number: clamp(2rem, 4vw, 2.5rem);
  --text-nav-link: 0.875rem;

  /* Layout */
  --card-padding: 1.5rem;
  --section-header-mb: clamp(2.5rem, 5vw, 4rem);
}
```

### 6.5 Componentes nuevos a crear

1. `<Card variant="default" | "navy">` — consolida `CategoryCard`, `PostCard`, `GalleryGrid` item en una API común (`title`, `eyebrow`, `image`, `href`).
2. `<SectionHeader actions?>` — extensión con slot para CTAs/stats inline.
3. `<StatBlock value label />` — para `WhyPcfc` stats y futuros KPI grids.
4. `<PillarCard n title copy />` — para `WhyPcfc` y `ValuePillars` (estos últimos usan cards oscuras, parametrizable).

---

## 7. Apéndice — Inventario por archivo

### 7.1 `CalendarFilters.astro` (93 líneas)

- **Props**: ninguna (array `categories` hardcoded).
- **Estructura**: 1 `<div role="tablist">` con 5 `<button role="tab">`s.
- **Estilos**: inline classes + 1 bloque `<style>` para `.calendar-tab.active`.
- **JS**: filtro por `data-category` con toggle de `display` y clase `.active`.
- **Tokens usados**: `color-navy`, `color-white` (via `--var`).
- **Hardcodes**: `#F5F8FB` fondo, `rgba(0,40,92,0.07)` hover, `13px` font-size.
- **Veredicto**: **MEDIUM** — necesita token `--color-surface-cool` y posiblemente rediseñar con `.btn` variante tab.

### 7.2 `CategoryCard.astro` (111 líneas)

- **Props**: 10 (slug, title, ageRange, focus, format, schedule, description, ageMin, ageMax, ctaHref).
- **Estructura**: `<article>` con header (badge), body (h3 + dl) y footer (CTA).
- **JS**: ninguno.
- **Tokens usados**: `bg-white`, `border-navy/10`, `border-navy/25`, `text-navy-30`, `text-navy-60`, `text-sky`, `btn--primary`.
- **Hardcodes**: `shadow-[0_4px_20px_rgba(0,40,92,0.08)]`, `rounded-lg`, `p-6 md:p-8`, `font-display text-[8rem] md:text-[10rem]`.
- **Veredicto**: **HIGH candidato** — buen candidato a ser el "card canónico" para `<Card>` reutilizable.

### 7.3 `CommunityMosaic.astro` (62 líneas)

- **Props**: `images?: GalleryImage[]`.
- **Estructura**: `<section>` + `<header>` (eyebrow + h2 + btn) + `<div class="mosaic grid">` con 5 figures.
- **JS**: ninguno.
- **Tokens usados**: `bg-navy`, `eyebrow--on-navy`, `h-section--on-navy`, `btn--outline-on-navy`, `bg-navy-30`.
- **Hardcodes**: `grid-rows-[200px_160px_160px] md:grid-rows-[280px_220px]`, `transition-opacity duration-200`.
- **Veredicto**: **HIGH** — debe migrar a `SectionHeader onDark` con slot para CTA.

### 7.4 `EnrollmentCta.astro` (46 líneas)

- **Props**: 5 (eyebrow, title, copy, enrollHref, whatsappHref).
- **Estructura**: `<section>` + `<div class="container-x max-w-[720px] text-center">` + header inline + 2 botones.
- **JS**: ninguno.
- **Tokens usados**: `bg-pure-white`, `btn--primary`, `btn--outline`, `btn--lg`.
- **Hardcodes**: `text-[clamp(2.5rem,6vw,4.5rem)]`, `max-w-[720px]`, `mb-10`.
- **Veredicto**: **MEDIUM** — debería usar `SectionHeader align="center"` y tokens de display.

### 7.5 `FixturesBar.astro` (144 líneas)

- **Props**: ninguna (datos inline).
- **Estructura**: `<div role="region">` + marquee con tarjetas planas.
- **JS**: animación CSS (marquee) + pausa por hover.
- **Tokens usados**: `bg-navy-05`, `border-navy-10`, `text-navy-60`, `text-navy-30`, `text-navy`.
- **Hardcodes**: colores por equipo, `w-[80vw]` mezcla, `transition-none`.
- **Veredicto**: **MEDIUM** — colores de equipo son data OK, pero `transition-none` puede ser innecesario. Datos deben venir de una fuente externa.

### 7.6 `Footer.astro` (168 líneas)

- **Props**: ninguna.
- **Estructura**: `<footer>` + grid 4 cols + bottom bar.
- **JS**: ninguno.
- **Tokens usados**: `text-white/70`, `border-white/5`, `border-white/10`.
- **Hardcodes**: `bg-[#071D3B]` (debería ser `bg-navy-dark`), `hover:text-[#429AC0]` (debería ser `hover:text-sky`).
- **Veredicto**: **HIGH** — fix de 2 líneas que restaura la promesa del sistema de tokens.

### 7.7 `GalleryGrid.astro` (117 líneas)

- **Props**: `photos: Photo[]`, `galleryId: string`.
- **Estructura**: `<div class="gallery-grid grid">` con `<button>` items.
- **JS**: dispatcher de `photo:open` CustomEvent.
- **Tokens usados**: `bg-navy-05`, `border-navy/10`, `border-navy/25`, `bg-navy/80`, `rounded-md`, `text-white`.
- **Hardcodes**: `shadow-[0_4px_20px_rgba(0,40,92,0.12)]`, `border-navy-60` (no existe), `text-[0.7rem]`, `bg-navy/80` con alpha distinta.
- **Veredicto**: **MEDIUM** — limpiar literales y consolidar `.card`.

### 7.8 `Hero.astro` (365 líneas)

- **Props**: 10 (eyebrow, title, description, backgroundImage, bullets, ctaPrimary, ctaSecondary, galleryImages, nextMatch, eyebrowOnDark).
- **Estructura**: `<section>` + 2-col grid (texto + rotator) + `<aside>` opcional con next match.
- **JS**: rotación automática del rotator con pausa por hover (`data-component="featured-rotator"`).
- **Tokens usados**: `h-display--on-navy`, `eyebrow--on-navy`, `lede--on-navy`, `bg-navy-dark`, `border-sky`, `border-white/10`, `bg-sky-10`, `text-sky-30`.
- **Hardcodes**: `text-[clamp(...)]` (h1 y bg gradient), `rgba(66,154,192,...)` scrollbar, `rgba(0,40,92,...)` shadows, `transition-all duration-500` (2×).
- **Veredicto**: **MEDIUM** — tokens para overlay image + transición específica; resto es hero justificado.

### 7.9 `HomeCategories.astro` (66 líneas)

- **Props**: `categories: Category[]`.
- **Estructura**: `<section>` + header inline + `<ol>` con rows.
- **JS**: ninguno.
- **Tokens usados**: `eyebrow`, `h-section`, `lede`, `border-navy/10`, `text-navy-10`, `text-navy-30`, `text-sky`, `badge--*`, `bg-sky-10`.
- **Hardcodes**: `text-2xl`, `text-[0.95rem]`, `leading-[1.55]`, `font-bold`, `text-[0.85rem]`, `tracking-[0.08em]`, `transition-[background,padding]`, `mb-[clamp(2.5rem,5vw,4rem)]`.
- **Veredicto**: **HIGH** — migrar a `SectionHeader` y limpiar literales tipográficos.

### 7.10 `Lightbox.astro` (442 líneas)

- **Props**: `defaultGalleryId?: string`.
- **Estructura**: `<div role="dialog" aria-modal="true">` con backdrop, content, img, botones, bar.
- **JS**: listener de `photo:open` + keyboard nav + descarga.
- **Tokens usados**: `font-body`, `--color-white`, `--color-navy`.
- **Hardcodes**: `rgba(0,20,40,0.92)` overlay, `border-radius: 4px`, `outline: 2px solid #429AC0`, `rgba(255,255,255,0.78)`, `rgba(255,255,255,0.18)`, `rgba(255,255,255,0.4)`, `border-color: #FAFAF9`.
- **Veredicto**: **LOW** — overlay modal podría ser token, pero el componente está aislado y bien encapsulado.

### 7.11 `MatchListItem.astro` (133 líneas)

- **Props**: 9 (categorySlug, categoryLabel, date, time?, team1, team2, venue, photosHref?, past?).
- **Estructura**: `<li>` con 4 columnas (fecha, matchup, venue, acciones).
- **JS**: ninguno.
- **Tokens usados**: `border-navy/10`, `bg-white`, `text-navy`, `text-navy-30`, `text-sky`, `badge--*`, `badge--sky`.
- **Hardcodes**: `hover:bg-[#F5F8FB]`, `text-[0.8rem]`, `text-[0.75rem]`, `text-[0.95rem]`.
- **Veredicto**: **MEDIUM** — token `--color-surface-cool` + tokens de tipografía de caption.

### 7.12 `Navbar.astro` (275 líneas)

- **Props**: 2 (currentPath?, navItems?).
- **Estructura**: `<header>` sticky + nav desktop + actions + mobile menu.
- **JS**: dropdown hover + mobile toggle.
- **Tokens usados**: `bg-navy`, `bg-navy-dark`, `bg-sky`, `text-navy-dark`, `text-sky`, `text-white/70`, `border-white/5`, `border-white/10`, `btn--sky`, `btn--lg`.
- **Hardcodes**: `h-[52px]`, `chevron w-[8.75px] h-[5px]`, `shadow-[0_8px_24px_rgba(0,0,0,0.4)]`, `transition-all duration-200` dropdown, `top-[calc(100%+8px)]`, `min-w-[200px]`, `min-w-[max-content]`, `text-[14px]`, `font-medium`.
- **Veredicto**: **MEDIUM** — `--shadow-dropdown` + transición específica + tokens para link de nav.

### 7.13 `PathwayCards.astro` (97 líneas)

- **Props**: `cards: PathwayCard[]`.
- **Estructura**: `<section>` + `<div class="max-w-[1280px] mx-auto px-8">` + grid 2 cols + articles.
- **JS**: ninguno.
- **Tokens usados**: `text-sky`, `text-navy-30`, `bg-sky`, `text-navy-dark`, `bg-navy-30`.
- **Hardcodes (MUCHOS)**: `style="background: linear-gradient(...)"`, `bg-[#0c1e3dcf]`, `border-2 border-[#1e3a8aff]`, `rounded-2xl`, `shadow-[0_8px_8.75px_-6px_rgba(0,0,0,0.1),...]`, `text-[#B4C5D6]`, `text-[1.5rem] md:text-[1.375rem]`, `font-bold tracking-[-0.6px]`, `tracking-[0.6px]`, `border border-[#22d3ee40]`, `aspect-[176/192]`, `rounded-xl`, `transition-opacity duration-200`, `hover:opacity-90`, botón custom sin `.btn`.
- **Veredicto**: **HIGH** — el componente con más deuda. Migrar contenedor, tokens, botón y header (no tiene pero podría tener).

### 7.14 `PostCard.astro` (98 líneas)

- **Props**: 9 (href, thumbnail, thumbnailAlt, categorySlug, categoryLabel, team1, team2, date, photoCount?).
- **Estructura**: `<article>` + `<a>` con thumbnail + info.
- **JS**: ninguno.
- **Tokens usados**: `bg-white`, `border-navy/10`, `border-navy/25`, `bg-navy-05`, `bg-navy/80`, `text-navy`, `text-navy-30`, `badge--*`.
- **Hardcodes**: `rounded-lg`, `transition-colors duration-200`, `text-[0.7rem]`, `font-semibold`, `text-[0.95rem]`, `leading-snug`.
- **Veredicto**: **MEDIUM** — buen candidato a `<Card variant="default">`.

### 7.15 `SectionHeader.astro` (44 líneas)

- **Props**: 5 (eyebrow, title, subtitle?, onDark?, align?).
- **Estructura**: `<header>` con eyebrow + h2 + lede opcional.
- **JS**: ninguno.
- **Tokens usados**: `eyebrow`, `h-section`, `lede`, `eyebrow--on-navy`, `h-section--on-navy`, `lede--on-navy`.
- **Hardcodes**: `max-w-[720px]`, `mb-[clamp(2.5rem,5vw,4rem)]`, `text-left`, `text-center mx-auto`.
- **Veredicto**: **HIGH** — necesita extensión con slot `actions` y prop `compact` para soportar los 5 sitios que lo necesitan.

### 7.16 `Sponsors.astro` (103 líneas)

- **Props**: 3 (eyebrow?, title?, sponsors: Sponsor[]).
- **Estructura**: `<section>` + header opcional + list.
- **JS**: ninguno.
- **Tokens usados**: `bg-navy-dark`, `border-white/5`, `eyebrow` + `text-sky`, `text-white/30`.
- **Hardcodes**: `max-w-[1280px] mx-auto px-8`, `py-14 md:py-16`, `text-[1.5rem] md:text-[1.75rem]`, `leading-[1.2]`, `font-bold`, `tracking-[0.5px]`, `text-white`, `brightness-0 brightness-50 group-hover:brightness-100`, `transition-all duration-300`.
- **Veredicto**: **HIGH** — migrar a `SectionHeader compact onDark` + `container-x` + `.section` + transición específica.

### 7.17 `ValuePillars.astro` (89 líneas)

- **Props**: 3 (eyebrow?, title, pillars: Pillar[]).
- **Estructura**: `<section>` + header + `<ol>` grid 3 cols.
- **JS**: ninguno.
- **Tokens usados**: `bg-navy-dark`, `eyebrow` + `text-sky`, `bg-sky/5`, `border-sky`, `text-white`, `text-white/70`.
- **Hardcodes**: `py-16 md:py-20`, `max-w-[1280px] mx-auto px-8`, `text-[2.25rem] md:text-[2.75rem]`, `leading-[1.1]`, `tracking-[0.9px]`, `text-[1.125rem]`, `text-[0.875rem]`, `rounded-xl`, `shadow-[0_4px_5.25px_-4px_rgba(0,0,0,0.1),0_10px_13.125px_-3px_rgba(0,0,0,0.1)]`, `border-navy-60/30` (debería ser `border-white/10`), `bg-sky/5` (token útil).
- **Veredicto**: **HIGH** — contenedor, sección, tokens tipográficos, sombra y border por limpiar.

### 7.18 `WhyPcfc.astro` (61 líneas)

- **Props**: 2 (stats, pillars).
- **Estructura**: `<section>` + header con stats inline + `<ol>` con pillars.
- **JS**: ninguno.
- **Tokens usados**: `bg-pure-white`, `eyebrow`, `h-section`, `text-navy`, `text-navy-30`, `text-sky`, `border-navy/10`.
- **Hardcodes**: `text-[2.25rem]`, `text-[0.7rem]`, `text-[2.5rem]`, `text-[0.95rem]`, `leading-[1.6]`, `leading-[1.55]`, `tracking-[0.02em]`, `tracking-[0.12em]`, `mb-[clamp(2.5rem,5vw,4rem)]`, `font-display`, `text-sky leading-none`, `font-semibold`.
- **Veredicto**: **HIGH** — extraer `<StatBlock>` y `<PillarCard>` + migrar header a `SectionHeader` + tokens tipográficos.

---

## 8. Métricas de estandarización

### 8.1 Antes del plan (estado actual)

| Métrica | Valor |
|---|---|
| Componentes que usan `container-x` | 7/18 (39%) |
| Componentes que usan `.section` | 4/18 (22%) |
| Componentes que usan `SectionHeader` | 1/18 (6%) |
| Valores hex/rgba hardcodeados en CSS | ~30+ |
| Valores `transition-all` | 4 |
| Sombras custom únicas | 8 |
| Border-radius distintos | 6 |
| Botones custom (no `.btn`) | 1 (`PathwayCards`) |

### 8.2 Después del plan (objetivo)

| Métrica | Valor objetivo |
|---|---|
| Componentes que usan `container-x` | 18/18 (100%) |
| Componentes que usan `.section` (excepto Hero) | 17/18 (94%) |
| Componentes que usan `SectionHeader` (donde aplique) | 5/5 secciones (100%) |
| Valores hex/rgba hardcodeados en CSS | <5 (sólo casos justificados) |
| Valores `transition-all` | 0 |
| Sombras custom únicas | 4 (todas como tokens) |
| Border-radius distintos | 5 (escala semántica) |
| Botones custom | 0 |

### 8.3 Reducción estimada de código

| Categoría | Líneas a eliminar | % del total componentes |
|---|---|---|
| Clases literales redundantes | ~120 | ~12% |
| Hardcodes reemplazados por tokens | ~80 | ~8% |
| Headers inline reemplazados por `<SectionHeader>` | ~45 | ~5% |
| **Total estimado** | **~245 líneas** | **~13%** |

---

*Documento generado el 2026-09-05 · Análisis estático de 18 componentes Astro · PCFC Design System v1.0*