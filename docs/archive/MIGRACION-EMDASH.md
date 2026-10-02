# Plan de Migración a EmDash CMS

**Objetivo:** Mover todos los datos hardcodeados del código al CMS EmDash para que el cliente pueda editar contenido sin necesidad de deployments.

**Estado actual:** 9 content collections definidos en `content.config.ts`, con helpers en `src/lib/content.ts` que leen de EmDash. Sin embargo, `homeData.ts` y varias páginas aún tienen datos hardcodeados como fallback/override.

---

## 1. Inventario de Datos Hardcodeados

### 1.1 Datos en `src/data/homeData.ts`

| Función | Datos | Registros | ¿Collection existe? | Acción |
|---------|-------|-----------|--------------------:|--------|
| `getNextMatchData()` | Próximo partido | 1 | ✅ `next_match` | Poblar collection |
| `getCategoriesData()` | Categorías formativas | 4 | ✅ `categories` | Poblar collection |
| `getStatsData()` | Estadísticas (700+, 20+) | 4 | ✅ `stats-pillars` (kind=stat) | Poblar collection |
| `getPillarsData()` | Pilares metodología | 3 | ✅ `stats-pillars` (kind=pillar) | Poblar collection |
| `getGalleryImagesData()` | Imágenes galería | 6 | ✅ `gallery` | Poblar collection |
| `getValuePillarsData()` | Valores del club (con SVG) | 3 | ❌ | **Opción A o B** (ver §3) |
| `getPathwayCardsData()` | Cards padres/jugadores | 2 | ❌ | **Opción A o B** (ver §3) |
| `getSponsorsData()` | Patrocinadores | 8 | ✅ `sponsors` | Poblar collection |

### 1.2 Datos hardcodeados en páginas

| Archivo | Datos | Registros | ¿Collection existe? | Acción |
|---------|-------|-----------|--------------------:|--------|
| `categorias.astro` | Categorías (duplicado) | 4 | ✅ `categories` | Leer de collection |
| `calendario.astro` | Próximos partidos | 6 | ✅ `calendar` (kind=upcoming) | Poblar + refactor |
| `calendario.astro` | Partidos pasados | 5 | ✅ `calendar` (kind=past) | Poblar + refactor |
| `fotos.astro` | Posts con fotos | 8 | ❌ | **Crear collection** `match-posts` |
| `tienda.astro` | Productos tienda | 4 | ❌ | **Crear collection** `products` |
| `objetos-perdidos.astro` | Objetos encontrados | 3 | ❌ | **Crear collection** `lost-items` |

### 1.3 Datos en `src/data/fixtures.ts`

| Datos | Registros | Acción |
|-------|-----------|--------|
| Fixtures (partidos para componente) | 4 | Migrar a `calendar` collection |

### 1.4 Datos de diseño (NO migrar)

Estos datos deben permanecer hardcodeados porque son parte del sistema de diseño:

- **SVG icons** en `getValuePillarsData()` — iconos institucionales
- **Layout tokens** — clases CSS, colores de diseño
- **Configuración técnica** — URLs de API, endpoints

---

## 2. Nuevas Content Collections Necesarias

### 2.1 `match-posts` (Posts de galería de partidos)

```typescript
// src/content.config.ts — agregar
const matchPosts = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string(),           // "PCFC vs Casa España U14"
    slug: z.string(),            // "pcfc-vs-casa-espana-u14"
    date: z.string(),            // "15 sept. 2025"
    category: z.string(),        // "U-14"
    venue: z.string(),           // "Florer, Puerto"
    description: z.string(),     // "PCFC venció al equipo local..."
    coverImage: z.string(),      // URL de imagen principal
    images: z.array(z.object({   // Array de imágenes del partido
      src: z.string(),
      alt: z.string(),
    })),
    published: z.boolean().default(true),
    order: z.number().optional(),
  }),
});
```

**Registros a crear:** 8 posts (los actuales en `fotos.astro`)

