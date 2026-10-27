/**
 * Contenido editorial de /club.
 * Fuente: dossier del club (2017–2022) + datos confirmados por el cliente (2026).
 * Los datos aún no confirmados NO se publican aquí: ver docs/PLAN-PADRINO.md.
 */

export const CLUB_FOUNDING_DATE = '2017-01-20';

export const TRUST_STATS = [
  { value: '500+', label: 'Futbolistas' },
  { value: '4', label: 'Sedes' },
  { value: '10+', label: 'Entrenadores' },
  { value: '9', label: 'Años formando' },
] as const;

export interface TimelineItem {
  year: string;
  title: string;
  copy: string;
}

export const TIMELINE: TimelineItem[] = [
  {
    year: '2017',
    title: 'Nace el club',
    copy: 'Luis “El Tata” Flores y Ana Clara Flores fundan Punta Cana FC el 20 de enero, con una primera sede en RD Complex y cerca de 140 jugadores de 4 a 17 años.',
  },
  {
    year: '2018',
    title: 'Segunda sede',
    copy: 'Se suma la sede de BBS y el club crece a 180–200 jugadores.',
  },
  {
    year: '2019',
    title: 'Cuatro sedes',
    copy: 'La academia consolida cuatro sedes y supera los 300 jugadores.',
  },
  {
    year: '2021',
    title: 'Alto rendimiento',
    copy: 'Arranca el programa de Alto Rendimiento con 80 jugadores.',
  },
  {
    year: '2026',
    title: 'Sub-23 en LDF Expansión',
    copy: 'Nuestro equipo Sub-23 compite en LDF Expansión. Las familias siguen el día a día del club en la plataforma interna: asistencias, convocatorias y comunicación con el cuerpo técnico.',
  },
];

export interface AwardGroup {
  year: string;
  items: string[];
}

export const AWARDS: AwardGroup[] = [
  {
    year: '2017',
    items: ['Subcampeón LNJ Sub-15', 'Subcampeón LNJ Sub-17'],
  },
  {
    year: '2018',
    items: [
      'Campeón Copa Las Américas Sub-17',
      'Campeón Torneo Independencia Sub-9, Sub-11 y Sub-13',
      'Subcampeón Liga XS Sub-15 y Sub-17',
    ],
  },
  {
    year: '2019',
    items: [
      'Campeón Torneo Independencia Sub-11, Sub-13 y Sub-15',
      'Campeón Liga XS Sub-13 (apertura y clausura)',
      'Subcampeón Copa Las Américas Sub-17',
      'Tercer lugar Copa Las Américas Sub-15',
    ],
  },
];

export const CURRENT_COMPETITION =
  'Hoy nuestro equipo Sub-23 compite en LDF Expansión y seguimos presentes en ligas y torneos de la región.';

export interface ClubFaq {
  question: string;
  answer: string;
}

export const CLUB_FAQS: ClubFaq[] = [
  {
    question: '¿Desde qué edad pueden entrenar?',
    answer:
      'Desde los 4 hasta los 19 años, en cuatro categorías formativas: Pre-Formativas, Formativas Bajas, Formativas Altas y Elite / Reserva.',
  },
  {
    question: '¿Hay clase de prueba?',
    answer:
      'Sí, es gratis. Se agenda con el coordinador de la sede; puedes pedirla en el formulario de inscripción o por WhatsApp.',
  },
  {
    question: '¿Cuánto cuesta?',
    answer:
      'El plan depende de la sede y la categoría. El coordinador te comparte las opciones y las facilidades de pago. También contamos con apoyo del Plan Padrino para familias que lo necesiten.',
  },
  {
    question: '¿Qué incluye la inscripción?',
    answer:
      'Entrenamientos, participación en competencias, acceso a la plataforma para padres e informes deportivos semestrales. Los detalles de uniforme y materiales se confirman en la sede.',
  },
  {
    question: '¿Dónde entrenan?',
    answer: 'En Village PCIS, Village Club, BBS y RD Complex.',
  },
  {
    question: '¿Mi hijo necesita experiencia previa?',
    answer:
      'No. Hacemos una evaluación inicial para ubicarlo en la categoría adecuada y acompañarlo desde su nivel actual.',
  },
  {
    question: '¿Cómo sé si está progresando?',
    answer:
      'A través de la plataforma interna (asistencias y convocatorias) y de los informes semestrales del cuerpo técnico.',
  },
  {
    question: '¿Qué acompañamiento de salud tienen?',
    answer:
      'Evaluaciones médicas y físicas con nutrición, medicina general, kinesiología y preparadores físicos, además del seguimiento de las notas escolares.',
  },
  {
    question: '¿Cómo se confirman los horarios?',
    answer:
      'Los horarios se confirman por sede y categoría al inscribirse. El coordinador de la sede te indica el grupo y los días de entrenamiento.',
  },
];
