/**
 * Compila el entry admin del widget pcfc-media-gallery a JS de producción.
 *
 * Por qué existe: EmDash importa `pcfc-media-gallery/admin` dentro del bundle
 * del admin. Si ese entry apunta a TSX fuente, el dev server (Vite) lo
 * transforma en modo desarrollo (`react/jsx-dev-runtime`, `_jsxDEV`), un
 * runtime que el sandbox del admin no provee y que revienta el diálogo
 * 'Añadir a la galería' con `_jsxDEV is not a function`.
 *
 * Este bundle usa siempre JSX automático de PRODUCCIÓN (`react/jsx-runtime`):
 * esbuild solo emite `jsx-dev-runtime` con `jsxDev: true`, flag que aquí no
 * se activa. Verificación: `grep -r "jsxDEV\|jsx-dev-runtime" dist/` debe
 * devolver vacío tras compilar.
 *
 * Uso: `node scripts/build-pcfc-gallery-admin.mjs`
 * (encadenado en `pnpm build` y `pnpm build:cf`; no requiere dev server).
 */
import { build } from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const plugin = path.join(root, "plugins", "pcfc-media-gallery");

await build({
  entryPoints: [path.join(plugin, "src/admin/index.tsx")],
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  // JSX automático de producción. Sin `jsxDev: true`, esbuild importa
  // `react/jsx-runtime` (nunca `react/jsx-dev-runtime` / `_jsxDEV`).
  jsx: "automatic",
  external: [
    "react",
    "react/*",
    "react-dom",
    "react-dom/*",
    "@emdash-cms/admin",
    "@emdash-cms/admin/*",
    "emdash",
    "emdash/*",
  ],
  outfile: path.join(plugin, "dist/admin/index.js"),
  logLevel: "info",
});
