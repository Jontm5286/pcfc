# DESIGN.md — Punta Cana FC

**Proyecto:** PCFC — Academia Premium de Alto Rendimiento
**Stack:** Astro 7 + EmDash CMS + Tailwind v4 + Cloudflare Workers
**Dominio:** puntacanafc.com
**Versión:** 1.0 · Septiembre 2026

---

## 1. Identidad visual (web)

### Quiénes somos
Punta Cana FC es una academia premium de alto rendimiento del Caribe dominicano. La web debe sentirse como lo que es: un club serio, metódico y cercano — no un startup tech, no un juego, no una tienda genérica.

### Referencias culturales
- **Heráldica deportiva europea** — el escudo como eje, simetría, contundencia visual.
- **Minimalismo editorial** — tipografía como protagonista, whitespace generoso, ritmo.
- **Caribe luminoso** — fotografía real, luz natural, tonos cálidos en las fotos contra navy/celeste.

### Qué NO somos
- No somos una app de fútbol fantasy.
- No somos un sitio gaming/neon.
- No somos un startup de SaaS.
- No somos una tienda de camisetas.
- No somos una agencia de diseño.
- No somos una ONG genérica con "cambiar el mundo".

---

## 2. Prohibiciones de diseño (SECCIÓN CRÍTICA)

### Layout — NUNCA
- Filas de 3 cards idénticas alineadas al mismo tamaño.
- Alternancia texto/imagen/txt/imagen genérica.
- Hero centrado con título + 2 botones + mockup flotante.
- Grid de 4-6 iconos circulares con título y párrafo debajo.
- Carrusel de testimonios con estrellas de valoración.
- Secciones de "Nuestros servicios" con iconos genéricos.

### Estilo — NUNCA
- Glassmorphism / backdrop-blur como elemento decorativo.
- Fondos de card saturados: rosa, emerald, violeta, naranja, amarillo como bg.
- `hover:scale()` o `transform: scale(1.05)` en cards.
- Grays de Tailwind: gray-50, gray-100, gray-200. (Usar la escala navy de la marca.)
- Todos los botones iguales en tamaño y estilo.
- Transiciones > 300ms.
- Imágenes con opacidad reducida (usar grayscale `filter: saturate(0.3)`).
- Sombras difusas como separadores entre secciones.

### Neon / Glow — NUNCA
- Sin gradientes tipo neon o cian brillante.
- Sin sombras glow (`box-shadow: 0 0 30px rgba(...)`).
- Sin `backdrop-filter: blur()` como decoración.
- Sin borders con brillo (`border-glow`).
- Sin animaciones de parpadeo/pulse en elementos decorativos.
- Sin gradientes diagonales como fondo de sección.

### Copy — NUNCA
- Headlines genéricos: "Nuestros servicios", "Lo que ofrecemos", "Contáctanos".
- Subtítulos de relleno que no dicen nada.
- CTAs sin contexto: "Haz clic aquí", "Leer más", "Ver todo".
- Mezclar inglés y español innecesariamente.

---

## 3. Arquitectura de superficies (sistema de capas)

### Capa 0 — Fondo base
- **Blanco limpio** `#FFFFFF` para secciones de contenido (categorias, club, inscripción).
- **Navy** `#00285C` para hero, CTA, footer, headers de página.

### Capa 1 — Contenedores
- Fondo `#FAFAF9` (blanco de marca) o `#FFFFFF`.
- Borde sutil: `border: 1px solid rgba(0, 40, 92, 0.10)` — navy a 10%.
- Border-radius: `8px` para cards, `12px` para contenedores grandes.
- Sin sombras estáticas.

### Capa 2 — Superficies oscuras
- Fondo `#00285C` (navy) o `#071D3B` (navy oscuro).
- Bordes: `border: 1px solid rgba(255, 255, 255, 0.08)`.
- Texto: blanco `#FAFAF9`.

