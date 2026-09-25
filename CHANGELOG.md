# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [No Publicado]

### Agregado - 2026-09-08

#### Seguridad
- **Middleware de seguridad** (`src/middleware.ts`)
  - Content Security Policy (CSP) headers
  - X-Frame-Options: DENY (anti-clickjacking)
  - X-Content-Type-Options: nosniff (anti-MIME sniffing)
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy deshabilitando cámara, micrófono, geolocalización
- **Validación de uploads** (`src/pages/api/upload-photo.ts`)
  - Validación de tipo de archivo (JPEG, PNG, WebP, GIF)
  - Validación de tamaño máximo (10MB)
  - Sanitización de nombre de archivo
- **Plantilla de variables de entorno** (`.env.example`)

#### Accesibilidad
- **Skip link** (`src/layouts/Base.astro`)
  - Activado enlace "Saltar al contenido"
  - Estilos CSS para skip link visible al enfocar con Tab
  - Posición fija con outline visible

#### Rendimiento
- **Lazy load Google Fonts** (`src/layouts/Base.astro`)
  - Fonts cargan con `media="print"` y cambian a `all` después de cargar
  - Fallback `<noscript>` para navegadores sin soporte
  - Mejora en First Contentful Paint (FCP)

#### Herramientas de Desarrollo
- **ESLint configurado** (`.eslintrc.json`)
  - Reglas para TypeScript y Astro
  - Plugin @typescript-eslint
  - Plugin eslint-plugin-astro
- **Prettier configurado** (`.prettierrc`)
  - Estilo consistente: single quotes, 2 spaces, 100 print width
  - Plugin prettier-plugin-astro para archivos .astro
- **Scripts de calidad** (`package.json`)
  - `lint` — Ejecutar ESLint
  - `lint:fix` — Ejecutar ESLint con auto-fix
  - `format` — Formatear código con Prettier
  - `format:check` — Verificar formato sin modificar
- **Script de verificación** (`scripts/verify.sh`)
  - Verifica tipos, lint, formato y build
  - Ejecutar con `pnpm verify`
  - Útil antes de commit

#### Documentación
- **README.md** — Documentación completa del proyecto
- **Evaluación integral** (`evaluacion-proyecto.md`) — Análisis completo del proyecto

### Corregido - 2026-09-08

#### Consistencia de Diseño
- **Sponsors page** (`src/pages/sponsors.astro`)
  - Refactorizado de HTML standalone a Base.astro layout
  - Navbar y footer ahora visibles
  - Mejora en SEO y consistencia de diseño
- **Objetos perdidos** (`src/pages/objetos-perdidos.astro`)
  - Variables CSS incorrectas reemplazadas con variables del sistema de diseño
  - `--bg-secondary`, `--text-muted`, `--accent-cyan` → `--color-navy`, `--color-navy-60`, `--color-sky`
  - Font-family corregida a `var(--font-body)`

## [1.0.0] - 2026-09-08

### Agregado
- Sitio web completo con Astro 7
- EmDash CMS integrado
- Tailwind CSS v4
- TypeScript strict mode
- 12 páginas principales
- 20+ componentes reutilizables
- Sistema de diseño con DESIGN.md
- Content collections con validación Zod
- Cloudflare Workers deployment target
- React 19 integration

---

## Notas de Versión

### Evaluación de Calidad (2026-09-08)

**Puntuación general: 8.2/10** (mejorado desde 6.9/10)

| Dimensión | Puntuación |
|-----------|-----------|
| SEO | 7.0/10 |
| Rendimiento | 8.0/10 |
| Accesibilidad | 7.5/10 |
| Seguridad | 7.0/10 |
| Mantenibilidad | 9.0/10 |
| Consistencia de diseño | 8.0/10 |

**Próximas mejoras planificadas:**
- Generar imagen OG PNG para redes sociales
- Completar blog con contenido y structured data BlogPosting
- Migrar datos hardcodeados a EmDash CMS
- Agregar tests automatizados (Vitest, Playwright)
