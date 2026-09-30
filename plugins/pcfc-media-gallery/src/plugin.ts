/**
 * Manifiesto del plugin (entrada principal del paquete).
 *
 * Fork vendorizado de `emdash-plugin-media-gallery` (MIT, Georgi Georgiev —
 * ver LICENSE y README.md) adaptado como código propio de Punta Cana FC,
 * con la UI de administración traducida al español.
 *
 * Es un plugin nativo de EmDash: declara un widget de campo en `admin` y un
 * hook de validación en servidor. No importa código admin/React — la UI del
 * editor se referencia por especificador de módulo (`admin.entry`) y solo se
 * carga dentro del bundle del admin, manteniendo esta entrada segura en servidor.
 */

import { definePlugin, type PluginDescriptor } from "emdash";
import { createGalleryBeforeSave } from "./hook.js";
import { IMAGE_WIDGET_NAME, PLUGIN_ID, WIDGET_NAME } from "./schema.js";

/** Versión del paquete; en un solo lugar para el manifiesto y el descriptor. */
export const VERSION = "1.0.0";

/** Especificador de módulo que el host importa para cargar este plugin. */
const ENTRYPOINT = "pcfc-media-gallery";

/** Especificador de módulo que el bundle del admin importa para el widget. */
const ADMIN_ENTRY = "pcfc-media-gallery/admin";

const plugin = definePlugin({
  id: PLUGIN_ID,
  version: VERSION,
  // Mínimo privilegio: solo necesitamos leer la tabla media para verificar referencias.
  capabilities: ["read:media"],
  admin: {
    // Lo carga el bundle del admin; ver el export "./admin" del paquete.
    entry: "pcfc-media-gallery/admin",
    fieldWidgets: [
      {
        name: WIDGET_NAME,
        label: "Galería de medios",
        // Guardamos en un campo `json` nativo y controlamos su UI de edición.
        fieldTypes: ["json"],
      },
      {
        name: IMAGE_WIDGET_NAME,
        label: "Imagen (con buscador)",
        // Un selector de imagen única con buscador para un campo `image` nativo.
        fieldTypes: ["image"],
      },
    ],
  },
  hooks: {
    "content:beforeSave": createGalleryBeforeSave(),
  },
});

export default plugin;

/**
 * Factoría que el cargador de plugins de EmDash llama para instanciar el plugin.
 *
 * El `virtual:emdash/plugins` generado por EmDash hace
 * `import { createPlugin } from "<entrypoint>"` y lo llama con las
 * `options` del descriptor. No tenemos opciones aún, así que devuelve la definición.
 */
export function createPlugin(_options?: Record<string, unknown>) {
  return plugin;
}

/**
 * Registra el plugin en `emdash({ plugins: [...] })`.
 *
 * Devuelve un {@link https://github.com/emdash-cms/emdash | PluginDescriptor}: el
 * host importa `entrypoint` (este paquete) para obtener la definición de arriba.
 *
 * `adminEntry` es obligatorio para que el widget cargue — EmDash solo importa el
 * módulo admin de un plugin (en el bundle del admin) cuando el descriptor lo declara.
 *
 * @example
 * ```ts
 * import { pcfcMediaGalleryPlugin } from "pcfc-media-gallery";
 * emdash({ plugins: [pcfcMediaGalleryPlugin()] });
 * ```
 */
export function pcfcMediaGalleryPlugin(): PluginDescriptor {
  return {
    id: PLUGIN_ID,
    version: VERSION,
    entrypoint: ENTRYPOINT,
    adminEntry: ADMIN_ENTRY,
    capabilities: ["read:media"],
    settingsSchema: {
      searchEndpoint: {
        type: "url",
        label: "Endpoint de búsqueda de medios",
        description:
          "URL de un endpoint de búsqueda de medios provisto por el sitio. Si se configura, " +
          "los widgets de galería e imagen muestran un buscador. " +
          "El endpoint recibe GET ?q=<término> y debe devolver { results: [{ id, storageKey?, mimeType?, width?, height?, filename? }] }. " +
          "La opción searchEndpoint de cada campo tiene prioridad sobre este ajuste global.",
        placeholder: "/api/media-search",
      },
    },
    fieldWidgets: [
      {
        name: WIDGET_NAME,
        label: "Galería de medios",
        fieldTypes: ["json"],
      },
      {
        name: IMAGE_WIDGET_NAME,
        label: "Imagen (con buscador)",
        fieldTypes: ["image"],
      },
    ],
  };
}

// Re-exporta el contrato para importar tipos/constantes desde la raíz.
export type { GalleryItem, GalleryOptions } from "./schema.js";
export { PLUGIN_ID, WIDGET_NAME, WIDGET_REF } from "./schema.js";