### Reglas de separación
| Situación | Método |
|---|---|
| Misma capa (ej. dos cards) | Whitespace generoso (gap ≥ 2rem) |
| Capas diferentes (ej. sección navy + sección blanca) | Borde fino `rgba(0,40,92,0.10)` O cambio de fondo |
| Elevación interactiva (hover) | Sombra sutil navy: `box-shadow: 0 4px 20px rgba(0,40,92,0.12)` |
| **NUNCA** | Líneas gruesas, sombras como separadores, divisores de color fuerte |

---

## 4. Paleta de color — restricciones de uso

### Paleta oficial (del Manual de Marca)

| Color | Nombre | HEX | Uso permitido | Uso PROHIBIDO |
|---|---|---|---|---|
| Azul marino | PCFC Navy | `#00285C` | Fondos hero/CTA/footer, títulos, nav | Texto sobre celeste claro (contraste insuficiente) |
| Celeste | PCFC Sky | `#429AC0` | CTAs, badges, hover, acentos | Texto cuerpo sobre blanco (ratio 3.1:1, solo grande) |
| Blanco | PCFC White | `#FAFAF9` | Fondos generales, texto sobre navy | — |
| Blanco puro | Pure White | `#FFFFFF` | Fondos digitales estándar | Piezas de marca (usar #FAFAF9) |
| Plata | PCFC Silver | `#C8C8C8` | Bordes, separadores, líneas finas | Texto (ratio 1.6:1 sobre blanco) |

### Escala de apoyo

| Color | HEX | Uso |
|---|---|---|
| Navy 60 | `#33547F` | Hover states sobre navy, bordes activos |
| Navy 30 | `#6685A6` | Fondos de cards sobre navy, superficies secundarias |
| Sky 60 | `#79B8D3` | Hovers sobre celeste, badges informativos |
| Sky 30 | `#B4D7E5` | Fondos suaves, separadores cromáticos |

> **Regla:** los tonos claros (30, 60) sirven para superficies, hovers y separadores. **Nunca para texto crítico.**

### Badges por categoría

| Categoría | Badge | HEX |
|---|---|---|
| Pre-Formativas (4-8) | 🟢 Verde mar | `#1A8A6A` |
| Formativas Bajas (9-12) | 🔵 Celeste profundo | `#2E7D9B` |
| Formativas Altas (13-15) | 🟡 Dorado Premium | `#B8860B` |
| Elite/Reserva (16-19) | 🟣 Navy intenso | `#001F42` |

> Los badges usan `font-family: Inter; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; padding: 4px 10px; border-radius: 4px;`. Fondos con opacidad 10% del color, texto con color sólido.

---

## 5. Tipografía

### Familias (Google Fonts)

**Display — Bowlby One SC**
Slab serif rotunda, mayúscula, con personalidad de heráldica deportiva. Para H1, H2, portadas, titulares de partido, camisetas, cartelería. Tamaño: **48–64px en web**, 32–40pt en impresión.

**Texto — Inter**
Sans serif neutra, muy legible en pantalla. Para todo lo demás: cuerpo, UI, captions, formularios, badges. Tamaño base: **16px**, captions 14px, UI 14–16px.

### Regla de contraste de escala
H1/H2 deben ser **MUY grandes** — nunca tamaños uniformes en toda la página. El contraste de escala ES la personalidad tipográfica. Un título H1 a 64px旁边 es un subtítulo a 16px. Ese contraste es el ADN.

### Jerarquía

| Nivel | Familia | Tamaño web | Uso |
|---|---|---|---|
| H1 | Bowlby One SC | 48–64px | Títulos principales, portadas, hero |
| H2 | Bowlby One SC | 32–40px | Secciones, titulares de partido |
| H3 | Inter Bold | 24–28px | Subtítulos |
| H4 | Inter SemiBold | 20px | Encabezados de tarjetas |
| Body | Inter Regular | 16px | Párrafos, noticias, copys |
| Caption | Inter Medium | 14px | Pies de foto, metadatos, fechas |
| UI | Inter Medium | 14–16px | Botones, menús, campos de formulario |
| Badge | Inter SemiBold | 11px | Badges de categoría (uppercase, tracking 1px) |

### Reglas
- **Versalitas/mayúsculas:** Bowlby en versalitas o mayúsculas para titulares. Respetar capitalización del español.
- **Acentos siempre:** VISIÓN, MISIÓN, CATEGORÍA, TAMBIÉN, AÑOS, FUTBOLISTAS, PRÓXIMO, NÚMERO.
- **No mezclar** más de 2 familias en una pieza.
- **Sin scripts** decorativas ni tipografías manuscritas.
- **High contrast:** todo texto debe pasar WCAG AA (4.5:1).

---

## 6. Sitemap narrativo

Cada página tiene un arco emocional. No es solo "hero + features + CTA".

### HOME (`/`)
| Sección | Intención emocional |
|---|---|
| Hero: próximo partido + CTA | **Impacto** — "Aquí se juega, aquí se forma" |
| Categorías (Pre-Formativas → Elite) | **Progresión** — "Tu hijo tiene un camino claro" |
| Últimas fotos de partidos | **Comunidad** — "Somos muchos, somos activos" |
| Inscripción CTA | **Acción** — "El siguiente paso es ahora" |

### CALENDARIO (`/calendario`)
| Sección | Intención emocional |
|---|---|
| Filtros por categoría | **Control** — "Encuentra lo que necesitas" |
| Próximos partidos | **Anticipación** — "Ya viene el siguiente" |
| Pasados (con enlace a fotos) | **Recuerdo** — "Mira lo que vivimos" |

### FOTOS (`/fotos`)
| Sección | Intención emocional |
|---|---|
| Grid de posts por partido | **Descubrimiento** — "Aquí está tu partido" |
| Post individual (galería) | **Emoción** — "Mira a tu hijo en acción" |
| Lightbox + descarga | **Propiedad** — "Esas fotos son tuyas" |

### CLUB (`/club`)
| Sección | Intención emocional |
|---|---|
| Hero institucional | **Seriedad** — "Esto es un proyecto serio" |
| Misión/Visión/Valores | **Confianza** — "Sabemos hacia dónde vamos" |
| Staff y directivos | **Credibilidad** — "Detrás hay profesionales" |

### CATEGORÍAS (`/categorias`)
| Sección | Intención emocional |
|---|---|
| Lista de programas por edad | **Clarity** — "Tu hijo está aquí" |
| Detalle de cada programa | **Convicción** — "Esto es lo que ofrece" |
| CTA inscripción | **Acción** — "Inscríbelo ahora" |

### INSCRIPCIÓN (`/inscripcion`)
| Sección | Intención emocional |
|---|---|
| Beneficios / proceso | **Confianza** — "Así de fácil, así de serio" |
| Formulario | **Simplicidad** — "Menos campos, más claridad" |
| CTA WhatsApp | **Acceso** — "Habla con nosotros directo" |

---

## 7. Patrones de componentes

### Card genérica
- Fondo: `#FFFFFF` o `#FAFAF9`.
- Borde: `1px solid rgba(0, 40, 92, 0.10)`.
- Border-radius: `8px`.
- Padding: `1.5rem`.
- **Elemento decorativo:** número grande en fondo `#E8F0F5` (navy 5%) posicionado atrás, como marca visual del club.
- **Hover:** borde `rgba(0, 40, 92, 0.25)` + sombra sutil `0 4px 20px rgba(0,40,92,0.08)`. **NUNCA hover:scale.**

### Botones
| Variante | Estilo |
|---|---|
| Primario | Fondo `#00285C`, texto `#FAFAF9`, padding 12px 28px, border-radius 6px, Inter SemiBold 14px uppercase |
| Secundario | Borde 2px `#429AC0`, texto `#00285C`, fondo transparente |
| Ghost | Solo texto `#00285C` + underline en hover |

- Transición: `border-color 200ms ease, background-color 200ms ease`. **NUNCA transform.**

### Badge de categoría
- Font: Inter SemiBold 11px, uppercase, letter-spacing 1px.
- Padding: 4px 10px.
- Border-radius: 4px.
- Fondo: color de categoría a 10% opacidad.
- Texto: color de categoría sólido.

### Header / Nav
- Fijo (sticky), fondo `#00285C`.
- Logo (escudo) a color a la izquierda.
- Nav items: Inter SemiBold 14px, texto `#FAFAF9`, hover `#429AC0`.
- CTA "Inscribirse" al final: fondo `#429AC0`, texto blanco.
- Mobile: hamburger menu, fondo navy, nav items apilados.

### Footer
- Fondo `#071D3B` (navy oscuro).
- Grid de 4 columnas: logo/descripción, Club, Categorías, Contacto.
- Texto `rgba(255,255,255,0.7)`, links hover `#429AC0`.
- Separator: `border-top: 1px solid rgba(255,255,255,0.08)`.
- Bottom: copyright + "Hecho en Punta Cana" con corazón.

### PartidoListItem (calendario)
- Fila horizontal: `[Badge categoría] [Fecha] — [Categoría] vs [Rival] — [Ubicación] — [📷 Ver fotos]`.
- Fondo blanco, borde sutil bottom.
- Hover: fondo `#F5F8FB`.
- Badges de categoría inline.

### PostCard (fotos)
- Card con thumbnail de la foto destacada del partido (obj-fit: cover).
- Debajo: título "[Categoría] vs [Rival]", fecha, badge categoría.
- Click → navega al post individual.

### GaleríaGrid
- Grid responsive: 4 columnas desktop, 3 tablet, 2 mobile.
- Gap: 12px.
- Thumbnails con `object-fit: cover`, aspect-ratio 4:3.
- Hover: leve sombra, cursor pointer.
- Click → lightbox overlay.

### Lightbox
- Overlay oscuro `rgba(0, 20, 40, 0.92)`.
- Foto centrada, max-height 85vh.
- Botones: cerrar (×), descargar ↓, flechas ← →.
- Keyboard: Escape cierra, flechas navegan.
- **Descarga:** botón ↓ descarga la foto original sin compresión.

### CalendarioFiltros
- Tabs horizontales con las 4 categorías + "Todas".
- Fondo: `#F5F8FB`, tab activa fondo navy, texto blanco.
- Inter SemiBold 13px.

### HeroSection
- Fondo: navy `#00285C`.
- Imagen de fondo: foto real de acción (con overlay `rgba(0,40,92,0.5)`).
- Texto: Bowlby One SC grande (`clamp(2.5rem, 5vw, 4rem)`), blanco.
- Subtítulo: Inter Regular, `rgba(255,255,255,0.8)`.
- **No gradientes neon, no diagonal lines, no circles animados.**

### HomeCategories
- Lista estructurada del roadmap formativo por edades (4-19 años).
- Muestra badge de categoría, identificador numérico (01..04), nombre, descripción y enlace de acción.
- Transiciones al hover con cambio de fondo a `sky-10`.

### WhyPcfc
- Sección de diferenciadores y métricas cuantitativas (500+ futbolistas, 50+ entrenadores, etc.).
- 3 columnas con numeración gigante en `sky` (`01`, `02`, `03`) y titulares de impacto.

### ValuePillars
- Grid de 3 tarjetas en `navy-dark` con borde sutil `navy-60/30` y sombra sutil.
- Iconos de 64x64px en `sky/5` con borde `sky`.
- Titulares en mayúsculas `Inter Bold` + tracking `0.9px`.

### CommunityMosaic
- Grid de mosaico fotográfico (1 principal 2x2 + 4 secundarias) sobre fondo `navy`.
- Enlace al flujo completo de la galería en `/fotos`.

### PathwayCards
- Tarjetas de doble vía (Padres vs Jugadores) con imágenes destacadas y CTAs hacia `/club` y `/area-deportiva`.

### Sponsors
- Grid de marcas aliadas y patrocinadores del club con enlaces externos seguros (`rel="noopener"`).

### EnrollmentCta
- Sección de cierre centrada para incitar a la inscripción o contacto por WhatsApp en menos de 24 horas.

---

## 8. Capa de Datos Estáticos (`src/data/homeData.ts`)

- **Desacoplamiento total**: La lógica de contenido de la página principal está aislada de la capa de presentación.
- **Tipado estricto**: Define interfaces TypeScript (`Category`, `Pillar`, `Stat`, `ValuePillarItem`, `PathwayCardItem`, `SponsorItem`, `NextMatch`).
- **Funciones puras de datos**: `getNextMatchData()`, `getCategoriesData()`, `getPillarsData()`, `getStatsData()`, `getGalleryImagesData()`, `getValuePillarsData()`, `getPathwayCardsData()`, `getSponsorsData()`.

---

## 9. Reglas de animación

### Framework
- GSAP 3.x, importaciones centralizadas.
- Respetar `prefers-reduced-motion` siempre.

### Tipos de animación

| Tipo | Ejemplo | Duración |
|---|---|---|
| Text reveal | SplitText blur fade-in, stagger 0.03s | 800–1200ms |
| Parallax decorativo | Elementos de fondo se mueven más lento | Velocidad suave, solo decor |
| UI micro | Hover de botón, cambio de tab | 150–200ms |
| Entry | Sección aparece al scroll | 600–900ms, ease-out |

### Reglas estrictas
- **NUNCA** `transition: all` — especificar propiedades exactas (`border-color`, `background-color`, `opacity`).
- **NUNCA rebote/elastic** en elementos de UI (solo si es microdecorativo).
- Duración UI: **< 200ms**. Duración reveals: **800–1200ms**.
- Parallax: solo en elementos decorativos (números de fondo, patrones). **NUNCA en contenido funcional** (texto, botones, fotos que se descargan).
- Entry del hero: elementos aparecen con **peso**, no con rebote. Un fade-up sutil y firme.

---

## 10. Reglas de separación visual

| Capas | Método |
|---|---|
| Misma capa (ej. dos cards en una fila) | Whitespace generoso (gap ≥ 2rem) |
| Capas diferentes (sección navy → sección blanca) | Borde fino `rgba(0,40,92,0.10)` O cambio de fondo |
| Elevación hover | Sombra sutil: `0 4px 20px rgba(0,40,92,0.08)` |
| **NUNCA** | Líneas gruesas (>2px), sombras como separadores, divisores de color fuerte |

---

## 11. Accesibilidad

### Contraste
- **WCAG AA** mínimo: 4.5:1 para texto normal, 3:1 para texto grande (≥18pt).
- Navy sobre blanco: 14.6:1 ✅
- Blanco sobre navy: 14.6:1 ✅
- Celeste sobre navy: 4.4:1 ✅ (texto normal)
- Celeste sobre blanco: 3.1:1 ⚠️ (solo texto grande o bold)
- Plata sobre blanco: 1.6:1 ❌ (nunca para texto)

### Formularios
- Labels siempre visibles (nunca solo placeholder).
- Estados de error: borde rojo `#D32F2F` + mensaje descriptivo debajo.
- Campos con `aria-required`, `aria-describedby` para errores.
- Submit button deshabilitado hasta validación básica.

### Navegación
- Focus rings visibles en todos los elementos interactivos: `outline: 2px solid #429AC0; outline-offset: 2px`.
- Skip-to-content link oculto para lectores de pantalla.
- `aria-current="page"` en el link activo del nav.

### Multimedia
- `alt` text descriptivo en todas las fotos (incluye categoría + rival + fecha si es posible).
- `prefers-reduced-motion: reduce` → desactivar todas las animaciones GSAP.
- Videos con subtítulos.

### Jerarquía
- Solo **un H1** por página.
- H2 → H3 → H4 en orden descendente, sin saltar niveles.

---

*DESIGN.md · PCFC · v1.0 · Septiembre 2026*