### 2.2 `products` (Productos de tienda)

```typescript
const products = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),            // "Camiseta local PCFC"
    slug: z.string(),            // "camiseta-local"
    description: z.string(),     // "Camiseta oficial..."
    price: z.number(),           // 4500
    currency: z.string().default('DOP'),
    images: z.array(z.string()), // URLs de imágenes
    sizes: z.array(z.string()).default(['S', 'M', 'L', 'XL']),
    category: z.enum(['uniforme', 'entrenamiento', 'accesorio', 'hombre', 'mujer']).optional(),
    featured: z.boolean().default(false),
    inStock: z.boolean().default(true),
    order: z.number().optional(),
  }),
});
```

**Registros a crear:** 4 productos (los actuales en `tienda.astro`)

### 2.3 `lost-items` (Objetos perdidos)

```typescript
const lostItems = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string(),           // "Chaqueta negra"
    description: z.string(),     // "Chaqueta negra talla M..."
    location: z.string(),        // "Encontrada en la cancha"
    dateFound: z.string(),       // "10 oct. 2025"
    image: z.string().optional(),// URL de imagen
    status: z.enum(['found', 'claimed', 'returned']).default('found'),
    contactInfo: z.string().optional(), // Información de contacto
    order: z.number().optional(),
  }),
});
```

**Registros a crear:** 3 items (los actuales en `objetos-perdidos.astro`)

---

## 3. Estrategia para Datos de Diseño

**Opción A — Mantener hardcodeados (recomendado para MVP):**
- `valuePillars` y `pathwayCards` permanecen en `homeData.ts`
- Son datos institucionales que cambian rara vez
- Los SVGs son parte del diseño, no contenido editable
- Ventaja: menos complejidad, menos riesgo de romper diseño

**Opción B — Migrar todo a EmDash:**
- Crear collections `value-pillars` y `pathway-cards`
- Los SVGs se guardan como strings en la DB
- El cliente podría editar títulos y descripciones
- Desventaja: riesgo de que el cliente rompa el diseño

**Recomendación:** Opción A para MVP, migrar a B si el cliente lo solicita.

---

## 4. Plan de Implementación por Fases

### Fase 1: Poblar Collections Existentes (Sprint 1)

**Objetivo:** Mover datos de `homeData.ts` a EmDash collections que ya existen.

#### Tareas:

1. **Crear script de seed** (`scripts/seed-emdash.ts`)
   - Script Node.js que lee de `homeData.ts`
   - Inserta registros en EmDash via API o directamente en DB
   - Ejecutar una sola vez para poblar datos iniciales

2. **Poblar `next_match`** (1 registro)
   - Datos de `getNextMatchData()`

3. **Poblar `categories`** (4 registros)
   - Datos de `getCategoriesData()`
   - Verificar que `order` esté correcto (0, 1, 2, 3)

4. **Poblar `stats-pillars`** (7 registros)
   - 4 stats (kind=stat) de `getStatsData()`
   - 3 pillars (kind=pillar) de `getPillarsData()`

5. **Poblar `gallery`** (6 registros)
   - Datos de `getGalleryImagesData()`

6. **Poblar `sponsors`** (8 registros)
   - Datos de `getSponsorsData()`
   - Nota: algunos ya usan URLs de EmDash media

7. **Poblar `calendar`** (11 registros)
   - 6 upcoming de `calendario.astro`
   - 5 past de `calendario.astro`

8. **Verificar datos en admin**
   - Ir a `/_emdash/admin/`
   - Confirmar que todos los registros aparecen
   - Probar edición de un registro

**Archivos a crear/modificar:**
- `scripts/seed-emdash.ts` (nuevo)
- `src/content/next_match/*.json` (si se usa file-based)
- O insertar via EmDash admin UI

### Fase 2: Crear Nuevas Collections (Sprint 2)

**Objetivo:** Agregar collections para datos que aún no las tienen.

#### Tareas:

