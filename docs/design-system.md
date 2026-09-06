# Design System — Punta Cana FC

**Proyecto:** PCFC — Academia Premium de Alto Rendimiento del Caribe
**Stack:** Astro 7 + Tailwind v4 + Cloudflare Workers
**Dominio:** puntacanafc.com
**Versión:** 1.0 · Septiembre 2026

> Esta guía es la referencia visual oficial para cualquier desarrollador que trabaje en este proyecto. Todo lo que se construya para PCFC debe respetar estas reglas sin excepción.

---

## 1. Identidad visual

### Quiénes somos

Punta Cana FC es una academia premium de alto rendimiento del Caribe dominicano. La web transmite un club serio, metódico y cercano — no un startup tech, no un juego, no una tienda genérica.

### Referencias culturales

| Referencia | Aplicación |
|---|---|
| **Heráldica deportiva europea** | El escudo como eje, simetría, contundencia visual, Bowlby One SC |
| **Minimalismo editorial** | Tipografía como protagonista, whitespace generoso, ritmo |
| **Caribe luminoso** | Fotografía real, luz natural, tonos cálidos sobre navy/celeste |

### Personalidad

- **Serio y profesional** — no juvenil ni startup
- **Caribe premium** — no genérico, no genérico SaaS
- **Deportivo** — no gaming, no neón

### Qué NO somos

No somos una app de fútbol fantasy. No somos un sitio gaming/neon. No somos un startup SaaS. No somos una tienda de camisetas. No somos una agencia de diseño. No somos una ONG genérica con "cambiar el mundo".

---

## 2. Paleta de colores

### Colores principales

