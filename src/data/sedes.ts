/**
 * Sedes PCFC — espejo web de las sedes reales de plataforma
 * (futbolpro-academy `src/server/sedesCore.ts` DEFAULT_SEDES).
 *
 * REGLA DE ORO: los horarios NO viven aquí. Se confirman por sede al
 * inscribirse. No agregar campos de horario a este módulo.
 *
 * Slugs estables (`village-pcis`, `village-club`, `bbs`): viajan en
 * `?sede=` hacia /inscribete y al API de preinscripción.
 * Teléfono/email genéricos del club hasta tener dato real por sede.
 * Direcciones de Village Club y BBS pendientes (placeholder).
 */

export interface SedeContacto {
  slug: string;
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
  mapsUrl: string;
  /** placeholder hasta dato real */
}

export function getSedes(): SedeContacto[] {
  return [
    {
      slug: 'village-pcis',
      nombre: 'Village PCIS',
      direccion: 'Boulevard Turístico del Este Km 14, Punta Cana / Bávaro',
      telefono: '+1 809-652-9450',
      email: 'info@puntacanafc.com',
      mapsUrl:
        'https://www.google.com/maps/search/?api=1&query=Boulevard+Tur%C3%ADstico+del+Este+Km+14+Punta+Cana',
    },
    {
      slug: 'village-club',
      nombre: 'Village Club',
      direccion: '/** PLACEHOLDER — dirección pendiente */',
      telefono: '+1 809-652-9450',
      email: 'info@puntacanafc.com',
      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Village+Club+Punta+Cana',
    },
    {
      slug: 'bbs',
      nombre: 'BBS',
      direccion: '/** PLACEHOLDER — dirección pendiente */',
      telefono: '+1 809-652-9450',
      email: 'info@puntacanafc.com',
      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=BBS+Punta+Cana',
    },
  ];
}