1. **Actualizar `content.config.ts`**
   - Agregar schema `matchPosts` (ver §2.1)
   - Agregar schema `products` (ver §2.2)
   - Agregar schema `lostItems` (ver §2.3)
   - Exportar en `collections` object

2. **Crear script de seed para nuevas collections**
   - `scripts/seed-new-collections.ts`
   - Migrar datos de `fotos.astro`, `tienda.astro`, `objetos-perdidos.astro`

3. **Poblar `match-posts`** (8 registros)
   - Extraer datos hardcodeados de `fotos.astro`
   - Crear slugs únicos
   - Migrar arrays de imágenes

4. **Poblar `products`** (4 registros)
   - Extraer datos de `tienda.astro`
   - Migrar imágenes y precios

5. **Poblar `lost-items`** (3 registros)
   - Extraer datos de `objetos-perdidos.astro`

6. **Probar en admin**
   - Verificar que las nuevas collections aparecen
   - Probar crear/editar registros

**Archivos a modificar:**
- `src/content.config.ts` (agregar 3 schemas)
- `scripts/seed-new-collections.ts` (nuevo)

### Fase 3: Refactorizar Páginas (Sprint 3)

**Objetivo:** Cambiar páginas para leer de EmDash en vez de datos hardcodeados.

#### Tareas:

1. **Refactorizar `fotos.astro`**
   ```typescript
   // ANTES:
   const posts = [ /* array hardcodeado */ ];

   // DESPUÉS:
   import { getCollection } from 'astro:content';
   const posts = await getCollection('match-posts');
   ```

2. **Refactorizar `tienda.astro`**
   ```typescript
   import { getCollection } from 'astro:content';
   const products = await getCollection('products');
   ```

3. **Refactorizar `objetos-perdidos.astro`**
   ```typescript
   import { getCollection } from 'astro:content';
   const items = await getCollection('lost-items');
   ```

4. **Refactorizar `calendario.astro`**
   ```typescript
   import { getCalendar } from '../lib/content';
   const upcoming = await getCalendar('upcoming');
   const past = await getCalendar('past');
   ```

5. **Refactorizar `categorias.astro`**
   ```typescript
   import { getCategories } from '../lib/content';
   const categories = await getCategories();
   ```

6. **Actualizar `homeData.ts`**
   - Eliminar datos hardcodeados
   - Mantener solo funciones que leen de `lib/content.ts`
   - O deprecate y migrar todo a `lib/content.ts`

**Archivos a modificar:**
- `src/pages/fotos.astro`
- `src/pages/tienda.astro`
- `src/pages/objetos-perdidos.astro`
- `src/pages/calendario.astro`
- `src/pages/categorias.astro`
- `src/data/homeData.ts`

### Fase 4: Limpieza y Documentación (Sprint 4)

**Objetivo:** Limpiar código legacy y documentar para el cliente.

#### Tareas:

1. **Eliminar `fixtures.ts`**
   - Ya no es necesario si todo viene de EmDash
   - Actualizar imports si algún componente lo usa

2. **Actualizar `lib/content.ts`**
   - Agregar funciones helper para nuevas collections
   - `getMatchPosts()`, `getProducts()`, `getLostItems()`

3. **Documentar para el cliente**
   - Crear guía en `GUÍA-CLIENTE.md`
   - Explicar cómo usar `/_emdash/admin/`
   - Incluir screenshots y ejemplos
   - Advertencias sobre qué NO editar

4. **Actualizar documentación técnica**
   - `README.md` — agregar nuevas collections
   - `CHANGELOG.md` — documentar migración
   - `CLAUDE.md` — notas sobre arquitectura

5. **Probar flujo completo**
   - Editar un producto en admin
   - Verificar que aparece en tienda
   - Editar un partido en admin
   - Verificar que aparece en calendario

**Archivos a crear:**
- `GUÍA-CLIENTE.md`
- `MIGRACION-COMPLETADA.md` (resumen final)

---

## 5. Scripts de Migración

### 5.1 Script de Seed Principal

