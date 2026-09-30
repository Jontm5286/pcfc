import type { APIRoute } from 'astro';

/**
 * POST /api/inscripcion
 * Formulario de inscripción (/inscribete#formulario).
 * Envía la solicitud a rrhhpuntacanafc@gmail.com vía Cloudflare Email Service
 * (binding `SEB` de tipo send_email). En dev sin binding, registra en consola
 * y responde ok para poder probar el flujo del formulario.
 */

const DESTINO_DEFAULT = 'rrhhpuntacanafc@gmail.com';
const REMITENTE_DEFAULT = 'inscripciones@puntacanafc.com';

const MAX = {
  nombreJugador: 80,
  apellidoJugador: 80,
  fechaNacimiento: 10,
  categoria: 40,
  experiencia: 2000,
  nombreRep: 120,
  parentesco: 20,
  telefono: 40,
  email: 254,
  direccion: 200,
} as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;

const CATEGORIAS: Record<string, string> = {
  'pre-formativas': 'Pre-Formativas (4–8 años)',
  'formativas-bajas': 'Formativas Bajas (9–12 años)',
  'formativas-altas': 'Formativas Altas (13–15 años)',
  elite: 'Elite / Reserva (16–19 años)',
};

const PARENTESCOS = new Set(['padre', 'madre', 'tutor', 'otro']);

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

  const nombreJugador = str(body.nombreJugador, MAX.nombreJugador);
  const apellidoJugador = str(body.apellidoJugador, MAX.apellidoJugador);
  const fechaNacimiento = str(body.fechaNacimiento, MAX.fechaNacimiento);
  const categoria = str(body.categoria, MAX.categoria);
  const experiencia = str(body.experiencia, MAX.experiencia);
  const nombreRep = str(body.nombreRep, MAX.nombreRep);
  const parentesco = str(body.parentesco, MAX.parentesco).toLowerCase();
  const telefono = str(body.telefono, MAX.telefono);
  const email = str(body.email, MAX.email);
  const direccion = str(body.direccion, MAX.direccion);
  const terminos = body.terminos === true;

  if (
    !nombreJugador ||
    !apellidoJugador ||
    !fechaNacimiento ||
    !categoria ||
    !nombreRep ||
    !parentesco ||
    !telefono ||
    !email
  ) {
    return json({ ok: false, error: 'Completa todos los campos obligatorios.' }, 400);
  }
  if (!EMAIL_RE.test(email)) {
    return json({ ok: false, error: 'El correo electrónico no es válido.' }, 400);
  }
  if (!FECHA_RE.test(fechaNacimiento)) {
    return json({ ok: false, error: 'La fecha de nacimiento no es válida.' }, 400);
  }
  if (!CATEGORIAS[categoria]) {
    return json({ ok: false, error: 'Selecciona una categoría válida.' }, 400);
  }
  if (!PARENTESCOS.has(parentesco)) {
    return json({ ok: false, error: 'Selecciona un parentesco válido.' }, 400);
  }
  if (!terminos) {
    return json({ ok: false, error: 'Debes aceptar los términos y condiciones.' }, 400);
  }

  const { env } = getEnv(locals);
  const destino =
    (typeof env.ADMISSION_EMAIL === 'string' && env.ADMISSION_EMAIL.trim()) ||
    DESTINO_DEFAULT;
  const remitente =
    (typeof env.ADMISSION_FROM === 'string' && env.ADMISSION_FROM.trim()) || REMITENTE_DEFAULT;

  const categoriaLabel = CATEGORIAS[categoria];
  const subject = `Nueva inscripción — ${nombreJugador} ${apellidoJugador} (${categoriaLabel})`;
  const text = [
    `Nueva solicitud de inscripción desde puntacanafc.com/inscribete`,
    ``,
    `Jugador: ${nombreJugador} ${apellidoJugador}`,
    `Fecha de nacimiento: ${fechaNacimiento}`,
    `Categoría: ${categoriaLabel}`,
    experiencia ? `Experiencia previa: ${experiencia}` : `Experiencia previa: (no indicada)`,
    ``,
    `Representante: ${nombreRep} (${parentesco})`,
    `Teléfono: ${telefono}`,
    `Correo: ${email}`,
    direccion ? `Dirección: ${direccion}` : `Dirección: (no indicada)`,
  ].join('\n');
  const html = [
    `<h2>Nueva solicitud de inscripción</h2>`,
    `<h3>Datos del jugador</h3>`,
    `<ul>`,
    `<li><strong>Jugador:</strong> ${esc(nombreJugador)} ${esc(apellidoJugador)}</li>`,
    `<li><strong>Fecha de nacimiento:</strong> ${esc(fechaNacimiento)}</li>`,
    `<li><strong>Categoría:</strong> ${esc(categoriaLabel)}</li>`,
    experiencia
      ? `<li><strong>Experiencia previa:</strong> ${esc(experiencia).replace(/\n/g, '<br>')}</li>`
      : `<li><strong>Experiencia previa:</strong> (no indicada)</li>`,
    `</ul>`,
    `<h3>Datos del representante</h3>`,
    `<ul>`,
    `<li><strong>Representante:</strong> ${esc(nombreRep)} (${esc(parentesco)})</li>`,
    `<li><strong>Teléfono:</strong> ${esc(telefono)}</li>`,
    `<li><strong>Correo:</strong> ${esc(email)}</li>`,
    direccion
      ? `<li><strong>Dirección:</strong> ${esc(direccion)}</li>`
      : `<li><strong>Dirección:</strong> (no indicada)</li>`,
    `</ul>`,
  ].join('\n');

  const binding = env.SEB as EmailBinding | undefined;
  if (binding && typeof binding.send === 'function') {
    try {
      await binding.send({ to: destino, from: remitente, replyTo: email, subject, text, html });
    } catch (err) {
      console.error('[inscripcion] Error enviando email:', err);
      return json(
        { ok: false, error: 'No pudimos enviar tu inscripción. Inténtalo de nuevo en unos minutos.' },
        502,
      );
    }
    return json({ ok: true });
  }

  // Sin binding (dev local con adaptador Node): no hay Email Service.
  if (import.meta.env.DEV) {
    console.log('[inscripcion:dev] Email no enviado (sin binding SEB). Datos:', {
      destino,
      nombreJugador,
      apellidoJugador,
      fechaNacimiento,
      categoria,
      nombreRep,
      telefono,
      email,
    });
    return json({ ok: true });
  }

  console.error('[inscripcion] Sin binding SEB en producción.');
  return json(
    { ok: false, error: 'Servicio no disponible. Escríbenos a rrhhpuntacanafc@gmail.com.' },
    503,
  );
};
