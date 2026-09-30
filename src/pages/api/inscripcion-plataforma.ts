import type { APIRoute } from 'astro';
import { getSedes } from '../../data/sedes';

/**
 * POST /api/inscripcion-plataforma
 * Puente web → plataforma: reenvía la preinscripción a
 * `POST {PLATFORM_URL}/api/public/preinscriptions` con header `x-web-key`.
 *
 * - Éxito (201) → `{ ok: true }`.
 * - Plataforma caída / error / sin key → fallback email a
 *   rrhhpuntacanafc@gmail.com con todos los datos + sede → `{ ok: true, fallback: 'email' }`.
 * - Sede inválida o validación fallida → `400 { ok: false, error }`.
 *
 * NO borrar `src/pages/api/inscripcion.ts`: su lógica de email se reutiliza
 * aquí como respaldo (fail-safe, no se pierde el lead).
 */

const DESTINO_DEFAULT = 'rrhhpuntacanafc@gmail.com';
const REMITENTE_DEFAULT = 'inscripciones@puntacanafc.com';
const PLATFORM_URL_DEFAULT = 'http://127.0.0.1:3000';

const MAX = {
  firstName: 80,
  lastName: 80,
  birthDate: 10,
  category: 60,
  sede: 40,
  parentName: 120,
  parentRelationship: 20,
  parentPhone: 40,
  parentEmail: 254,
  address: 200,
  medicalNotes: 2000,
  school: 120,
  parentOccupation: 120,
} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;

// CategoryType exactos de plataforma
// (futbolpro-academy `src/types/index.ts`; si se agregan categorías allá,
// agregarlas aquí para que el select web las ofrezca).
const CATEGORIAS = new Set([
  'Sub-6 (Iniciación)',
  'Sub-8 (Pre-Benjamín)',
  'Sub-10 (Benjamín)',
  'Sub-12 (Alevín)',
  'Sub-14 (Infantil Mayor)',
  'Sub-15 (Infantil)',
  'Sub-18 (Juvenil)',
  'Femenino Juvenil',
]);

// GuardianInfo.relationship exactos de plataforma (`src/types/index.ts`).
const PARENTESCOS = new Set(['Padre', 'Madre', 'Tutor Legal', 'Abuelo/a', 'Otro']);

/**
 * Mapeo slug web → sedeId de plataforma (`sedesCore.ts` DEFAULT_SEDES).
 * AJUSTAR si el coordinador renombra o recrea sedes en SedeManager:
 * ante un id desconocido la plataforma responde 400 y caemos al
 * fallback email (fail-safe).
 */
const SEDE_ID_POR_SLUG: Record<string, string> = {
  'village-pcis': 'sede-village-pcis',
  'village-club': 'sede-village-club',
  bbs: 'sede-bbs',
};

interface EmailBinding {
  send: (msg: Record<string, unknown>) => Promise<unknown>;
}

function str(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export interface SecondGuardian {
  name: string;
  relationship: string;
  phone: string;
}

const MAX_2G = { name: 120, relationship: 20, phone: 40 } as const;

export function parseSecondGuardian(v: unknown): SecondGuardian | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  const name = str(o.name, MAX_2G.name);
  const relationship = str(o.relationship, MAX_2G.relationship);
  const phone = str(o.phone, MAX_2G.phone);
  if (!name && !relationship && !phone) return null;
  return { name, relationship, phone };
}