| Nombre | HEX | Usos permitidos | Usos prohibidos |
|---|---|---|---|
| PCFC Navy | `#00285C` | Fondos hero/CTA/footer, títulos principales, nav | Texto sobre celeste claro (contraste insuficiente) |
| PCFC Sky | `#429AC0` | CTAs primarios, badges, hover, acentos, enlaces | Texto cuerpo sobre blanco (ratio 3.1:1 — solo grande) |
| PCFC White | `#FAFAF9` | Fondos generales, texto sobre navy | Piezas de marca impresas (usar #FAFAF9) |
| Pure White | `#FFFFFF` | Fondos digitales estándar, cards | Piezas de marca (usar #FAFAF9) |
| PCFC Silver | `#C8C8C8` | Bordes, separadores, líneas finas | Texto (ratio 1.6:1 sobre blanco — contraste insuficiente) |

### Escala de apoyo

| Color | HEX | Uso |
|---|---|---|
| Navy Dark | `#071D3B` | Footer, fondos oscuros, nav cuando hay overlay |
| Navy 60 | `#33547F` | Hover states sobre navy, bordes activos |
| Navy 30 | `#6685A6` | Texto secundario sobre fondos claros, iconos |
| Navy 10 | `#B4C5D6` | Bordes claros, fondos de separadores |
| Navy 05 | `#E8F0F5` | Fondos de card con marca de agua, fondos suaves |
| Sky 60 | `#79B8D3` | Hovers sobre celeste, badges informativos |
| Sky 30 | `#B4D7E5` | Fondos suaves, separadores cromáticos |
| Sky 10 | `#E1F0F6` | Fondos muy sutiles, chips |

### Badges por categoría

| Categoría | Color texto | HEX | Fondo |
|---|---|---|---|
| Pre-Formativas (4–8 años) | Verde mar | `#1A8A6A` | `rgba(26,138,106,0.12)` |
| Formativas Bajas (9–12) | Celeste profundo | `#2E7D9B` | `rgba(46,125,155,0.12)` |
| Formativas Altas (13–15) | Dorado premium | `#B8860B` | `rgba(184,134,11,0.14)` |
| Elite / Reserva (16–19) | Navy intenso | `#001F42` | `rgba(0,31,66,0.10)` |

---

## 3. Tipografía

### Familias tipográficas

**Bowlby One SC** — Display, slab serif rotunda, mayúscula, heráldica deportiva.
Para: H1, H2, portadas, titulares de partido, cartelería.
En web: 48–64px. Jamás usar para cuerpo de texto.

**Inter** — Sans serif neutra, alta legibilidad en pantalla.
Para: todo lo demás — cuerpo, UI, captions, formularios, badges.
Base: 16px. Captions: 14px. UI: 14–16px.

**Montserrat** — Declarada pero de uso marginal. Reservada para acentos técnicos o números decorativos.

### Jerarquía tipográfica

| Nivel | Familia | Tamaño web | Peso | Uso |
|---|---|---|---|---|
| H1 | Bowlby One SC | 48–64px | 400 | Títulos principales, hero |
| H2 | Bowlby One SC | 32–40px | 400 | Secciones, titulares de partido |
| H3 | Inter | 24–28px | 700 | Subtítulos |
| H4 | Inter | 20px | 600 | Encabezados de tarjetas |
| Body | Inter | 16px | 400 | Párrafos, noticias |
| Caption | Inter | 14px | 500 | Fechas, metadatos, pies de foto |
| UI | Inter | 14–16px | 600 | Botones, menús, campos |
| Badge | Inter | 11px | 600 | Badges de categoría, uppercase, tracking 1px |

### Reglas de uso

- **Contraste de escala es la personalidad** — H1 debe ser MUCH más grande que body. Nunca tamaños uniformes en toda la página.
- **Versalitas/mayúsculas:** Bowlby en versalitas para titulares. Respetar acentos del español.
- **Nunca** más de 2 familias en una pieza.
- **Nunca** scripts decorativas ni tipografías manuscritas.
- **Todo texto** debe pasar WCAG AA (4.5:1 mínimo).

### Clases CSS tipográficas

```css
.h-display          /* Bowlby, uppercase, tracking -0.01em */
.h-display--on-navy /* Texto blanco sobre fondo navy */
.h-section          /* Bowlby, clamp(2rem,4vw,2.75rem), uppercase */
.h-section--on-navy
.eyebrow            /* Inter 12px, 600, uppercase, tracking 0.15em, sky */
.eyebrow--on-navy  /* Sky 30 sobre navy */
.lede               /* Inter 18px, color navy-30, max-width 60ch */
.lede--on-navy     /* rgba(255,255,255,0.78) sobre navy */
```

---

## 4. Componentes

### 4.1 Botones

| Variante | Clase | Estilo |
|---|---|---|
| Primario | `.btn.btn--primary` | Fondo `#00285C`, texto `#FAFAF9` |
| Sky/CTA | `.btn.btn--sky` | Fondo `#429AC0`, texto `#FAFAF9` |
| Outline | `.btn.btn--outline` | Borde `#429AC0`, texto `#00285C`, fondo transparente |
| Outline sobre navy | `.btn.btn--outline-on-navy` | Borde `rgba(255,255,255,0.4)`, texto blanco |
| Tamaño grande | `.btn--lg` | Padding 18px 36px, font-size 16px |

**Transición:** `border-color 200ms ease, background-color 200ms ease, color 200ms ease`. **Nunca `transform` ni `transition: all`.**

```html
<a href="/inscribete" class="btn btn--primary">Inscríbete</a>
<a href="/club" class="btn btn--outline">Conoce el club</a>
```

### 4.2 Badges de categoría

```html
<span class="badge badge--pre">Pre-Formativas</span>
<span class="badge badge--form-baja">Formativas Bajas</span>
<span class="badge badge--form-alta">Formativas Altas</span>
<span class="badge badge--elite">Elite / Reserva</span>
```

- Font: Inter 600, 11px, uppercase, letter-spacing 1px
- Padding: 4px 10px
- Border-radius: 4px
- Fondo: color a ~12% opacidad, texto: color sólido

### 4.3 Cards

- Fondo: `#FFFFFF` o `#FAFAF9`
- Borde: `1px solid rgba(0, 40, 92, 0.10)`
- Border-radius: `8px`
- Padding: `1.5rem`
- **Hover:** borde `rgba(0, 40, 92, 0.25)` + sombra sutil `0 4px 20px rgba(0,40,92,0.08)`
- **NUNCA hover:scale, nunca glassmorphism, nunca fondo saturado**

### 4.4 PostCard (galería de fotos)

```html
<PostCard
  href="/fotos#pcfc-vs-atlantico-6sep"
  thumbnail="https://..."
  thumbnailAlt="PCFC vs Atlántico FC — Partido Elite"
  categorySlug="elite"
  categoryLabel="Elite / Reserva"
  team1="PCFC"
  team2="Atlántico FC"
  date="6 sep 2026"
  photoCount={24}
/>
```

Thumbnail: aspect-ratio 4:3, object-fit cover. Debajo: badge + fecha + título "[Equipo PCFC] vs [Rival]" (ej: "Reserva vs Atlético FC", "Sub-12 vs Huracán").

### 4.5 GalleryGrid

Grid responsive de fotos en un post individual de galería.

- **Columnas:** 4 desktop, 3 tablet, 2 mobile
- **Gap:** 12px
- **Thumbnails:** aspect-ratio 4:3, object-fit cover
- **Hover:** sombra sutil `rgba(0,40,92,0.12)`, borde navy/25
- Click → dispara `photo:open` CustomEvent que `<Lightbox />` consume

```html
<GalleryGrid photos={photos} galleryId="pcfc-vs-atlantico-6sep" />
```

### 4.6 Lightbox

Overlay a pantalla completa para ver fotos.

- **Overlay:** `rgba(0, 20, 40, 0.92)`
- **Foto:** max-height 85vh, object-fit contain
- **Botones:** cerrar (×), descargar (↓), flechas (← →)
- **Keyboard:** `Escape` cierra, `←`/`→` navega
- **Descarga:** `<a download>` — botón ↓ descarga la foto original

```html
<Lightbox />
```

### 4.7 Header / Nav

- Fijo (sticky), fondo `#00285C` (sin blur — la spec §7 lo prohíbe como elemento decorativo)
- Logo (escudo) a la izquierda
- Nav items: Inter 600, 14px, texto `#FAFAF9`, hover `#429AC0`
- CTA "Inscríbete" al final: fondo `#429AC0`, texto blanco

### 4.8 Footer

- Fondo `#071D3B` (navy oscuro)
- Grid de 4 columnas: logo/descripción, Club, Categorías, Contacto
- Texto `rgba(255,255,255,0.7)`, links hover `#429AC0`
- Separador: `border-top: 1px solid rgba(255,255,255,0.08)`
- Bottom: copyright + "Hecho en Punta Cana"

### 4.9 CalendarioFilters

- Tabs horizontales: las 4 categorías + "Todas"
- Tab inactiva: fondo `#F5F8FB`, texto navy
- Tab activa: fondo navy, texto blanco
- Font: Inter 600, 13px

---

## 5. Patrones de layout

### Sistema de capas

| Capa | Descripción | Colores de fondo |
|---|---|---|
| **Capa 0** | Fondo base | Blanco `#FFFFFF` o navy `#00285C` |
| **Capa 1** | Contenedores | `#FAFAF9` o `#FFFFFF`, borde `rgba(0,40,92,0.10)` |
| **Capa 2** | Superficies oscuras | `#00285C` o `#071D3B`, borde `rgba(255,255,255,0.08)` |

### Separación visual

| Situación | Método correcto | Prohibido |
|---|---|---|
| Cards en una misma fila | Whitespace generoso (gap ≥ 2rem) | Líneas divisorias, sombras gruesas |
| Sección navy → sección blanca | Borde fino `rgba(0,40,92,0.10)` o cambio de fondo | Gradientes diagonales, líneas gruesas |
| Hover en card | Borde `rgba(0,40,92,0.25)` + sombra `0 4px 20px rgba(0,40,92,0.08)` | scale, glow |
| Navegación sticky | `position: sticky`, `bg-navy` con `backdrop-blur` | Glassmorphism decorativo |

### Container

```html
<div class="container-x">
  <!-- max-width 1280px, padding lateral clamp(1.25rem, 4vw, 2.5rem) -->
</div>
```

### Section padding

```html
<section class="section">
  <!-- padding-top/bottom clamp(4rem, 8vw, 6rem) -->
</section>
```

---

## 6. Animaciones

### Reglas GSAP

- GSAP 3.x, importaciones centralizadas
- **Siempre** respetar `prefers-reduced-motion`

### Tipos y duraciones

| Tipo | Ejemplo | Duración |
|---|---|---|
| Text reveal | SplitText blur fade-in, stagger 0.03s | 800–1200ms |
| Parallax decorativo | Elementos de fondo se mueven más lento | Velocidad suave, solo decor |
| UI micro | Hover de botón, cambio de tab | 150–200ms |
| Entry | Sección aparece al scroll | 600–900ms, ease-out |

### Reglas estrictas

- **NUNCA** `transition: all` — especificar propiedades exactas
- **NUNCA** rebote/elastic en elementos de UI
- Duración UI: **< 200ms**. Duración reveals: **800–1200ms**
- Parallax: solo en elementos decorativos (números de fondo, patrones). **NUNCA en contenido funcional**
- Entry del hero: fade-up sutil y firme, sin rebote

### Ejemplo de transición CSS correcta

```css
.btn--primary {
  transition: background-color 200ms ease, border-color 200ms ease, color 200ms ease;
}
```

### Ejemplo de transición prohibida

```css
/* ❌ PROHIBIDO */
.card {
  transition: all 300ms ease;
}
/* ✅ CORRECTO */
.card {
  transition: border-color 200ms ease, box-shadow 200ms ease;
}
```

---

## 7. Reglas de prohibición (lo que NUNCA hacer)

### Layout

- ❌ Filas de 3 cards idénticas alineadas al mismo tamaño
- ❌ Alternancia texto/imagen/txt/imagen genérica
- ❌ Hero centrado con título + 2 botones + mockup flotante
- ❌ Grid de 4–6 iconos circulares con título y párrafo debajo
- ❌ Carrusel de testimonios con estrellas de valoración
- ❌ Secciones de "Nuestros servicios" con iconos genéricos

### Estilo visual

- ❌ Glassmorphism / `backdrop-blur` como elemento decorativo
- ❌ Fondos de card saturados: rosa, emerald, violeta, naranja, amarillo
- ❌ `hover:scale()` o `transform: scale(1.05)` en cards
- ❌ Grays de Tailwind: gray-50, gray-100, gray-200
- ❌ Todos los botones iguales en tamaño y estilo
- ❌ Transiciones > 300ms
- ❌ Imágenes con opacidad reducida (`filter: saturate(0.3)`)
- ❌ Sombras difusas como separadores entre secciones
- ❌ Líneas divisorias gruesas (>2px)

### Neon / Glow

- ❌ Gradientes tipo neon o cian brillante
- ❌ `box-shadow: 0 0 30px rgba(...)`
- ❌ `backdrop-filter: blur()` como decoración
- ❌ Borders con brillo (`border-glow`)
- ❌ Animaciones de parpadeo/pulse en elementos decorativos
- ❌ Gradientes diagonales como fondo de sección

### Copy

- ❌ Headlines genéricos: "Nuestros servicios", "Lo que ofrecemos", "Contáctanos"
- ❌ Subtítulos de relleno que no dicen nada
- ❌ CTAs sin contexto: "Haz clic aquí", "Leer más", "Ver todo"
- ❌ Mezclar inglés y español innecesariamente

---

## 8. Accesibilidad

### Contraste de color (WCAG AA)

| Combinación | Ratio | Cumplimiento |
|---|---|---|
| Navy `#00285C` sobre blanco `#FAFAF9` | 14.6:1 | ✅ Cumple |
| Blanco sobre navy | 14.6:1 | ✅ Cumple |
| Sky `#429AC0` sobre navy | 4.4:1 | ✅ Cumple (texto normal) |
| Sky sobre blanco | 3.1:1 | ⚠️ Solo texto grande (≥18pt) o bold |
| Silver `#C8C8C8` sobre blanco | 1.6:1 | ❌ Nunca para texto |

### Navegación

- Focus rings visibles: `outline: 2px solid #429AC0; outline-offset: 2px`
- `aria-current="page"` en el link activo del nav
- Skip-to-content link para lectores de pantalla
- `aria-label` descriptivo en todos los botones e iconos

### Formularios

- Labels siempre visibles (nunca solo placeholder)
- Estados de error: borde rojo `#D32F2F` + mensaje descriptivo debajo
- Campos con `aria-required`, `aria-describedby` para errores
- Submit button deshabilitado hasta validación básica

### Multimedia

- `alt` text descriptivo en todas las fotos (incluye categoría + rival + fecha si es posible)
- `prefers-reduced-motion: reduce` → desactivar todas las animaciones GSAP
- Videos con subtítulos

### Jerarquía de encabezados

- Solo **un H1** por página
- H2 → H3 → H4 en orden descendente, sin saltar niveles

---

## 9. Tokens de diseño (variables CSS)

Los tokens viven en `src/styles/global.css` dentro de `@theme {}` (Tailwind v4). Están disponibles como clases utilitarias en todo el proyecto.

### Tipografía

```css
--font-display: "Bowlby One SC", "Georgia", serif;
--font-body: "Inter", system-ui, -apple-system, sans-serif;
--font-mono: "Montserrat", system-ui, sans-serif;
```

### Colores principales

```css
--color-navy: #00285C;
--color-navy-dark: #071D3B;
--color-navy-60: #33547F;
--color-navy-30: #6685A6;
--color-navy-10: #B4C5D6;
--color-navy-05: #E8F0F5;

--color-sky: #429AC0;
--color-sky-60: #79B8D3;
--color-sky-30: #B4D7E5;
--color-sky-10: #E1F0F6;

--color-white: #FAFAF9;
--color-pure-white: #FFFFFF;
--color-silver: #C8C8C8;
```

### Categorías

```css
--color-cat-pre: #1A8A6A;
--color-cat-form-baja: #2E7D9B;
--color-cat-form-alta: #B8860B;
--color-cat-elite: #001F42;
```

### Breakpoints

```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 960px;
--breakpoint-xl: 1280px;
```

### Clases utilitarias disponibles

```css
/* Fondos */
bg-navy         /* background: #00285C */
bg-navy-dark    /* background: #071D3B */
bg-navy-60      /* background: #33547F */
bg-sky          /* background: #429AC0 */
bg-pure-white   /* background: #FFFFFF */
bg-navy-05      /* background: #E8F0F5 */

/* Texto */
text-navy       /* color: #00285C */
text-sky        /* color: #429AC0 */
text-navy-30    /* color: #6685A6 */
text-white      /* color: #FAFAF9 */

/* Bordes */
border-navy/10  /* border-color: rgba(0,40,92,0.10) */
border-white/10 /* border-color: rgba(255,255,255,0.10) */

/* Sombras */
shadow-[0_4px_20px_rgba(0,40,92,0.12)]
```

### Clases de componentes

```css
.container-x   /* max-width 1280px, centrado, padding lateral clamp */
.section        /* padding-top/bottom clamp(4rem, 8vw, 6rem) */
```

---

*Design System · Punta Cana FC · v1.0 · Septiembre 2026*
