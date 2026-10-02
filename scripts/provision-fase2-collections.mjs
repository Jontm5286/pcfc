#!/usr/bin/env node
/**
 * provision-fase2-collections — PCFC FASE 2
 * Crea en data/emdash.db las colecciones que falten (staff, products, faqs)
 * con el mecanismo propio de EmDash (SchemaRegistry.createCollection/createField:
 * tabla ec_* + triggers) y siembra entradas de ejemplo vía ContentRepository
 * (create published). IDEMPOTENTE: si la colección ya tiene datos, no la toca.
 * NO toca: categories (ya tiene 4), sponsors, blog, ni .emdash/seed.json.
 */
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Kysely, SqliteDialect } from 'kysely';
import DB from 'better-sqlite3';
import { SchemaRegistry, ContentRepository } from 'emdash';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const db = new Kysely({
  dialect: new SqliteDialect({ database: new DB(join(root, 'data', 'emdash.db')) }),
});
const registry = new SchemaRegistry(db);
const repo = new ContentRepository(db);

const DEFS = [
  {
    collection: {
      slug: 'staff',
      label: 'Staff',
      labelSingular: 'Miembro',
      supports: ['drafts'],
      routable: false,
    },
    fields: [
      { slug: 'name', label: 'Nombre', type: 'string', required: true, searchable: true },
      { slug: 'role', label: 'Rol', type: 'string', required: false },
      { slug: 'bio', label: 'Bio', type: 'text', required: false },
      { slug: 'photo', label: 'Foto', type: 'image', required: false },
      { slug: 'order', label: 'Orden', type: 'number', required: false },
    ],
    seeds: [
      {
        slug: 'director-deportivo',
        data: {
          name: 'Carlos Méndez',
          role: 'Director Deportivo',
          bio: 'Ex-jugador profesional con 15 años formando talento joven en el Caribe.',
          order: 1,
        },
      },
      {
        slug: 'coordinadora-formativas',
        data: {
          name: 'Laura Jiménez',
          role: 'Coordinadora Formativas',
          bio: 'Licenciada en educación física; lidera las categorías Pre y Formativas Bajas.',
          order: 2,
        },
      },
    ],
  },
  {
    collection: {
      slug: 'products',
      label: 'Productos',
      labelSingular: 'Producto',
      supports: ['drafts'],
      routable: false,
    },
    fields: [
      { slug: 'name', label: 'Nombre', type: 'string', required: true, searchable: true },
      { slug: 'price', label: 'Precio (RD$)', type: 'number', required: false },
      { slug: 'category', label: 'Categoría', type: 'string', required: false },
      { slug: 'badge', label: 'Badge', type: 'string', required: false },
      { slug: 'description', label: 'Descripción', type: 'text', required: false },
      { slug: 'order', label: 'Orden', type: 'number', required: false },
    ],
    seeds: [
      {
        slug: 'camiseta-titular-2026',
        data: {
          name: 'Camiseta Titular 2026',
          price: 1250,
          category: 'Uniforme Oficial',
          badge: 'Más Vendido',
          description: 'Camiseta oficial de juego temporada 2026.',
          order: 1,
        },
      },
      {
        slug: 'pelota-entrenamiento-pcfc',
        data: {
          name: 'Pelota de Entrenamiento PCFC',
          price: 1200,
          category: 'Entrenamiento',
          badge: 'Nuevo',
          description: 'Pelota oficial de entrenamiento del club.',
          order: 2,
        },
      },
    ],
  },
  {
    collection: {
      slug: 'faqs',
      label: 'FAQs',
      labelSingular: 'FAQ',
      supports: ['drafts'],
      routable: false,
    },
    fields: [
      { slug: 'question', label: 'Pregunta', type: 'string', required: true, searchable: true },
      { slug: 'answer', label: 'Respuesta', type: 'text', required: false },
      { slug: 'page', label: 'Página', type: 'string', required: false },
      { slug: 'order', label: 'Orden', type: 'number', required: false },
    ],
    seeds: [
      {
        slug: 'faq-edad-minima',
        data: {
          question: '¿Desde qué edad puede inscribirse mi hijo?',
          answer: 'Aceptamos niños y niñas desde los 4 años en Pre-Formativas hasta los 19 en Elite/Reserva.',
          page: 'padres',
          order: 1,
        },
      },
      {
        slug: 'faq-que-necesita',
        data: {
          question: '¿Qué necesita mi hijo para el primer entrenamiento?',
          answer: 'Ropa deportiva cómoda, tenis o tacos, agua y muchas ganas de jugar. Nosotros ponemos el resto.',
          page: 'padres',
          order: 2,
        },
      },
    ],
  },
];

for (const def of DEFS) {
  const { slug } = def.collection;
  const existing = await registry.getCollection(slug).catch(() => null);
  if (existing) {
    // Colección existe: si ya tiene datos, no tocar (reportar).
    let count = -1;
    try {
      const row = await db
        .selectFrom(`ec_${slug}`)
        .select(db.fn.countAll().as('c'))
        .executeTakeFirst();
      count = Number(row?.c ?? -1);
    } catch {
      count = -1;
    }
    console.log(`= colección ${slug} ya existe en DB (${count} filas) — no tocada`);
    if (count > 0) continue;
  } else {
    await registry.createCollection(def.collection);
    console.log(`+ colección ${slug} creada (tabla ec_${slug})`);
  }
  for (const f of def.fields) {
    const has = await registry.getField(slug, f.slug).catch(() => null);
    if (has) {
      console.log(`= campo ${slug}.${f.slug} existe`);
      continue;
    }
    try {
      await registry.createField(slug, {
        slug: f.slug,
        label: f.label,
        type: f.type,
        required: f.required ?? false,
        searchable: f.searchable ?? false,
      });
      console.log(`+ campo ${slug}.${f.slug} creado`);
    } catch (e) {
      if (e?.code === 'RESERVED_SLUG') {
        console.log(`= campo ${slug}.${f.slug} reservado (columna sistema), omitido`);
        continue;
      }
      throw e;
    }
  }
  let created = 0;
  for (const seed of def.seeds) {
    const found = await repo.findBySlug(slug, seed.slug).catch(() => null);
    if (found) {
      console.log(`= existe ${slug}/${seed.slug}`);
      continue;
    }
    await repo.create({ type: slug, slug: seed.slug, status: 'published', data: seed.data });
    created++;
    console.log(`+ published ${slug}/${seed.slug}`);
  }
  console.log(`${slug}: creados ${created}.`);
}
await db.destroy();
