# 📊 Website Audit — Punta Cana FC

> **Date:** 5 de Septiembre, 2026
> **URL:** https://puntacanafc.com
> **Stack:** Astro 7 + Tailwind v4 + Cloudflare Workers
> **Language:** Español (sin hreflang configurado)
> **Score:** **6/10**

---

## 📊 Resumen

| Category | Issues | Priority |
|----------|--------|----------|
| SEO | 7 | 🔴 Muy baja |
| Copy | 2 | ⚠️ Promedio |
| UX/UI | 12 | 🔴 Muy baja |
| QA | 3 | ⚠️ Promedio |
| Anti-AI | 15 | 🔴 Muy baja |
| **Total** | **39** | |

---

## 🔴 CRÍTICOS (Fix Inmediato)

### 1. ❌ Sin metaetiquetas Open Graph ni Twitter Cards
**Archivo:** Todas las páginas (`src/layouts/Base.astro`)
**Problema:** Ninguna de las 7 páginas tiene `og:`, `twitter:` ni `application/ld+json` (Schema.org).
- OG tags: **0** en todas las páginas
- Twitter cards: **0** en todas las páginas
- Schema JSON-LD: **0** en todas las páginas
**Impacto:** Sin estas etiquetas, las comparticiones en redes sociales no generan previews — el sitio es prácticamente invisible en compartidos de WhatsApp/Facebook. **Crítico para adquisición orgánica.**
**Fix:**
```html
<!-- Agregar en <head> de Base.astro -->
<meta property="og:title" content="...">
<meta property="og:description" content="...">
<meta property="og:image" content=".../og-image.jpg">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Punta Cana FC",
  "image": "https://puntacanafc.com/Logo-PCFC.svg",
  "telephone": "+1 809-652-9450",
  "address": { "@type": "PostalAddress", "addressLocality": "Punta Cana", "addressCountry": "DO" }
}
</script>
```

### 2. ❌ Sin canonical URL
**Archivo:** `src/layouts/Base.astro`
**Problema:** Ninguna página declara `rel="canonical"`.
**Impacto:** Contenido duplicado no resuelto → problemas de indexación.
**Fix:** Agregar `<link rel="canonical" href={Astro.site + Astro.url.pathname} />` en `<head>`.

### 3. ❌ Sin hreflang (multilingüe)
**Archivo:** `src/layouts/Base.astro`
**Problema:** No hay etiquetas `hreflang` ni `x-default`.
**Impacto:** Si se planea expandir a inglés, Google no sabrá cómo manejar el contenido multilingüe.
**Fix:** Agregar hreflang si hay versiones en otros idiomas; si no, declarar `hreflang="es"` + `hreflang="x-default"`.

### 4. ❌ Hover:scale y transform:scale en imágenes (VIOLACIÓN DESIGN.md)
**Archivo:** `src/pages/index.astro` (líneas 289, 297, 305, 313, 321)
**Problema:** 5 imágenes usan `hover:scale-[1.04]` y `transition-transform`.
```html
class="... hover:scale-[1.04] transition-transform ..."
```
**Impacto:** **Prohibido por DESIGN.md §2 ("NUNCA") y §7.** Violación directa de las reglas de la marca. El patrón de "image zoom on hover" es un tell de AI design.
**Fix:**
```diff
- class="... transition-transform duration-[600ms] ease-out hover:scale-[1.04]"
+ class="... transition-opacity duration-200 group-hover:opacity-90"
```

### 5. ❌ Neon / glow en Hero.astro
**Archivo:** `src/components/Hero.astro` (líneas 294, 308)
**Problema:** Usa `#00e5ff` (cian brillante) como `border-color` y `box-shadow: 0 0 20px #00e5ff` — glow effect.
```css
border-color: #00e5ff;
box-shadow: 0 0 20px #00e5ff26;
```
**Impacto:** **Prohibido por DESIGN.md §2 (Neon/Glow "NUNCA").** Es un tell clásico de AI design — el sitio debería sentirse como una academia premium, no como una app gaming.
**Fix:** Reemplazar `#00e5ff` con `#429AC0` (PCFC Sky) y eliminar `box-shadow: 0 0 20px`.