```typescript
// scripts/seed-emdash.ts
import { db } from '../src/lib/db'; // o el cliente de EmDash

async function seed() {
  console.log('🌱 Iniciando seed de EmDash CMS...');

  // 1. Next Match
  await db.insert(nextMatch).values({
    date: 'DOMINGO 15',
    month: 'SEPTIEMBRE',
    time: '10:00 AM',
    category: 'U-14',
    categorySlug: 'u-14',
    teams: 'PCFC vs Seleleccion Federativa',
    venue: 'Complejo Deportivo PCFC',
  });

  // 2. Categories
  const categories = [
    { slug: 'pre', badge: 'pre', ages: '4-6 años', name: 'Pre-escuela', copy: '...', order: 0 },
    { slug: 'form-baja', badge: 'form-baja', ages: '7-10 años', name: 'Formativas bajas', copy: '...', order: 1 },
    { slug: 'form-alta', badge: 'form-alta', ages: '11-14 años', name: 'Formativas altas', copy: '...', order: 2 },
    { slug: 'elite', badge: 'elite', ages: '15-19 años', name: 'Categoría Élite', copy: '...', order: 3 },
  ];
  await db.insert(categoriesTable).values(categories);

  // ... continuar con stats, pillars, gallery, sponsors, calendar

  console.log('✅ Seed completado');
}

seed().catch(console.error);
```

### 5.2 Script para Nuevas Collections

```typescript
// scripts/seed-new-collections.ts
async function seedNewCollections() {
  // Match Posts
  const matchPosts = [
    {
      title: 'PCFC vs Casa España U14',
      slug: 'pcfc-vs-casa-espana-u14',
      date: '15 sept. 2025',
      category: 'U-14',
      venue: 'Florer, Puerto',
      description: 'PCFC venció al equipo local...',
      coverImage: 'https://images.unsplash.com/...',
      images: [
        { src: 'https://...', alt: 'Jugador 1' },
        { src: 'https://...', alt: 'Jugador 2' },
      ],
      published: true,
    },
    // ... 7 posts más
  ];

  // Products
  const products = [
    {
      name: 'Camiseta local PCFC',
      slug: 'camiseta-local',
      description: 'Camiseta oficial...',
      price: 4500,
      currency: 'DOP',
      images: ['https://...'],
      sizes: ['S', 'M', 'L', 'XL'],
      inStock: true,
    },
    // ... 3 productos más
  ];

  // Lost Items
  const lostItems = [
    {
      title: 'Chaqueta negra',
      description: 'Chaqueta negra talla M...',
      location: 'Encontrada en la cancha',
      dateFound: '10 oct. 2025',
      status: 'found',
    },
    // ... 2 items más
  ];

  await db.insert(matchPostsTable).values(matchPosts);
  await db.insert(productsTable).values(products);
  await db.insert(lostItemsTable).values(lostItems);
}
```

---

## 6. Estrategia de Rollback

### Antes de Migrar

1. **Backup de `homeData.ts`**
   ```bash
   cp src/data/homeData.ts src/data/homeData.ts.backup
   ```

2. **Git tag antes de migración**
   ```bash
   git tag -a v1.0-pre-migration -m "Antes de migrar a EmDash"
   ```

### Si Algo Sale Mal

1. **Revertir cambios en páginas**
   ```bash
   git checkout v1.0-pre-migration -- src/pages/
   ```

2. **Restaurar `homeData.ts`**
   ```bash
   cp src/data/homeData.ts.backup src/data/homeData.ts
   ```

3. **Deshabilitar EmDash temporalmente**
   - Comentar imports de `lib/content.ts`
   - Volver a hardcode hasta resolver problema

### Después de Migrar

1. **Mantener `homeData.ts.backup` por 2 semanas**
2. **Monitorear errores en logs**
3. **Verificar que el cliente puede editar sin romper nada**

---

## 7. Testing y Validación

### 7.1 Tests Unitarios

