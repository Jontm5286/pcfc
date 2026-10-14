/**
 * Handler exclusivo `email:deliver`: envía el mensaje vía API HTTP de Resend.
 *
 * Se ejecuta con el contexto del plugin (sin acceso al entorno ni a los
 * bindings de Cloudflare): sale por `ctx.http` (capability `network:request`
 * + `allowedHosts: ["api.resend.com"]`) y lee la configuración desde
 * `ctx.kv` (settings guardados en el admin, nunca en código).
 */

import type { EmailDeliverEvent, PluginContext } from "emdash/plugin";
import {
  DEFAULT_FROM_EMAIL,
  DEFAULT_FROM_NAME,
  PLUGIN_ID,
  RESEND_SEND_URL,
  SETTING_API_KEY,
  SETTING_FROM_EMAIL,
  SETTING_FROM_NAME,
} from "./schema.js";

interface ResendErrorBody {
  message?: string;
  name?: string;
}

/**
 * Envía un email transaccional (magic links, invitaciones, recuperación)
 * a través de Resend. Lanza si falta la API key o si Resend rechaza el envío.
 */
export function createResendDeliver() {
  return async (event: EmailDeliverEvent, ctx: PluginContext): Promise<void> => {
    const apiKey = await ctx.kv.get<string>(SETTING_API_KEY);
    if (!apiKey) {
      throw new Error(
        `[${PLUGIN_ID}] sin API key de Resend. ` +
          `Configúrala en el admin: Ajustes del plugin "${PLUGIN_ID}" (campo "API key de Resend").`,
      );
    }

    const fromEmail =
      (await ctx.kv.get<string>(SETTING_FROM_EMAIL)) || DEFAULT_FROM_EMAIL;
    const fromName =
      (await ctx.kv.get<string>(SETTING_FROM_NAME)) || DEFAULT_FROM_NAME;

    const payload: Record<string, unknown> = {
      from: `${fromName} <${fromEmail}>`,
      to: [event.message.to],
      subject: event.message.subject,
      text: event.message.text,
    };
    if (event.message.html) payload["html"] = event.message.html;

    let response: Response;
    try {
      response = await ctx.http.fetch(RESEND_SEND_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      throw new Error(
        `[${PLUGIN_ID}] no se pudo contactar la API de Resend: ` +
          `${error instanceof Error ? error.message : String(error)}`,
      );
    }

    if (!response.ok) {
      let detail = `HTTP ${response.status}`;
      try {
        const body = (await response.json()) as ResendErrorBody;
        if (body.message) detail += `: ${body.message}`;
      } catch {
        // Respuesta no JSON; nos quedamos con el estado HTTP.
      }
      throw new Error(`[${PLUGIN_ID}] Resend rechazó el envío (${detail}).`);
    }

    ctx.log.info(`[${PLUGIN_ID}] email enviado a ${event.message.to}`, {
      source: event.source,
    });
  };
}
