/**
 * Handler `content:afterPublish`: dispara el deploy a Cloudflare vía
 * GitHub Actions (repository_dispatch) cuando se PUBLICA contenido.
 *
 * Solo escucha `afterPublish`: los borradores nunca disparan deploy.
 *
 * Seguridad:
 * - El PAT se lee de `process.env.GITHUB_DEPLOY_TOKEN` (secreto wrangler
 *   `GITHUB_DEPLOY_TOKEN` en prod, configurado fuera del repo con
 *   `wrangler secret put`) con fallback al campo secreto `githubToken` de
 *   los settings del plugin (admin, cifrado en D1). Nunca va en código.
 * - El token jamás se escribe en logs.
 * - Todo está envuelto en try/catch: si GitHub falla o no hay token, se
 *   registra un warning y el guardado/publicación SIGUE intacto. Este
 *   handler nunca lanza.
 */

import type {
  ContentPublishStateChangeEvent,
  PluginContext,
} from "emdash/plugin";
import {
  DISPATCH_EVENT_TYPE,
  DISPATCH_URL,
  GITHUB_TOKEN_ENV,
  PLUGIN_ID,
  SETTING_GITHUB_TOKEN,
} from "./schema.js";

async function resolveToken(
  ctx: PluginContext,
): Promise<string | null> {
  const fromEnv =
    typeof process !== "undefined"
      ? process.env[GITHUB_TOKEN_ENV]
      : undefined;
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  try {
    const fromSettings =
      await ctx.settings.get<string>(SETTING_GITHUB_TOKEN);
    if (fromSettings && fromSettings.length > 0) return fromSettings;
  } catch {
    // settings inaccesible: se trata como "sin token" abajo.
  }
  return null;
}

/**
 * Construye el handler `content:afterPublish` del deploy.
 */
export function createDeployDispatch() {
  return async (
    event: ContentPublishStateChangeEvent,
    ctx: PluginContext,
  ): Promise<void> => {
    try {
      if (!ctx.http) {
        ctx.log.warn(
          `[${PLUGIN_ID}] sin capacidad "network:request"; deploy no disparado.`,
          { collection: event.collection },
        );
        return;
      }
      const token = await resolveToken(ctx);
      if (!token) {
        ctx.log.warn(
          `[${PLUGIN_ID}] sin token de GitHub; deploy no disparado. ` +
            `Configura el secreto wrangler "${GITHUB_TOKEN_ENV}" o el campo secreto del plugin en el admin.`,
          { collection: event.collection },
        );
        return;
      }
      const response = await ctx.http.fetch(DISPATCH_URL, {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ event_type: DISPATCH_EVENT_TYPE }),
      });
      if (!response.ok) {
        ctx.log.warn(
          `[${PLUGIN_ID}] GitHub rechazó el dispatch (HTTP ${response.status}); el contenido quedó publicado, el deploy no se disparó.`,
          { collection: event.collection },
        );
        return;
      }
      ctx.log.info(`[${PLUGIN_ID}] deploy disparado vía GitHub Actions.`, {
        collection: event.collection,
      });
    } catch (error) {
      // Aislamiento total: un fallo de red/GitHub jamás rompe la publicación.
      ctx.log.warn(
        `[${PLUGIN_ID}] no se pudo disparar el deploy: ` +
          `${error instanceof Error ? error.message : String(error)}. ` +
          `El contenido quedó publicado.`,
      );
    }
  };
}
