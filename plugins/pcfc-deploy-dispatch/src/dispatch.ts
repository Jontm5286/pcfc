/**
 * Handler `content:afterPublish`: dispara el deploy a Cloudflare vía
 * GitHub Actions (repository_dispatch) cuando se PUBLICA contenido.
 *
 * Solo escucha `afterPublish`: los borradores nunca disparan deploy.
 *
 * Seguridad / aislamiento total:
 * - El PAT se lee de `process.env.GITHUB_DEPLOY_TOKEN` (secreto wrangler
 *   `GITHUB_DEPLOY_TOKEN` en prod, configurado fuera del repo con
 *   `wrangler secret put`) con fallback al campo secreto `githubToken` de
 *   los settings del plugin (admin, cifrado en D1). Nunca va en código.
 * - El token jamás se escribe en logs.
 * - Este handler NUNCA lanza: evento no-publicado, sin token, fallo de red
 *   o rechazo de GitHub solo registran un warning y el guardado/publicación
 *   SIGUE intacto. Ni siquiera el bloque `catch` puede lanzar (usa
 *   `safeWarn`, que jamás lanza).
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

/**
 * Log de warning que jamás lanza: si `ctx.log` no existe o falla,
 * cae a `console.warn`; si eso también falla, se traga el error.
 */
function safeWarn(
  ctx: PluginContext | undefined,
  message: string,
  data?: unknown,
): void {
  try {
    if (ctx?.log && typeof ctx.log.warn === "function") {
      ctx.log.warn(message, data);
      return;
    }
  } catch {
    // cae al fallback de consola
  }
  try {
    console.warn(message);
  } catch {
    // jamás lanzar: un fallo de logging no puede romper el guardado
  }
}

function safeInfo(
  ctx: PluginContext | undefined,
  message: string,
  data?: unknown,
): void {
  try {
    if (ctx?.log && typeof ctx.log.info === "function") {
      ctx.log.info(message, data);
      return;
    }
  } catch {
    // cae al fallback de consola
  }
  try {
    console.info(message);
  } catch {
    // jamás lanzar
  }
}

async function resolveToken(
  ctx: PluginContext,
): Promise<string | null> {
  try {
    const fromEnv =
      typeof process !== "undefined"
        ? process.env[GITHUB_TOKEN_ENV]
        : undefined;
    if (fromEnv && fromEnv.length > 0) return fromEnv;
  } catch {
    // `process.env` inaccesible en este runtime: se sigue al fallback.
  }
  try {
    if (!ctx?.settings || typeof ctx.settings.get !== "function") return null;
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
 *
 * El handler solo actúa ante publicación explícita (`status === "published"`);
 * cualquier otro estado (draft, autosave, borrador) se ignora con un warning.
 * Ninguna ruta lanza excepciones.
 */
export function createDeployDispatch() {
  return async (
    event: ContentPublishStateChangeEvent,
    ctx: PluginContext,
  ): Promise<void> => {
    try {
      // Filtro publish vs autosave/draft: solo la publicación explícita
      // dispara el deploy. Si el estado es conocido y no es "published"
      // (borrador, autosave), se ignora sin hacer nada.
      const content = event?.content as Record<string, unknown> | undefined;
      const status = content?.["status"];
      if (status !== undefined && status !== "published") {
        safeWarn(
          ctx,
          `[${PLUGIN_ID}] evento no-publicado (status=${String(status)}); deploy no disparado.`,
          { collection: event?.collection },
        );
        return;
      }
      if (!ctx?.http || typeof ctx.http.fetch !== "function") {
        safeWarn(
          ctx,
          `[${PLUGIN_ID}] sin capacidad "network:request"; deploy no disparado.`,
          { collection: event?.collection },
        );
        return;
      }
      const token = await resolveToken(ctx);
      if (!token) {
        safeWarn(
          ctx,
          `[${PLUGIN_ID}] sin token de GitHub; deploy no disparado. ` +
            `Configura el secreto wrangler "${GITHUB_TOKEN_ENV}" o el campo secreto del plugin en el admin.`,
          { collection: event?.collection },
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
      if (!response || !response.ok) {
        safeWarn(
          ctx,
          `[${PLUGIN_ID}] GitHub rechazó el dispatch (HTTP ${response?.status}); el contenido quedó publicado, el deploy no se disparó.`,
          { collection: event?.collection },
        );
        return;
      }
      safeInfo(ctx, `[${PLUGIN_ID}] deploy disparado vía GitHub Actions.`, {
        collection: event?.collection,
      });
    } catch (error) {
      // Aislamiento total: un fallo de red/GitHub jamás rompe la
      // publicación. Este bloque no toca nada que pueda lanzar.
      safeWarn(
        ctx,
        `[${PLUGIN_ID}] no se pudo disparar el deploy: ` +
          `${error instanceof Error ? error.message : String(error)}. ` +
          `El contenido quedó publicado.`,
      );
    }
  };
}