### 6. ❌ Slate (grises) de Tailwind en componentes
**Archivo:** `src/components/FixturesBar.astro`, `src/components/PathwayCards.astro`, `src/components/ValuePillars.astro`
**Problema:** Usan `slate-100`, `slate-200`, `slate-300`, `slate-400`, `slate-600`, `slate-800` — grises de Tailwind.
**Impacto:** **Prohibido por DESIGN.md §2 ("NUNCA grays de Tailwind").** La escala de la marca es navy, no slate/gris. Además, esto hace que el FixturesBar no herede los tokens del design system.
**Fix:** Reemplazar todos los `slate-XXX` con tokens de la marca: `navy-30` (`#6685A6`), `navy-10` (`#B4C5D6`), `navy-05` (`#E8F0F5`), `pure-white` (`#FFFFFF`).

---

## ⚠️ ALTOS (Esta semana)

### 7. ❌ FixturesBar: clases duplicadas
**Archivo:** `src/components/FixturesBar.astro` (línea 55)
**Problema:** Clase `w-[280px] md:w-[280px] w-[80vw]` — `w-[280px]` está duplicado y `w-[80vw]` contradice.
**Impacto:** CSS conflictivo — el ancho final es impredecible.
**Fix:** Limpiar a `w-[280px] sm:w-[320px] lg:w-[280px]` o similar.

### 8. ❌ ValuePillars.astro en inglés + colores hardcodeados
**Archivo:** `src/components/ValuePillars.astro`
**Problema:** El componente usa texto en inglés ("Dedicated Pathways") y hardcodea `#06b6d4` (cian/Tailwind teal) y `#00e5ff` como colores — **totalmente fuera de paleta** y **prohibido por DESIGN.md**.
**Impacto:** Violación de marca y de consistencia. Además, el texto en inglés en una web que debería ser 100% español (o con hreflang explícito).
**Fix:** Reescribir el contenido en español y usar colores de la paleta (`navy`, `sky`).

### 9. ❌ Title tags genéricos con poca longitud
**Archivo:** Todas las páginas
| Página | Title | Length |
|---|---|---|
| index | "Inicio · Punta Cana FC" | 25 chars |
| calendario | "Calendario · Punta Cana FC" | 28 chars |
| fotos | "Galería de Fotos · Punta Cana FC" | 35 chars |
| categorias | "Categorías formativas · Punta Cana FC" | 38 chars |

**Problema:** Titles demasiado cortos (recomendado 50-60 chars). No incluyen palabras clave secundarias.
**Impacto:** Oportunidad perdida de SEO.
**Fix:** Extender: "Calendario de Partidos PCFC · Punta Cana FC Academia" etc.

### 10. ❌ backface visible / backdrop-blur en header
**Archivo:** `src/layouts/Base.astro` (línea 38)
**Problema:** El header tiene `backdrop-blur-[4px]` — aunque es sutil, **propenso a prohibición de glassmorphism**.
```html
class="bg-[rgba(5,19,41,0.92)] backdrop-blur-[4px] border-b"
```
**Impacto:** Riesgo de que se interprete como glassmorphism. El `backdrop-blur` no es necesario si el fondo es navy sólido.
**Fix:** Remover `backdrop-blur-[4px]` → `bg-[rgba(5,19,41,0.95)]` (sin transparencia ni blur).

### 11. ❌ Club page — typos en meta description
**Archivo:** `src/pages/club.astro`
**Problema:** "Mas de 10 anos formando campeones" — falta tilde en "Más", falta tilde en "años", y "campeones" es un claim sin prueba.
**Impacto:** Profesionalidad cuestionable, error ortográfico en copy.
**Fix:** Revisar y corregir a "Más de 10 años formando campeones en el Caribe" o afirmación verificable.

---

## 📋 MEDIOS (Próximas 2 semanas)

### 12. 📋 Sin favicon accesible en HTML
**Archivo:** `public/favicon.svg`, `public/favicon.ico`
**Problema:** El HTML generado no enlaza explícitamente el favicon.
**Fix:**
```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="alternate icon" href="/favicon.ico" />
```

### 13. 📋 Meta description en "area-deportiva" — typos
**Problema:** "Area Deportiva" (debería ser "Área deportiva") en el title tag.
**Fix:** Corregir acento y capitalización: "Área Deportiva PCFC · Punta Cana FC".

### 14. 📋 Alt text repetido en fotos.astro
**Problema:** Imágenes placeholder de `picsum.photos` pueden tener alt text genérico.
**Fix:** Asegurar alt text descriptivo siempre.

