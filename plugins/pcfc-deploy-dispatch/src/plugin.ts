/**
 * Manifiesto del plugin (entrada principal del paquete).
 *
 * Dispara el deploy a Cloudflare vía GitHub Actions cada vez que se PUBLICA
 * contenido en EmDash (`content:afterPublish`). Los borradores no disparan
 * nada. El fallo de GitHub nunca rompe el guardado (ver dispatch.ts).
 *
 * Mínimo privilegio: solo salida HTTPS hacia `api.github.com`. Sin acceso a
 * contenido, medios ni usuarios. El PAT vive en el secreto wrangler
 * `GITHUB_DEPLOY_TOKEN` (o en el campo secreto de settings como fallback),
 * nunca en código.
 */

import { definePlugin, type PluginDescriptor } from "emdash";
import { createDeployDispatch } from "./dispatch.js";
import { PLUGIN_ID, VERSION } from "./schema.js";

/** Especificador de módulo que el host importa para cargar este plugin. */
const ENTRYPOINT = "pcfc-deploy-dispatch";

const CAPABILITIES = ["network:request"] as const;

const plugin = definePlugin({
  id: PLUGIN_ID,
  version: VERSION,
  // Solo necesitamos salida HTTPS hacia la API de GitHub.
  capabilities: [...CAPABILITIES],
  allowedHosts: ["api.github.com"],
  hooks: {
    // Publicación explícita únicamente: drafts/autosaves nunca disparan
    // deploy (ver filtro de `status` en dispatch.ts). `errorPolicy:
    // "continue"` garantiza que, aunque el handler rechazara, el host
    // jamás aborta el guardado/publicación por este plugin.
    "content:afterPublish": {
      handler: createDeployDispatch(),
      errorPolicy: "continue",
    },
  },
});

export default plugin;

/**
 * Factoría que el cargador de plugins de EmDash llama para instanciar el plugin.
 */
export function createPlugin(_options?: Record<string, unknown>) {
  return plugin;
}

/**
 * Registra el plugin en `emdash({ plugins: [...] })`.
 *
 * @example
 * ```ts
 * import { pcfcDeployDispatchPlugin } from "pcfc-deploy-dispatch";
 * emdash({ plugins: [pcfcDeployDispatchPlugin()] });
 * ```
 */
export function pcfcDeployDispatchPlugin(): PluginDescriptor {
  return {
    id: PLUGIN_ID,
    version: VERSION,
    entrypoint: ENTRYPOINT,
    capabilities: [...CAPABILITIES],
    allowedHosts: ["api.github.com"],
    settingsSchema: {
      githubToken: {
        type: "secret",
        label: "Token de GitHub (fallback)",
        description:
          "PAT con permiso Actions:write para disparar el deploy. Solo se usa si no existe el secreto wrangler GITHUB_DEPLOY_TOKEN. Se guarda cifrado y nunca se muestra tras guardarlo.",
      },
    },
  };
}

export { PLUGIN_ID } from "./schema.js";
