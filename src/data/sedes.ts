/**
 * Sedes PCFC — espejo web de las sedes reales de plataforma
 * (futbolpro-academy `src/server/sedesCore.ts` DEFAULT_SEDES).
 *
 * REGLA DE ORO: los horarios NO viven aquí. Se confirman por sede al
 * inscribirse. No agregar campos de horario a este módulo.
 *
 * Slugs estables (`village-pcis`, `village-club`, `bbs`, `rd-complex`): viajan en
 * `?sede=` hacia /inscribete y al API de preinscripción.
 * Teléfono/email genéricos del club hasta tener dato real por sede.
 * Direcciones verificadas 2026-10-02: BBS desde bbs.edu.do/contacto;
 * RD Complex por geocodificación inversa OSM de su pin.
 */

export interface SedeContacto {
  slug: string;
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
  mapsUrl: string;
  /** placeholder hasta dato real */
  /** Coordenadas del pin en el mapa (aprox. hasta dirección exacta). */
  lat: number;
  lng: number;
}

export function getSedes(): SedeContacto[] {
  return [
    {
      slug: 'village-pcis',
      nombre: 'Village PCIS',
      direccion: 'Calle Amapola, Puntacana Village, Punta Cana 23000',
      telefono: '+1 829-988-9500',
      email: 'info@puntacanafc.com',
      mapsUrl: 'https://maps.app.goo.gl/fZd3azcL7YKKwUAZA',
      lat: 18.555786,
      lng: -68.367485,
    },
    {
      slug: 'village-club',
      nombre: 'Village Club',
      direccion: 'Calle Amapola, Punta Cana 23000',
      telefono: '+1 829-988-9500',
      email: 'info@puntacanafc.com',
      mapsUrl: 'https://maps.app.goo.gl/oqcfDs9JfZAWjF5k7',
      lat: 18.5560875,
      lng: -68.3657195,
    },
    {
      slug: 'bbs',
      nombre: 'BBS',
      direccion:
        'Bulevar Turístico del Este, Av. Estados Unidos, frente al hotel Iberostar, Bávaro 23000',
      telefono: '+1 829-246-4756',
      email: 'info@puntacanafc.com',
      mapsUrl: 'https://maps.app.goo.gl/V9VAes4jPuTe6Byh7',
      lat: 18.7008165,
      lng: -68.4635363,
    },
    {
      slug: 'rd-complex',
      nombre: 'RD Complex',
      direccion: 'Calle Pedro María Medina, Domingo Maíz, Bávaro 23000',
      telefono: '+1 829-246-4756',
      email: 'info@puntacanafc.com',
      mapsUrl: 'https://maps.app.goo.gl/pkWxw8Z9jJ3VityY7',
      lat: 18.604115,
      lng: -68.411064,
    },
  ];
}
