/**
 * Variables y secretos del Worker en Astro 7.
 *
 * `Astro.locals.runtime.env` desapareció en Astro 7: leerlo lanza y el endpoint
 * responde 500. El binding se obtiene con el import dinámico de
 * `cloudflare:workers` (mismo patrón que src/lib/foto-likes-db.ts); en
 * `astro dev` puede no existir y se cae a import.meta.env / process.env.
 */
export async function workerEnv(): Promise<Record<string, unknown>> {
  try {
    const cf = (await import(/* @vite-ignore */ 'cloudflare:workers')) as unknown as {
      env?: Record<string, unknown>;
    };
    if (cf?.env) return cf.env;
  } catch {
    /* dev sin runtime de Workers */
  }
  return {};
}

export async function readEnv(key: string): Promise<string> {
  const fromWorker = (await workerEnv())[key];
  if (typeof fromWorker === 'string' && fromWorker.trim()) return fromWorker.trim();
  try {
    const fromMeta = (import.meta as unknown as { env?: Record<string, unknown> })?.env?.[key];
    if (typeof fromMeta === 'string' && fromMeta.trim()) return fromMeta.trim();
  } catch {
    /* import.meta.env no disponible */
  }
  const fromProcess =
    typeof process !== 'undefined'
      ? (process.env as Record<string, string | undefined>)[key]
      : undefined;
  return typeof fromProcess === 'string' ? fromProcess.trim() : '';
}
