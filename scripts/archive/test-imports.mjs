// Test what each import actually exports
console.log('🔍 Testing EmDash imports...\n');

try {
  const main = await import('emdash');
  console.log('✅ from "emdash":');
  console.log('   emdashLoader:', typeof main.emdashLoader);
  console.log('   getEmDashCollection:', typeof main.getEmDashCollection);
  console.log('   defineLiveCollection:', typeof main.defineLiveCollection);
} catch (err) {
  console.log('❌ Error importing "emdash":', err.message);
}

console.log();

try {
  const runtime = await import('emdash/runtime');
  console.log('✅ from "emdash/runtime":');
  console.log('   emdashLoader:', typeof runtime.emdashLoader);
  console.log('   getDb:', typeof runtime.getDb);
} catch (err) {
  console.log('❌ Error importing "emdash/runtime":', err.message);
}
