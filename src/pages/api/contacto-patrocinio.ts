import type { APIRoute } from 'astro';

/**
 * POST /api/contacto-patrocinio
 * Formulario "¿Tu marca aquí?" (/sponsors#contacto).
 * Envía la solicitud a rrhhpuntacanafc@gmail.com vía Cloudflare Email Service
 * (binding `SEB` de tipo send_email). En dev sin binding, registra en consola
 * y responde ok para poder probar el flujo del formulario.
 */

const DESTINO_DEFAULT = 'rrhhpuntacanafc@gmail.com';
const REMITENTE_DEFAULT = 'alianzas@puntacanafc.com';

const MAX = { marca: 120, contacto: 120, email: 254, telefono: 40, mensaje: 2000 } as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface EmailBinding {
  send: (msg: Record<string, unknown>) => Promise<unknown>;
}

function str(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function getEnv(locals: unknown): { env: Record<string, unknown> } {
  const runtime = (locals as { runtime?: { env?: Record<string, unknown> } } | undefined)?.runtime;
  return { env: runtime?.env ?? {} };
}

export const POST: APIRoute = async ({ request, locals }) => {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: 'Solicitud inválida. Inténtalo de nuevo.' }, 400);
  }

  // Honeypot anti-spam: los bots lo rellenan, los humanos no lo ven.
  if (typeof body.sitio_web === 'string' && body.sitio_web.trim() !== '') {
    return json({ ok: true });
  }

  const marca = str(body.marca, MAX.marca);
  const contacto = str(body.contacto, MAX.contacto);
  const email = str(body.email, MAX.email);
  const telefono = str(body.telefono, MAX.telefono);
  const mensaje = str(body.mensaje, MAX.mensaje);
  const terminos = body.terminos === true;

  if (!marca || !contacto || !email || !telefono || !mensaje) {
    return json({ ok: false, error: 'Completa todos los campos obligatorios.' }, 400);
  }
  if (!EMAIL_RE.test(email)) {
    return json({ ok: false, error: 'El correo electrónico no es válido.' }, 400);
  }
  if (!terminos) {
    return json({ ok: false, error: 'Debes aceptar los términos y condiciones.' }, 400);
  }

  const { env } = getEnv(locals);
  const destino =
    (typeof env.SPONSOR_EMAIL === 'string' && env.SPONSOR_EMAIL.trim()) ||
    DESTINO_DEFAULT;
  const remitente =
    (typeof env.SPONSOR_FROM === 'string' && env.SPONSOR_FROM.trim()) || REMITENTE_DEFAULT;

  const subject = `Nueva solicitud de patrocinio — ${marca}`;
  const text = [
    `Nueva solicitud de patrocinio desde puntacanafc.com/sponsors`,
    ``,
    `Marca: ${marca}`,
    `Persona de contacto: ${contacto}`,
    `Correo: ${email}`,
    `Teléfono: ${telefono}`,
    ``,
    `Mensaje:`,
    mensaje,
  ].join('\n');
  const html = [
    `<h2>Nueva solicitud de patrocinio</h2>`,
    `<ul>`,
    `<li><strong>Marca:</strong> ${esc(marca)}</li>`,
    `<li><strong>Contacto:</strong> ${esc(contacto)}</li>`,
    `<li><strong>Correo:</strong> ${esc(email)}</li>`,
    `<li><strong>Teléfono:</strong> ${esc(telefono)}</li>`,
    `</ul>`,
    `<p><strong>Mensaje:</strong></p>`,
    `<p>${esc(mensaje).replace(/\n/g, '<br>')}</p>`,
  ].join('\n');

  const binding = env.SEB as EmailBinding | undefined;
  if (binding && typeof binding.send === 'function') {
    try {
      await binding.send({ to: destino, from: remitente, replyTo: email, subject, text, html });
    } catch (err) {
      console.error('[contacto-patrocinio] Error enviando email:', err);
      return json(
        { ok: false, error: 'No pudimos enviar tu solicitud. Inténtalo de nuevo en unos minutos.' },
        502,
      );
    }
    return json({ ok: true });
  }

  // Sin binding (dev local con adaptador Node): no hay Email Service.
  if (import.meta.env.DEV) {
    console.log('[contacto-patrocinio:dev] Email no enviado (sin binding SEB). Datos:', {
      destino,
      marca,
      contacto,
      email,
      telefono,
      mensaje,
    });
    return json({ ok: true });
  }

  console.error('[contacto-patrocinio] Sin binding SEB en producción.');
  return json(
    { ok: false, error: 'Servicio no disponible. Escríbenos a rrhhpuntacanafc@gmail.com.' },
    503,
  );
};
