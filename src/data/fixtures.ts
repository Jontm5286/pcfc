/**
 * Fixtures — PCFC
 * Datos de próximos partidos y eventos.
 * Los team colors son colores institucionales de equipos rivales (datos, no tokens de diseño).
 */

export interface Team {
  name: string;
  color: string;
}

export interface Fixture {
  id: number | string;
  category: string;
  team1: Team;
  team2: Team;
  venue: string;
  date: string;
  time: string;
  label: string;
}

export const categoryColors: Record<string, string> = {
  'U-14': '#2563eb',
  'Prueba': '#10b981',
  'U-10': '#f59e0b',
  'Casa 1': '#64748b',
};

export const fixtures: Fixture[] = [
  {
    id: 1,
    category: 'U-14',
    team1: { name: 'PCFC', color: '#2563eb' },
    team2: { name: 'Selección Federativa', color: '#dc2626' },
    venue: 'Florer Puerto',
    date: 'Sáb 15 sep.',
    time: '13:03',
    label: 'FUTBOL',
  },
  {
    id: 2,
    category: 'Prueba',
    team1: { name: 'Casa España', color: '#2563eb' },
    team2: { name: 'Prueba', color: '#10b981' },
    venue: 'Casa España',
    date: 'Miér 4 sep.',
    time: '9:11',
    label: 'PRUEBA',
  },
  {
    id: 3,
    category: 'U-10',
    team1: { name: 'Acto Rendimiento', color: '#f59e0b' },
    team2: { name: 'Canay FC', color: '#0891b2' },
    venue: 'Caseral',
    date: 'Sáb 7 sep.',
    time: '16:00',
    label: 'ACTOS',
  },
  {
    id: 4,
    category: 'Casa 1',
    team1: { name: 'Punta Cana FC', color: '#2563eb' },
    team2: { name: 'San Cristóbal', color: '#64748b' },
    venue: 'Garrik',
    date: '8 sep.',
    time: '10:30',
    label: 'CASA',
  },
];
