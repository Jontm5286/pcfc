/**
 * Constantes del proveedor de email Resend para Punta Cana FC.
 *
 * La API key NUNCA vive en código: se guarda desde el admin
 * (Ajustes del plugin) en la tabla `options` de D1 bajo
 * `plugin:<id>:settings:apiKey` y se lee en el handler vía `ctx.kv`.
 */

/** Identificador del plugin (coincide con el nombre del paquete). */
export const PLUGIN_ID = "pcfc-email-resend";

/** Host permitido para `network:request` (mínimo privilegio). */
export const RESEND_API_HOST = "api.resend.com";

/** Endpoint de envío de la API de Resend. */
export const RESEND_SEND_URL = "https://api.resend.com/emails";

/** Remitente por defecto (dominio verificado en Resend). */
export const DEFAULT_FROM_EMAIL = "no-reply@puntacanafc.com";

/** Nombre visible por defecto del remitente. */
export const DEFAULT_FROM_NAME = "Punta Cana FC";

/** Claves de settings tal como se leen vía `ctx.kv.get("settings:<clave>")`. */
export const SETTING_API_KEY = "settings:apiKey";
export const SETTING_FROM_EMAIL = "settings:fromEmail";
export const SETTING_FROM_NAME = "settings:fromName";