export function secondGuardianLine(g: SecondGuardian | null): string {
  if (!g) return 'Segundo tutor: (no indicado)';
  const parts = [g.name || '(sin nombre)', g.relationship ? `(${g.relationship})` : '', g.phone ? `— ${g.phone}` : '']
    .filter(Boolean)
    .join(' ');
  return `Segundo tutor: ${parts}`;
}

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function fechaValida(fecha: string): boolean {
  if (!FECHA_RE.test(fecha)) return false;
  const [y, m, d] = fecha.split('-').map(Number);
  if (y < 2000 || y > new Date().getFullYear()) return false;
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function readEnv(locals: unknown, key: string): string {
  const fromRuntime = (locals as { runtime?: { env?: Record<string, unknown> } } | undefined)?.runtime
    ?.env?.[key];
  if (typeof fromRuntime === 'string' && fromRuntime.trim()) return fromRuntime.trim();
  try {
    const fromMeta = (import.meta as unknown as { env?: Record<string, unknown> })?.env?.[key];
    if (typeof fromMeta === 'string' && fromMeta.trim()) return fromMeta.trim();
  } catch {
    /* import.meta.env no disponible */
  }
  const fromProcess =
    typeof process !== 'undefined' ? (process.env as Record<string, string | undefined>)[key] : undefined;
  return typeof fromProcess === 'string' ? fromProcess.trim() : '';
}

async function enviarFallbackEmail(opts: {
  env: Record<string, unknown>;
  firstName: string;
  lastName: string;
  birthDate: string;
  category: string;
  sedeSlug: string;
  sedeNombre: string;
  parentName: string;
  parentRelationship: string;
  parentPhone: string;
  parentEmail: string;
  address: string;
  medicalNotes: string;
  secondGuardian: SecondGuardian | null;
  school: string;
  parentOccupation: string;
  motivo: string;
}): Promise<boolean> {
  const {
    env,
    firstName,
    lastName,
    birthDate,
    category,
    sedeSlug,
    sedeNombre,
    parentName,
    parentRelationship,
    parentPhone,
    parentEmail,
    address,
    medicalNotes,
    secondGuardian,
    school,
    parentOccupation,
    motivo,
  } = opts;
  const destino =
    (typeof env.ADMISSION_EMAIL === 'string' && env.ADMISSION_EMAIL.trim()) || DESTINO_DEFAULT;
  const remitente =
    (typeof env.ADMISSION_FROM === 'string' && env.ADMISSION_FROM.trim()) || REMITENTE_DEFAULT;

  const subject = `[WEB fallback] Preinscripción — ${firstName} ${lastName} (${category}, sede ${sedeNombre})`;
  const text = [
    `Preinscripción web NO registrada en plataforma (${motivo}).`,
    `Sede: ${sedeNombre} (${sedeSlug})`,
    ``,
    `Jugador: ${firstName} ${lastName}`,
    `Fecha de nacimiento: ${birthDate}`,
    `Categoría: ${category}`,
    school ? `Colegio: ${school}` : `Colegio: (no indicado)`,
    ``,
    `Tutor: ${parentName} (${parentRelationship})`,
    parentOccupation ? `Ocupación del tutor: ${parentOccupation}` : `Ocupación del tutor: (no indicada)`,
    `Teléfono: ${parentPhone}`,
    `Correo: ${parentEmail}`,
    secondGuardianLine(secondGuardian),
    address ? `Dirección: ${address}` : `Dirección: (no indicada)`,
    medicalNotes ? `Notas médicas: ${medicalNotes}` : `Notas médicas: (no indicadas)`,
  ].join('\n');
  const html = [
    `<h2>Preinscripción web — fallback email</h2>`,
    `<p>La preinscripción NO quedó registrada en plataforma (${esc(motivo)}). Registrar manualmente.</p>`,
    `<ul>`,
    `<li><strong>Sede:</strong> ${esc(sedeNombre)} (${esc(sedeSlug)})</li>`,
    `<li><strong>Jugador:</strong> ${esc(firstName)} ${esc(lastName)}</li>`,
    `<li><strong>Fecha de nacimiento:</strong> ${esc(birthDate)}</li>`,
    `<li><strong>Categoría:</strong> ${esc(category)}</li>`,
    school
      ? `<li><strong>Colegio:</strong> ${esc(school)}</li>`
      : `<li><strong>Colegio:</strong> (no indicado)</li>`,
    `<li><strong>Tutor:</strong> ${esc(parentName)} (${esc(parentRelationship)})</li>`,
    parentOccupation
      ? `<li><strong>Ocupación del tutor:</strong> ${esc(parentOccupation)}</li>`
      : `<li><strong>Ocupación del tutor:</strong> (no indicada)</li>`,
    `<li><strong>Teléfono:</strong> ${esc(parentPhone)}</li>`,
    `<li><strong>Correo:</strong> ${esc(parentEmail)}</li>`,
    `<li><strong>Segundo tutor:</strong> ${secondGuardian ? esc(`${secondGuardian.name || '(sin nombre)'}${secondGuardian.relationship ? ` (${secondGuardian.relationship})` : ''}${secondGuardian.phone ? ` — ${secondGuardian.phone}` : ''}`) : '(no indicado)'}</li>`,
    address
      ? `<li><strong>Dirección:</strong> ${esc(address)}</li>`
      : `<li><strong>Dirección:</strong> (no indicada)</li>`,
    medicalNotes
      ? `<li><strong>Notas médicas:</strong> ${esc(medicalNotes).replace(/\n/g, '<br>')}</li>`
      : `<li><strong>Notas médicas:</strong> (no indicadas)</li>`,
    `</ul>`,
  ].join('\n');

  const binding = env.SEB as EmailBinding | undefined;
  if (binding && typeof binding.send === 'function') {
    try {
      await binding.send({ to: destino, from: remitente, replyTo: parentEmail, subject, text, html });
      return true;
    } catch (err) {
      console.error('[inscripcion-plataforma] Error en fallback email:', err);
      return false;
    }
  }
  if (import.meta.env.DEV) {
    console.log('[inscripcion-plataforma:dev] Fallback email no enviado (sin binding SEB). Datos:', {
      destino,
      motivo,
      firstName,
      lastName,
      sedeSlug,
    });
    return true;
  }
  console.error('[inscripcion-plataforma] Sin binding SEB en producción.');
  return false;
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

  const firstName = str(body.firstName, MAX.firstName);
  const lastName = str(body.lastName, MAX.lastName);
  const birthDate = str(body.birthDate, MAX.birthDate);
  const category = str(body.category, MAX.category);
  const sede = str(body.sede, MAX.sede).toLowerCase();
  const parentName = str(body.parentName, MAX.parentName);
  const parentRelationship = str(body.parentRelationship, MAX.parentRelationship);
  const parentPhone = str(body.parentPhone, MAX.parentPhone);
  const parentEmail = str(body.parentEmail, MAX.parentEmail);
  const address = str(body.address, MAX.address);
  const medicalNotes = str(body.medicalNotes, MAX.medicalNotes);
  const school = str(body.school, MAX.school);
  const parentOccupation = str(body.parentOccupation, MAX.parentOccupation);
  const terminos = body.terminos === true;
  const secondGuardian = parseSecondGuardian(body.secondGuardian);
  if (secondGuardian?.relationship && !PARENTESCOS.has(secondGuardian.relationship)) {
    return json({ ok: false, error: 'Selecciona un parentesco válido para el segundo tutor.' }, 400);
  }

  if (
    !firstName ||
    !lastName ||
    !birthDate ||
    !category ||
    !sede ||
    !parentName ||
    !parentRelationship ||
    !parentPhone ||
    !parentEmail
  ) {
    return json({ ok: false, error: 'Completa todos los campos obligatorios.' }, 400);
  }
  if (!EMAIL_RE.test(parentEmail)) {
    return json({ ok: false, error: 'El correo electrónico no es válido.' }, 400);
  }
  if (!fechaValida(birthDate)) {
    return json({ ok: false, error: 'La fecha de nacimiento no es válida.' }, 400);
  }
  if (!CATEGORIAS.has(category)) {
    return json({ ok: false, error: 'Selecciona una categoría válida.' }, 400);
  }
  const sedes = getSedes();
  const sedeInfo = sedes.find((s) => s.slug === sede);
  if (!sedeInfo) {
    return json({ ok: false, error: 'Selecciona una sede válida.' }, 400);
  }
  if (!PARENTESCOS.has(parentRelationship)) {
    return json({ ok: false, error: 'Selecciona un parentesco válido.' }, 400);
  }
  if (!terminos) {
    return json({ ok: false, error: 'Debes aceptar los términos y condiciones.' }, 400);
  }

  // sedeId de plataforma (null si el mapeo quedó desactualizado → 400 fail-safe).
  const sedeId = SEDE_ID_POR_SLUG[sede];
  if (!sedeId) {
    return json({ ok: false, error: 'Sede desconocida en plataforma. Escríbenos y te inscribimos.' }, 400);
  }

  const runtimeEnv =
    (locals as { runtime?: { env?: Record<string, unknown> } } | undefined)?.runtime?.env ?? {};
  const platformUrl = readEnv(locals, 'PLATFORM_URL') || PLATFORM_URL_DEFAULT;
  const platformKey = readEnv(locals, 'PLATFORM_API_KEY');

  if (!platformKey) {
    console.error('[inscripcion-plataforma] Sin PLATFORM_API_KEY: fallback email directo.');
    const ok = await enviarFallbackEmail({
      env: runtimeEnv,
      firstName,
      lastName,
      birthDate,
      category,
      sedeSlug: sede,
      sedeNombre: sedeInfo.nombre,
      parentName,
      parentRelationship,
      parentPhone,
      parentEmail,
      address,
      medicalNotes,
      secondGuardian,
      school,
      parentOccupation,
      motivo: 'sin PLATFORM_API_KEY configurada',
    });
    if (ok) return json({ ok: true, fallback: 'email' });
    return json(
      { ok: false, error: 'Servicio no disponible. Escríbenos a rrhhpuntacanafc@gmail.com.' },
      503,
    );
  }

  let platformRes: Response;
  try {
    platformRes = await fetch(`${platformUrl.replace(/\/$/, '')}/api/public/preinscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-web-key': platformKey },
      body: JSON.stringify({
        firstName,
        lastName,
        birthDate,
        category,
        sedeId,
        sedeSlug: sede,
        parentName,
        parentRelationship,
        parentPhone,
        parentEmail,
        address: address || undefined,
        medicalNotes: medicalNotes || undefined,
        school: school || undefined,
        parentOccupation: parentOccupation || undefined,
        secondGuardian: secondGuardian || undefined,
        source: 'web',
        sedeNombre: sedeInfo.nombre,
      }),
      signal: AbortSignal.timeout(8000),
    });
  } catch (err) {
    console.error('[inscripcion-plataforma] Plataforma inalcanzable, fallback email:', err);
    const ok = await enviarFallbackEmail({
      env: runtimeEnv,
      firstName,
      lastName,
      birthDate,
      category,
      sedeSlug: sede,
      sedeNombre: sedeInfo.nombre,
      parentName,
      parentRelationship,
      parentPhone,
      parentEmail,
      address,
      medicalNotes,
      secondGuardian,
      school,
      parentOccupation,
      motivo: 'plataforma inalcanzable',
    });
    if (ok) return json({ ok: true, fallback: 'email' });
    return json(
      { ok: false, error: 'No pudimos enviar tu inscripción. Inténtalo de nuevo en unos minutos.' },
      502,
    );
  }

  if (platformRes.status === 201) {
    return json({ ok: true });
  }

  let detail = '';
  try {
    const out = (await platformRes.json()) as { error?: string };
    if (typeof out?.error === 'string') detail = out.error;
  } catch {
    /* respuesta no JSON */
  }
  console.error(
    `[inscripcion-plataforma] Plataforma respondió ${platformRes.status} (${detail || 'sin detalle'}), fallback email.`,
  );
  const ok = await enviarFallbackEmail({
    env: runtimeEnv,
    firstName,
    lastName,
    birthDate,
    category,
    sedeSlug: sede,
    sedeNombre: sedeInfo.nombre,
    parentName,
    parentRelationship,
    parentPhone,
    parentEmail,
    address,
    medicalNotes,
    secondGuardian,
    school,
    parentOccupation,
    motivo: `plataforma respondió ${platformRes.status}${detail ? `: ${detail}` : ''}`,
  });
  if (ok) return json({ ok: true, fallback: 'email' });
  // Validación de plataforma (400 con mensaje ES) se propaga; resto → 502 genérico.
  if (platformRes.status === 400 && detail) {
    return json({ ok: false, error: detail }, 400);
  }
  return json(
    { ok: false, error: 'No pudimos enviar tu inscripción. Inténtalo de nuevo en unos minutos.' },
    502,
  );
};