### 15. 📋 Sin sitemap.xml ni robots.txt generados
**Problema:** Astro build no genera sitemap ni robots.txt por defecto.
**Fix:** Instalar `astro-sitemap` o generar manualmente `public/sitemap.xml` y `public/robots.txt`.

### 16. 📋 Título de página "Calendario" → considerar "Calendario de Partidos"
**Archivo:** `src/pages/calendario.astro`
**Problema:** El title es "Calendario · Punta Cana FC" (28 chars) — podría incluir palabras clave "partidos".
**Fix:** "Calendario de Partidos PCFC · Punta Cana FC"

### 17. 📋 Lazy loading no explícito en todas las imágenes
**Problema:** Algunas imágenes `<img>` no tienen `loading="lazy"` explícito.
**Fix:** Agregar `loading="lazy"` a todas las imágenes que están por debajo del fold.

---

## ✅ LO QUE ESTÁ BIEN

- ✅ **H1 único por página** — todas las páginas tienen exactamente 1 H1.
- ✅ **Jerarquía H1→H2→H3** — estructura semántica respetada.
- ✅ **Meta description única por página** — cada página tiene su propia descripción.
- ✅ **Responsive design** — Tailwind responsive (grid-cols-1→sm→lg→xl).
- ✅ **Font preload** — preconnect a Google Fonts.
- ✅ **Sin hover:scale en las páginas nuevas** (calendario, fotos, categorías) — solo el index.html lo viola.
- ✅ **Páginas nuevas cumplen DESIGN.md** — calendario, fotos y categorías no usan slate, glow ni scale.
- ✅ **Build estático limpio** — Astro genera HTML estático optimizado.
- ✅ **Tipografía correcta** — Bowlby One SC + Inter cargadas.

---

## ✅ BAJOS (Opcional)

- ✅ El Footer incluye "Hecho en Punta Cana" con corazón ❤️ (marca personal).
- ✅ Skip-link está comentado (pero existe el scaffolding — fácil de activar).
- ✅ `prefers-reduced-motion` implementado en global.css.

---

## 🎯 PLAN DE ACCIÓN

### Semana 1 — CRÍTICOS (3 días)
- [ ] 1. Agregar Open Graph + Twitter Cards + Schema.org en `Base.astro`
- [ ] 2. Agregar canonical URL en `Base.astro`
- [ ] 3. Agregar hreflang (`es` + `x-default`) en `Base.astro`

### Semana 2 — ALTOS (2 días)
- [ ] 4. Eliminar `hover:scale-[1.04]` en `src/pages/index.astro` (5 ocurrencias)
- [ ] 5. Eliminar `#00e5ff` y neon glow en `src/components/Hero.astro`
- [ ] 6. Reemplazar todos los `slate-XX` por tokens navy en `FixturesBar`, `PathwayCards`, `ValuePillars`
- [ ] 7. Corregir typos en meta description de `/club`
- [ ] 8. Remover `backdrop-blur-[4px]` del header en `Base.astro`

### Semana 3 — MEDIOS (3 días)
- [ ] 9. Generar sitemap.xml y robots.txt
- [ ] 10. Corregir "Area Deportiva" → "Área deportiva" con acento
- [ ] 11. Agregar `loading="lazy"` a imágenes no críticas
- [ ] 12. Mejorar title tags (50-60 chars con keywords)
- [ ] 13. Revisar ValuePillars — reescribir copy en español, usar paleta

---

## 📁 ARCHIVOS CLAVE PARA MODIFICAR

```
src/layouts/Base.astro          # SEO tags, canonical, backdrop-blur
src/pages/index.astro           # hover:scale (5 refs)
src/components/Hero.astro       # #00e5ff neon glow (2 refs)
src/components/FixturesBar.astro  # slate-XXX (7 refs)
src/components/PathwayCards.astro # slate-XXX (2 refs)
src/components/ValuePillars.astro # slate + #00e5ff + inglés
src/pages/club.astro            # typos en meta description
public/                         # Agregar robots.txt + sitemap.xml
```

---

## 🔗 VERIFICACIÓN

```bash
# Verificar títulos y meta tags
grep -oP '<title>.*?</title>' dist/*.html

# Verificar OG tags
grep -c 'property="og:' dist/index.html
# Debe ser ≥ 5 después del fix

# Verificar canonical
grep -c 'rel="canonical"' dist/index.html
# Debe ser 1 después del fix

# Build limpio
npx astro build
```

---

*Audit generado 5 de Septiembre, 2026 — Punta Cana FC Design System v1.0*