```typescript
// tests/content.test.ts
import { describe, it, expect } from 'vitest';
import { getCollection } from 'astro:content';

describe('EmDash Collections', () => {
  it('should have next_match data', async () => {
    const items = await getCollection('next-match');
    expect(items.length).toBeGreaterThan(0);
  });

  it('should have 4 categories', async () => {
    const items = await getCollection('categories');
    expect(items.length).toBe(4);
  });

  it('should have products', async () => {
    const items = await getCollection('products');
    expect(items.length).toBeGreaterThan(0);
  });
});
```

### 7.2 Tests E2E (Admin UI)

1. **Crear producto via admin**
   - Ir a `/_emdash/admin/`
   - Crear nuevo producto
   - Verificar que aparece en `/tienda`

2. **Editar partido via admin**
   - Editar fecha de un partido
   - Verificar que aparece en `/calendario`

3. **Eliminar objeto perdido via admin**
   - Marcar como "reclamado"
   - Verificar que desaparece de `/objetos-perdidos`

### 7.3 Checklist de Validación

- [ ] Todos los datos hardcodeados aparecen en EmDash admin
- [ ] Se pueden crear nuevos registros sin errores
- [ ] Se pueden editar registros existentes
- [ ] Las páginas leen correctamente de EmDash
- [ ] No hay datos duplicados (hardcoded + EmDash)
- [ ] El cliente puede usar el admin sin entrenamiento extenso
- [ ] Los slugs son únicos y consistentes
- [ ] Las imágenes se cargan correctamente
- [ ] Los precios y fechas tienen formato correcto

---

## 8. Cronograma Estimado

| Fase | Duración | Dependencias |
|------|----------|--------------|
| **Fase 1:** Poblar collections existentes | 1-2 días | Ninguna |
| **Fase 2:** Crear nuevas collections | 1 día | Fase 1 |
| **Fase 3:** Refactorizar páginas | 2-3 días | Fase 2 |
| **Fase 4:** Limpieza y documentación | 1 día | Fase 3 |
| **Testing y validación** | 1 día | Fase 3 |
| **Total** | **6-8 días** | |

---

## 9. Riesgos y Mitigaciones

| Riesgo | Impacto | Probabilidad | Mitigación |
|--------|---------|--------------|------------|
| Cliente rompe diseño editando contenido | Alto | Media | Opción A: mantener diseño hardcodeado |
| Datos no migran correctamente | Alto | Baja | Backup + rollback plan |
| EmDash admin es confuso para cliente | Medio | Media | Crear guía con screenshots |
| Performance degrada con muchos registros | Bajo | Baja | EmDash usa D1 (SQLite), muy rápido |
| Images no cargan desde EmDash media | Medio | Media | Probar URLs antes de migrar |

---

## 10. Criterios de Éxito

La migración se considera exitosa cuando:

1. ✅ **El cliente puede editar cualquier contenido** sin tocar código
2. ✅ **No hay datos duplicados** (hardcoded + EmDash)
3. ✅ **Todas las páginas funcionan** igual que antes
4. ✅ **El cliente puede crear** nuevos productos, partidos, posts
5. ✅ **El cliente puede eliminar** objetos perdidos reclamados
6. ✅ **No se rompió el diseño** durante la migración
7. ✅ **Performance se mantiene** (o mejora)

---

## 11. Próximos Pasos Inmediatos

1. **Aprobar este plan** con el equipo
2. **Decidir Opción A o B** para value pillars y pathway cards
3. **Crear backup** de archivos actuales
4. **Empezar Fase 1** — poblar collections existentes
5. **Probar en staging** antes de producción

---

## 12. Referencias

- [Documentación de EmDash CMS](https://emdash.sh/docs)
- [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/)
- [Zod Schema Validation](https://zod.dev/)
- [Cloudflare D1 Database](https://developers.cloudflare.com/d1/)

---

**Última actualización:** 2026-09-08
**Autor:** Evaluación técnica del proyecto PCFC
