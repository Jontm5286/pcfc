/**
 * Script de diagnóstico para la colección sponsors en EmDash DB.
 * Ejecutar: node scripts/check-sponsors.mjs
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, '..', 'data-seeded.db');

console.log('🔍 PCFC Sponsors Diagnostic\n');
console.log(`📁 DB Path: ${DB_PATH}\n`);

try {
  const db = new Database(DB_PATH, { readonly: true });

  // 1. Total de sponsors
  const total = db.prepare('SELECT COUNT(*) as count FROM ec_sponsors').get();
  console.log(`📊 Total sponsors en DB: ${total.count}\n`);

  // 2. Por status
  const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM ec_sponsors GROUP BY status').all();
  console.log('📋 Por status:');
  byStatus.forEach(row => console.log(`   ${row.status}: ${row.count}`));
  console.log();

  // 3. Lista completa
  const sponsors = db.prepare(`
    SELECT slug, name, status, "order",
           substr(logo, 1, 100) as logo_preview,
           href
    FROM ec_sponsors
    ORDER BY "order"
  `).all();

  console.log('📋 Lista de sponsors:\n');
  sponsors.forEach((s, i) => {
    console.log(`${i + 1}. [${s.status}] ${s.name} (order: ${s.order})`);
    console.log(`   slug: ${s.slug}`);
    console.log(`   href: ${s.href || '(vacío)'}`);
    console.log(`   logo: ${s.logo_preview}${s.logo_preview.length >= 100 ? '...' : ''}`);
    console.log();
  });

  // 4. Verificar si hay logos JSON (EmDash media)
  const withJsonLogo = db.prepare(`
    SELECT slug, name, status
    FROM ec_sponsors
    WHERE logo LIKE '{%'
  `).all();

  console.log(`🎨 Sponsors con logo JSON (EmDash media): ${withJsonLogo.length}`);
  withJsonLogo.forEach(s => console.log(`   - ${s.name} (${s.slug})`));
  console.log();

  // 5. Verificar si hay logos URL (stock/external)
  const withUrlLogo = db.prepare(`
    SELECT slug, name, status
    FROM ec_sponsors
    WHERE logo LIKE 'http%'
  `).all();

  console.log(`🔗 Sponsors con logo URL externa: ${withUrlLogo.length}`);
  withUrlLogo.forEach(s => console.log(`   - ${s.name} (${s.slug})`));
  console.log();

  // 6. Verificar schema
  const schema = db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='ec_sponsors'`).get();
  if (schema) {
    console.log('🗄️  Schema de ec_sponsors:');
    const columns = schema.sql.match(/"[^"]+"/g);
    columns?.forEach(col => console.log(`   ${col}`));
  }

  db.close();
  console.log('\n✅ Diagnóstico completado');
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
