/**
 * Constantes del plugin pcfc-deploy-dispatch.
 *
 * El token de GitHub NUNCA vive aquí: se lee en runtime desde
 * `process.env.GITHUB_DEPLOY_TOKEN` (wrangler secret en prod, configurado
 * fuera del repo) con fallback a `ctx.settings` (campo secreto `githubToken`
 * del admin). Nada de esto se registra en logs.
 */

/** Identificador del plugin ante el host EmDash. */
export const PLUGIN_ID = "pcfc-deploy-dispatch";

/** Versión del paquete; en un solo lugar para el manifiesto y el descriptor. */
export const VERSION = "1.0.0";

/** Repo que recibe el repository_dispatch. */
export const GITHUB_OWNER = "Jontm5286";
export const GITHUB_REPO = "pcfc";

/** URL del endpoint repository_dispatch de GitHub. */
export const DISPATCH_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/dispatches`;

/** event_type que escucha .github/workflows/deploy.yml. */
export const DISPATCH_EVENT_TYPE = "emdash-publish";

/** Nombre de la variable de entorno / secreto wrangler con el PAT de GitHub. */
export const GITHUB_TOKEN_ENV = "GITHUB_DEPLOY_TOKEN";

/** Clave del campo secreto en settingsSchema (fallback configurable en admin). */
export const SETTING_GITHUB_TOKEN = "githubToken";
