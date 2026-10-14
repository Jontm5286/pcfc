/**
 * Manifiesto del plugin (entrada principal del paquete).
 *
 * Proveedor de email transaccional para EmDash vía API HTTP de Resend.
 * Registra el hook exclusivo `email:deliver` (capability canónica
 * `hooks.email-transport:register`) para que el magic link —y cualquier
 * email del sistema— funcione en producción (Workers), donde el proveedor
 * de consola de dev no existe.
 *
 * Mínimo privilegio: solo red hacia `api.resend.com`. Sin acceso a
 * contenido, medios ni usuarios. La API key vive en settings (D1, campo
 * `secret`), nunca en código.
 */

import { definePlugin, type PluginDescriptor } from "emdash";
import { createResendDeliver } from "./deliver.js";
import {
  DEFAULT_FROM_EMAIL,
  DEFAULT_FROM_NAME,
  PLUGIN_ID,
  RESEND_API_HOST,
} from "./schema.js";

/** Versión del paquete; en un solo lugar para el manifiesto y el descriptor. */
export const VERSION = "1.0.0";

/** Especificador de módulo que el host importa para cargar este plugin. */
const ENTRYPOINT = "pcfc-email-resend";

const CAPABILITIES = [
  "hooks.email-transport:register",
  "network:request",
] as const;

const plugin = definePlugin({
  id: PLUGIN_ID,
  version: VERSION,
  // Transporte de email + salida HTTPS solo a la API de Resend.
  capabilities: [...CAPABILITIES],
  allowedHosts: [RESEND_API_HOST],
  hooks: {
    "email:deliver": { exclusive: true, handler: createResendDeliver() },
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
 * import { pcfcEmailResendPlugin } from "pcfc-email-resend";
 * emdash({ plugins: [pcfcEmailResendPlugin()] });
 * ```
 */
export function pcfcEmailResendPlugin(): PluginDescriptor {
  return {
    id: PLUGIN_ID,
    version: VERSION,
    entrypoint: ENTRYPOINT,
    capabilities: [...CAPABILITIES],
    allowedHosts: [RESEND_API_HOST],
    settingsSchema: {
      apiKey: {
        type: "secret",
        label: "API key de Resend",
        description:
          "Clave de API de Resend (empieza con re_). Se guarda en D1 y nunca se muestra tras guardarla. Sin ella el envío falla con error explícito.",
      },
      fromEmail: {
        type: "email",
        label: "Remitente",
        description:
          "Dirección remitente. Debe pertenecer a un dominio verificado en Resend.",
        default: DEFAULT_FROM_EMAIL,
        placeholder: DEFAULT_FROM_EMAIL,
      },
      fromName: {
        type: "string",
        label: "Nombre del remitente",
        description: "Nombre visible en el campo From del correo.",
        default: DEFAULT_FROM_NAME,
      },
    },
  };
}

export { PLUGIN_ID } from "./schema.js";
