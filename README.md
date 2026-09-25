# Punta Cana FC — Sitio Web Oficial

Sitio web de la academia de fútbol Punta Cana FC, construido con Astro 7, EmDash CMS y Tailwind CSS v4.

## 🚀 Tecnologías

- **Framework:** [Astro 7](https://docs.astro.build) (SSR)
- **CMS:** [EmDash](https://emdash.sh) (content collections con validación Zod)
- **Estilos:** Tailwind CSS v4
- **Despliegue:** Cloudflare Workers (adapter `@astrojs/cloudflare`)
- **Lenguaje:** TypeScript (strict mode)
- **Base de datos:** SQLite (dev) / Cloudflare D1 (prod)

## 📋 Requisitos

- Node.js >= 22.12.0
- pnpm (recomendado) o npm

## 🛠️ Instalación

```bash
# Clonar el repositorio
git clone <repo-url>
cd punta-cana-fc

# Instalar dependencias
pnpm install

# Copiar variables de entorno
cp .env.example .env

# Iniciar servidor de desarrollo
pnpm dev
```

## 📁 Estructura del Proyecto

```
punta-cana-fc/
├── public/              # Archivos estáticos (favicon, robots.txt, sitemap.xml)
├── src/
│   ├── api/            # Endpoints API (upload-photo.ts)
│   ├── components/     # Componentes reutilizables
│   ├── content/        # Contenido editable via EmDash CMS
│   ├── data/           # Datos y helpers (homeData.ts, fixtures.ts)
│   ├── layouts/        # Layouts (Base.astro)
│   ├── lib/            # Utilidades y funciones helper
│   ├── pages/          # Páginas del sitio
│   ├── styles/         # Estilos globales (global.css)
│   └── middleware.ts   # Middleware de seguridad (CSP headers)
├── astro.config.mjs    # Configuración de Astro
├── content.config.ts   # Schemas Zod para content collections
├── tsconfig.json       # Configuración TypeScript (strict)
├── .eslintrc.json      # Configuración ESLint
└── .prettierrc         # Configuración Prettier
```

## 🎨 Sistema de Diseño

El proyecto sigue un sistema de diseño documentado en `DESIGN.md` con:

- **Paleta de colores:** Navy (#00285C), Sky (#429AC0), White (#FAFAF9)
- **Tipografía:** Bowlby One SC (display), Inter (body), Montserrat (mono)
- **Categorías:** Pre (verde), Formativas Bajas (azul), Formativas Altas (amarillo), Elite (rojo)
- **Componentes:** SectionHeader, StockImage, GalleryGrid, Lightbox, CategoryCard, etc.

## 📝 Scripts Disponibles

```bash
# Desarrollo
pnpm dev          # Iniciar servidor de desarrollo (http://localhost:4321)
pnpm build        # Build para producción
pnpm preview      # Preview del build de producción

# Calidad de código
pnpm lint         # Ejecutar ESLint
pnpm lint:fix     # Ejecutar ESLint con auto-fix
pnpm format       # Formatear código con Prettier
pnpm format:check # Verificar formato sin modificar
pnpm check        # Verificar tipos con astro check
```

## 🔐 Variables de Entorno

Copiar `.env.example` a `.env` y configurar:

```bash
EMDASH_DATABASE_URL="file:./data.db"
DATABASE_URL="file:./data.db"
EMDASH_DEV_AUTH=1
EMDASH_ENCRYPTION_KEY="tu-clave-segura-aqui"
```

**⚠️ IMPORTANTE:** Nunca commitear `.env` al repositorio. Usar Cloudflare Secrets en producción.

## 🗂️ Content Collections

Las siguientes colecciones son editables via EmDash CMS (`/_emdash/admin/`):

- `hero` — Hero sections por página
- `club-history` — Historia del club y equipo directivo
- `categories` — Categorías formativas (4-19 años)
- `calendar` — Partidos próximos y jugados
- `sponsors` — Patrocinadores y aliados
- `gallery` — Imágenes de galería
- `stats-pillars` — Estadísticas y pilares de valor
- `next_match` — Próximo partido destacado
- `blog` — Posts del blog

Los schemas Zod en `src/content.config.ts` validan que el contenido editado no rompa el layout.

## 🌐 Rutas

- `/` — Inicio
- `/inscribete` — Formulario de inscripción
- `/club` — Historia, misión, visión y valores
- `/calendario` — Calendario de partidos
- `/fotos` — Galería de fotos por partido
- `/area-deportiva` — Categorías, entrenadores e instalaciones
- `/tienda` — Tienda oficial
- `/blog` — Blog de noticias
- `/sponsors` — Patrocinadores y aliados
- `/objetos-perdidos` — Objetos perdidos
- `/dev/guia` — Showcase de componentes (solo desarrollo)

## 🚢 Despliegue

### Desarrollo Local

```bash
pnpm dev
```

### Producción (Cloudflare)

```bash
pnpm build
pnpm wrangler deploy
```

Configurar en Cloudflare:
- D1 Database para EmDash
- R2 Bucket para media uploads
- Secrets para `EMDASH_ENCRYPTION_KEY`

## 🧪 Testing

Próximamente:
- Vitest para pruebas unitarias
- Playwright para pruebas E2E

## 📄 Licencia

Todos los derechos reservados © 2026 Punta Cana FC

## 👥 Contacto

- **Email:** info@puntacanafc.com
- **Teléfono:** +1 809-652-9450
- **Instagram:** [@puntacanafc](https://instagram.com/puntacanafc)
- **Facebook:** [Punta Cana FC](https://facebook.com/puntacanafc)
