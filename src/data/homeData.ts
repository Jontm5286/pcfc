/**
 * Home page data definitions and static data structures.
 * Implements single responsibility by isolating page content from view rendering.
 */

export interface NextMatch {
  date: string;
  time: string;
  category: string;
  categorySlug: string;
  home: string;
  homeLogo: string;
  away: string;
  awayLogo: string;
  venue: string;
}

export interface Category {
  slug: string;
  badge: string;
  ages: string;
  name: string;
  copy: string;
  focus: string;
  format: string;
  schedule: string;
  description: string;
  ctaHref: string;
}

export interface Pillar {
  n: string;
  title: string;
  copy: string;
}

export interface Stat {
  value: string;
  label: string;
}

export interface GalleryImage {
  src: string;
  alt: string;
}

export interface ValuePillarItem {
  icon: string;
  iconViewBox?: string;
  title: string;
  copy: string;
}

export interface PathwayCardItem {
  eyebrow: string;
  heading: string;
  subtitle: string;
  copy: string;
  cta: {
    label: string;
    href: string;
  };
  image: string;
  imageAlt: string;
}

export interface SponsorItem {
  name: string;
  logo: string;
  href: string;
}

/**
 * Gets the next match data for the hero section.
 * @returns NextMatch information object
 */
export function getNextMatchData(): NextMatch {
  return {
    date: "SÁB 13 SEP",
    time: "10:00 AM",
    category: "Sub-13",
    categorySlug: "form-baja",
    home: "PCFC",
    homeLogo: "/Logo-PCFC.svg",
    away: "Atlético Bávaro",
    awayLogo: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=200&q=80",
    venue: "Cancha Principal · PCFC",
  };
}

/**
 * Gets the list of youth training categories.
 * @returns Array of Category items
 */
export function getCategoriesData(): Category[] {
  return [
    {
      slug: "pre",
      badge: "badge--pre",
      ages: "4 a 8 años",
      name: "Pre-Formativas",
      copy: "Primer contacto con el balón. Coordinación, motricidad y amor por el juego.",
      focus: "Movilidad, coordinación, primer contacto con el balón",
      format: "Partidos formativos 90 min",
      schedule: "Martes y jueves · 4:00–5:30 pm",
      description:
        "El primer paso dentro del club. Jugamos a aprender: exploración del balón, coordinación motriz y reglas básicas en un entorno lúdico, seguro y siempre acompañado por nuestros entrenadores.",
      ctaHref: "/inscribete",
    },
    {
      slug: "form-baja",
      badge: "badge--form-baja",
      ages: "9 a 12 años",
      name: "Formativas Bajas",
      copy: "Técnica individual, fundamentos tácticos y primeras competencias oficiales.",
      focus: "Técnica individual, reglas del juego, compañerismo",
      format: "Partidos 7 vs 7",
      schedule: "Lunes, miércoles y viernes · 4:00–6:00 pm",
      description:
        "Consolidamos la técnica individual — control, pase, conducción — e introducimos la táctica colectiva en formato 7v7. Los jugadores entienden el juego, sus posiciones y el valor del equipo.",
      ctaHref: "/inscribete",
    },
    {
      slug: "form-alta",
      badge: "badge--form-alta",
      ages: "13 a 15 años",
      name: "Formativas Altas",
      copy: "Táctica avanzada, físico específico y preparación para competencia regional.",
      focus: "Táctica, preparación física, competición federada",
      format: "Partidos 9 vs 9",
      schedule: "Martes y jueves · 5:00–7:00 pm + bloque de acondicionamiento",
      description:
        "Etapa de competición real. Profundizamos en sistemas tácticos, añadimos trabajo físico estructurado y participamos en torneos federados para medirnos contra otros clubes de la región.",
      ctaHref: "/inscribete",
    },
    {
      slug: "elite",
      badge: "badge--elite",
      ages: "16 a 19 años",
      name: "Elite y Reserva",
      copy: "Alto rendimiento, scouting profesional y proyección hacia ligas nacionales.",
      focus: "Alto rendimiento, scouting, preparación física avanzada",
      format: "Partidos 11 vs 11",
      schedule: "Lunes, miércoles y viernes · 6:00–8:00 pm + gimnasio",
      description:
        "El último tramo del proceso formativo. Entrenamientos de alta intensidad, gimnasio, análisis de vídeo y seguimiento individual. Varios de nuestros jugadores de esta categoría han sido captados por clubes profesionales.",
      ctaHref: "/inscribete",
    },
  ];
}

/**
 * Gets key club stats for display.
 * @returns Array of Stat items
 */
export function getStatsData(): Stat[] {
  return [
    { value: "700+", label: "Futbolistas" },
    { value: "20+", label: "Entrenadores" },
    { value: "15", label: "Categorías" },
    { value: "10+", label: "Años" },
  ];
}

/**
 * Gets club differentiators and core pillars.
 * @returns Array of Pillar items
 */
export function getPillarsData(): Pillar[] {
  return [
    {
      n: "01",
      title: "Metodología europea",
      copy: "Plan formativo estructurado por etapa biológica, no por edad cronológica. Evaluaciones trimestrales con métricas objetivas.",
    },
    {
      n: "02",
      title: "Cuerpo técnico certificado",
      copy: "Entrenadores con licencias UEFA y experiencia en academias de primer nivel. Ratio máximo 1:12 jugador-entrenador. 7 de nuestros exalumnos han firmado con ligas profesionales en los últimos 2 años.",
    },
    {
      n: "03",
      title: "Formación integral",
      copy: "Trabajo coordinado con el área académica y familiar. Valores, disciplina y liderazgo son tan importantes como el toque de balón.",
    },
  ];
}

/**
 * Gets hero and community gallery image data.
 * @returns Array of GalleryImage items
 */
export function getGalleryImagesData(): GalleryImage[] {
  return [
    {
      src: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&q=80",
      alt: "Entrenamiento Sub-15",
    },
    {
      src: "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=600&q=80",
      alt: "Partido Pre-Formativas",
    },
    {
      src: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&q=80",
      alt: "Cancha principal PCFC",
    },
    {
      src: "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=600&q=80",
      alt: "Celebración de gol Sub-17",
    },
    {
      src: "https://images.unsplash.com/photo-1518604666860-9ed391f76460?w=600&q=80",
      alt: "Equipo Formativas Altas",
    },
    {
      src: "https://images.unsplash.com/photo-1431324173062-725bfd060215?w=600&q=80",
      alt: "Jugadores en cancha",
    },
  ];
}

/**
 * Gets value pillars for joining the academy.
 * @returns Array of ValuePillarItem items
 */
export function getValuePillarsData(): ValuePillarItem[] {
  return [
    {
      icon: "M6.75 7.5C8.15625 7.46875 9.234375 6.84375 9.984375 5.625C10.671875 4.375 10.671875 3.125 9.984375 1.875C9.234375 0.65625 8.15625 0.03125 6.75 0C5.34375 0.03125 4.265625 0.65625 3.515625 1.875C2.828125 3.125 2.828125 4.375 3.515625 5.625C4.265625 6.84375 5.34375 7.46875 6.75 7.5L6.75 7.5L6.75 7.5M24 7.5C25.40625 7.46875 26.484375 6.84375 27.234375 5.625C27.921875 4.375 27.921875 3.125 27.234375 1.875C26.484375 0.65625 25.40625 0.03125 24 0C22.59375 0.03125 21.515625 0.65625 20.765625 1.875C20.078125 3.125 20.078125 4.375 20.765625 5.625C21.515625 6.84375 22.59375 7.46875 24 7.5L24 7.5L24 7.5M0 14.015625C0.0625 14.609375 0.390625 14.9375 0.984375 15L11.015625 15L11.015625 15L11.015625 15C9.734375 13.84375 9.0625 12.34375 9 10.5C9 10.15625 9.03125 9.8125 9.09375 9.46875C8.4375 9.15625 7.734375 9 6.984375 9L5.015625 9C3.578125 9.03125 2.390625 9.515625 1.453125 10.453125C0.515625 11.390625 0.03125 12.578125 0 14.015625L0 14.015625L0 14.015625M15 15C16.15625 14.96875 17.140625 14.609375 17.953125 13.921875C18.046875 13.734375 18.171875 13.5625 18.328125 13.40625C18.453125 13.25 18.59375 13.125 18.75 13.03125C19.25 12.28125 19.5 11.4375 19.5 10.5C19.46875 9.21875 19.03125 8.15625 18.1875 7.3125C17.34375 6.46875 16.28125 6.03125 15 6C13.71875 6.03125 12.65625 6.46875 11.8125 7.3125C10.96875 8.15625 10.53125 9.21875 10.5 10.5C10.53125 11.78125 10.96875 12.84375 11.8125 13.6875C12.65625 14.53125 13.71875 14.96875 15 15L15 15L15 15M18.046875 17.8125C17.546875 17.53125 17.234375 17.09375 17.109375 16.5L12.234375 16.5C10.484375 16.53125 9.015625 17.140625 7.828125 18.328125C6.640625 19.515625 6.03125 20.984375 6 22.734375C6.0625 23.515625 6.484375 23.9375 7.265625 24L21.328125 24C21.234375 23.75 21.1875 23.5 21.1875 23.25L21.1875 23.109375C21.125 23.078125 21.0625 23.03125 21 22.96875L20.859375 23.0625C20.453125 23.28125 20.015625 23.359375 19.546875 23.296875C19.078125 23.234375 18.671875 23 18.328125 22.59375C18.109375 22.34375 17.90625 22.078125 17.71875 21.796875L17.71875 21.75L17.71875 21.75L17.625 21.5625L17.625 21.5625L17.578125 21.5625C17.421875 21.25 17.28125 20.9375 17.15625 20.625C17 20.125 17.015625 19.65625 17.203125 19.21875C17.390625 18.78125 17.671875 18.4375 18.046875 18.1875L18.1875 18.09375C18.1875 18.0625 18.1875 18.03125 18.1875 18C18.1875 17.96875 18.1875 17.9375 18.1875 17.90625L18.046875 17.8125L18.046875 17.8125L18.046875 17.8125M24.984375 9L23.015625 9C22.265625 9 21.5625 9.15625 20.90625 9.46875C20.96875 9.8125 21 10.15625 21 10.5C21 11.3125 20.84375 12.078125 20.53125 12.796875C20.65625 12.828125 20.765625 12.875 20.859375 12.9375L21 13.03125C21.0625 13 21.125 12.96875 21.1875 12.9375L21.1875 12.796875C21.1875 12.296875 21.328125 11.859375 21.609375 11.484375C21.921875 11.109375 22.34375 10.875 22.875 10.78125C23.25 10.71875 23.625 10.6875 24 10.6875C24.375 10.6875 24.75 10.71875 25.125 10.78125C25.65625 10.875 26.078125 11.109375 26.390625 11.484375C26.671875 11.859375 26.8125 12.296875 26.8125 12.796875L26.8125 12.9375C26.875 12.96875 26.9375 13 27 13.03125L27.140625 12.9375C27.546875 12.71875 27.984375 12.640625 28.453125 12.703125C28.921875 12.765625 29.328125 13 29.671875 13.40625C29.796875 13.53125 29.90625 13.671875 30 13.828125C29.90625 12.453125 29.390625 11.3125 28.453125 10.40625C27.546875 9.5 26.390625 9.03125 24.984375 9L24.984375 9L24.984375 9M29.296875 16.6875C29.609375 16.46875 29.703125 16.1875 29.578125 15.84375C29.484375 15.59375 29.375 15.34375 29.25 15.09375L29.15625 14.90625C29 14.65625 28.828125 14.4375 28.640625 14.25C28.390625 13.96875 28.09375 13.921875 27.75 14.109375L26.90625 14.578125C26.5 14.203125 26.03125 13.921875 25.5 13.734375L25.5 12.75C25.46875 12.375 25.28125 12.15625 24.9375 12.09375C24.625 12.03125 24.3125 12 24 12C23.6875 12 23.375 12.03125 23.0625 12.09375C22.71875 12.15625 22.53125 12.375 22.5 12.75L22.5 13.734375C21.96875 13.921875 21.5 14.203125 21.09375 14.578125L20.203125 14.109375C19.890625 13.921875 19.59375 13.96875 19.3125 14.25C19.15625 14.4375 19 14.65625 18.84375 14.90625L18.75 15.09375C18.625 15.34375 18.515625 15.59375 18.421875 15.84375C18.296875 16.1875 18.390625 16.46875 18.703125 16.6875L19.59375 17.15625C19.53125 17.4375 19.5 17.71875 19.5 18C19.5 18.28125 19.53125 18.546875 19.59375 18.796875L18.703125 19.3125C18.390625 19.5 18.296875 19.78125 18.421875 20.15625C18.515625 20.40625 18.625 20.65625 18.75 20.90625L18.84375 21.09375C19 21.3125 19.15625 21.53125 19.3125 21.75C19.59375 22.03125 19.890625 22.078125 20.203125 21.890625L21.09375 21.421875C21.5 21.796875 21.96875 22.078125 22.5 22.265625L22.5 23.25C22.53125 23.625 22.71875 23.859375 23.0625 23.953125C23.375 23.984375 23.6875 24 24 24C24.3125 24 24.625 23.984375 24.9375 23.953125C25.28125 23.859375 25.46875 23.625 25.5 23.25L25.5 22.265625C26.03125 22.078125 26.5 21.796875 26.90625 21.421875L27.796875 21.9375C28.109375 22.09375 28.40625 22.046875 28.6875 21.796875C28.84375 21.578125 29 21.34375 29.15625 21.09375L29.25 20.90625C29.375 20.65625 29.5 20.40625 29.625 20.15625C29.71875 19.8125 29.609375 19.53125 29.296875 19.3125L28.453125 18.84375C28.484375 18.5625 28.5 18.28125 28.5 18C28.5 17.71875 28.484375 17.453125 28.453125 17.203125L29.296875 16.6875L29.296875 16.6875L29.296875 16.6875M22.125 18C22.15625 17.28125 22.46875 16.734375 23.0625 16.359375C23.6875 16.046875 24.3125 16.046875 24.9375 16.359375C25.53125 16.734375 25.84375 17.28125 25.875 18C25.84375 18.71875 25.53125 19.265625 24.9375 19.640625C24.3125 19.953125 23.6875 19.953125 23.0625 19.640625C22.46875 19.265625 22.15625 18.71875 22.125 18L22.125 18L22.125 18",
      iconViewBox: "0 0 30 24",
      title: "Cuerpo técnico experto",
      copy: "Entrenadores certificados por la UEFA, con experiencia en academias internacionales. Acompañamiento integral en cancha y aula.",
    },
    {
      icon: "M2.25 0C1.625 0.03125 1.09375 0.25 0.65625 0.65625L0.65625 0.65625C0.25 1.09375 0.03125 1.625 0 2.25L0 21.75C0.03125 22.375 0.25 22.90625 0.65625 23.34375C1.09375 23.75 1.625 23.96875 2.25 24L6.75 24L6.75 20.25C6.78125 19.625 7 19.09375 7.40625 18.65625C7.84375 18.25 8.375 18.03125 9 18C9.625 18.03125 10.15625 18.25 10.59375 18.65625C11 19.09375 11.21875 19.625 11.25 20.25L11.25 24L15.75 24C16.375 23.96875 16.90625 23.75 17.34375 23.34375C17.75 22.90625 17.96875 22.375 18 21.75L18 2.25C17.96875 1.625 17.75 1.09375 17.34375 0.65625C16.90625 0.25 16.375 0.03125 15.75 0L2.25 0L2.25 0L2.25 0M3 11.25C3.03125 10.78125 3.28125 10.53125 3.75 10.5L5.25 10.5C5.71875 10.53125 5.96875 10.78125 6 11.25L6 12.75C5.96875 13.21875 5.71875 13.46875 5.25 13.5L3.75 13.5C3.28125 13.46875 3.03125 13.21875 3 12.75L3 11.25L3 11.25L3 11.25M8.25 10.5L9.75 10.5C10.21875 10.53125 10.46875 10.78125 10.5 11.25L10.5 12.75C10.46875 13.21875 10.21875 13.46875 9.75 13.5L8.25 13.5C7.78125 13.46875 7.53125 13.21875 7.5 12.75L7.5 11.25C7.53125 10.78125 7.78125 10.53125 8.25 10.5L8.25 10.5L8.25 10.5M12 11.25C12.03125 10.78125 12.28125 10.53125 12.75 10.5L14.25 10.5C14.71875 10.53125 14.96875 10.78125 15 11.25L15 12.75C14.96875 13.21875 14.71875 13.46875 14.25 13.5L12.75 13.5C12.28125 13.46875 12.03125 13.21875 12 12.75L12 11.25L12 11.25L12 11.25M3.75 4.5L5.25 4.5C5.71875 4.53125 5.96875 4.78125 6 5.25L6 6.75C5.96875 7.21875 5.71875 7.46875 5.25 7.5L3.75 7.5C3.28125 7.46875 3.03125 7.21875 3 6.75L3 5.25C3.03125 4.78125 3.28125 4.53125 3.75 4.5L3.75 4.5L3.75 4.5M7.5 5.25C7.53125 4.78125 7.78125 4.53125 8.25 4.5L9.75 4.5C10.21875 4.53125 10.46875 4.78125 10.5 5.25L10.5 6.75C10.46875 7.21875 10.21875 7.46875 9.75 7.5L8.25 7.5C7.78125 7.46875 7.53125 7.21875 7.5 6.75L7.5 5.25L7.5 5.25L7.5 5.25M12.75 4.5L14.25 4.5C14.71875 4.53125 14.96875 4.78125 15 5.25L15 6.75C14.96875 7.21875 14.71875 7.46875 14.25 7.5L12.75 7.5C12.28125 7.46875 12.03125 7.21875 12 6.75L12 5.25C12.03125 4.78125 12.28125 4.53125 12.75 4.5L12.75 4.5L12.75 4.5",
      iconViewBox: "0 0 18 24",
      title: "Instalaciones de primer nivel",
      copy: "Cuatro canchas con césped premium, gimnasio, aula académica y zonas de recuperación diseñadas para el alto rendimiento.",
    },
    {
      icon: "M15 0C15.71875 0.03125 16.265625 0.34375 16.640625 0.9375C16.953125 1.5625 16.953125 2.1875 16.640625 2.8125C16.265625 3.40625 15.71875 3.71875 15 3.75C14.28125 3.71875 13.734375 3.40625 13.359375 2.8125C13.046875 2.1875 13.046875 1.5625 13.359375 0.9375C13.734375 0.34375 14.28125 0.03125 15 0L15 0L15 0M17.109375 7.6875L17.625 11.859375C17.625 12.546875 17.296875 12.96875 16.640625 13.125C15.953125 13.125 15.53125 12.796875 15.375 12.140625L15.1875 10.5L14.8125 10.5L14.625 12.140625C14.46875 12.828125 14.046875 13.15625 13.359375 13.125C12.671875 12.96875 12.34375 12.546875 12.375 11.859375L12.890625 7.6875L12 8.484375C11.40625 8.890625 10.875 8.84375 10.40625 8.34375C10 7.78125 10.046875 7.25 10.546875 6.75L11.8125 5.671875C12.75 4.890625 13.8125 4.5 15 4.5C16.1875 4.5 17.25 4.890625 18.1875 5.671875L19.5 6.75C19.96875 7.25 20 7.78125 19.59375 8.34375C19.125 8.84375 18.609375 8.890625 18.046875 8.484375L17.109375 7.6875L17.109375 7.6875L17.109375 7.6875M1.875 3C2.40625 3 2.84375 3.1875 3.1875 3.5625L3.1875 3.5625C3.5625 3.90625 3.75 4.34375 3.75 4.875L3.75 6.75L3.75 10.5L3.75 12.375C3.75 13.21875 4.046875 13.9375 4.640625 14.53125L7.03125 16.921875C7.46875 17.296875 7.953125 17.34375 8.484375 17.0625C8.796875 16.84375 8.96875 16.5625 9 16.21875C9.03125 15.875 8.90625 15.5625 8.625 15.28125L7.921875 14.578125L6.421875 13.078125C6.140625 12.765625 6 12.40625 6 12C6 11.59375 6.140625 11.234375 6.421875 10.921875C6.734375 10.640625 7.09375 10.5 7.5 10.5C7.90625 10.5 8.265625 10.640625 8.578125 10.921875L10.078125 12.421875L10.78125 13.171875L10.78125 13.171875L11.953125 14.34375C12.953125 15.375 13.46875 16.609375 13.5 18.046875L13.5 21.75C13.46875 22.375 13.25 22.90625 12.84375 23.34375C12.40625 23.75 11.875 23.96875 11.25 24L8.109375 24C7.296875 24 6.59375 23.703125 6 23.109375L1.3125 18.421875C0.46875 17.546875 0.03125 16.5 0 15.28125L0 10.5L0 7.5L0 4.875C0 4.34375 0.1875 3.90625 0.5625 3.5625C0.90625 3.1875 1.34375 3 1.875 3L1.875 3L1.875 3M28.125 3C28.65625 3 29.09375 3.1875 29.4375 3.5625L29.4375 3.5625C29.8125 3.90625 30 4.34375 30 4.875L30 7.5L30 10.5L30 15.28125C29.96875 16.5 29.53125 17.546875 28.6875 18.421875L24 23.109375C23.40625 23.703125 22.703125 24 21.890625 24L18.75 24C18.125 23.96875 17.59375 23.75 17.15625 23.34375C16.75 22.90625 16.53125 22.375 16.5 21.75L16.5 18.046875C16.53125 16.609375 17.046875 15.375 18.046875 14.34375L19.21875 13.171875L19.21875 13.171875L19.921875 12.421875L21.421875 10.921875C21.734375 10.640625 22.09375 10.5 22.5 10.5C22.90625 10.5 23.265625 10.640625 23.578125 10.921875C23.859375 11.234375 24 11.59375 24 12C24 12.40625 23.859375 12.765625 23.578125 13.078125L22.078125 14.578125L21.328125 15.28125C21.078125 15.5625 20.96875 15.875 21 16.21875C21.03125 16.5625 21.203125 16.84375 21.515625 17.0625C22.046875 17.34375 22.53125 17.296875 22.96875 16.921875L25.359375 14.53125C25.953125 13.9375 26.25 13.21875 26.25 12.375L26.25 10.5L26.25 6.75L26.25 4.875C26.25 4.34375 26.4375 3.90625 26.8125 3.5625C27.15625 3.1875 27.59375 3 28.125 3L28.125 3L28.125 3M22.125 18C22.15625 17.28125 22.46875 16.734375 23.0625 16.359375C23.6875 16.046875 24.3125 16.046875 24.9375 16.359375C25.53125 16.734375 25.84375 17.28125 25.875 18C25.84375 18.71875 25.53125 19.265625 24.9375 19.640625C24.3125 19.953125 23.6875 19.953125 23.0625 19.640625C22.46875 19.265625 22.15625 18.71875 22.125 18L22.125 18L22.125 18",
      iconViewBox: "0 0 30 24",
      title: "Formación integral",
      copy: "Programa basado en valores: trabajo en equipo, respeto, liderazgo y equilibrio académico. Más allá del fútbol.",
    },
  ];
}

/**
 * Gets pathway card configurations.
 * @returns Array of PathwayCardItem items
 */
export function getPathwayCardsData(): PathwayCardItem[] {
  return [
    {
      eyebrow: "PROGRAMA FAMILIAR",
      heading: "PARA PADRES:",
      subtitle: "Seguridad, Metodología, Valores",
      copy: "Visita nuestras instalaciones. Sesiones supervisadas y aprendizaje profundo asegurando que tu hijo progresa en un entorno seguro.",
      cta: { label: "SABER MÁS", href: "/club" },
      image:
        "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=600&q=80",
      imageAlt: "Niños en la academia jugando con seguridad",
    },
    {
      eyebrow: "RUTAS COMPETITIVAS",
      heading: "PARA JUGADORES:",
      subtitle: "Competencia, Diversión, Crecimiento",
      copy: "Partidos intensos, tours de scouting y torneos para medir tu potencial al máximo.",
      cta: { label: "SABER MÁS", href: "/area-deportiva" },
      image:
        "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&q=80",
      imageAlt: "Jugador juvenil corriendo por la banda",
    },
  ];
}

/**
 * Gets sponsor and partner details.
 * @returns Array of SponsorItem items
 */
export function getSponsorsData(): SponsorItem[] {
  return [
    {
      name: "Punta Cana Resort",
      logo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&q=80",
      href: "https://example.com",
    },
    {
      name: "Banco Popular",
      logo: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=200&q=80",
      href: "https://example.com",
    },
    {
      name: "Scotiabank",
      logo: "https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=200&q=80",
      href: "https://example.com",
    },
    {
      name: "Claro RD",
      logo: "https://images.unsplash.com/photo-1556656793-08538906a9f8?w=200&q=80",
      href: "https://example.com",
    },
    {
      name: "Coca-Cola",
      logo: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=200&q=80",
      href: "https://example.com",
    },
    {
      name: "Nike",
      logo: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=80",
      href: "https://example.com",
    },
    {
      name: "Green Studio",
      logo: "/_emdash/api/media/file/01M1WPNKQ1QVY6JCZY6140M0XJ.01M1WPNKRECW7GJ238XSVQ1D7M.png",
      href: "https://greenstudiord.com/",
    },
    {
      name: "Dr. Katherine",
      logo: "/_emdash/api/media/file/01M1WQ4A98TX1WDX56EZ78NA9E.01M1WQ4A9MY591QGWXVX18NCZ5.png",
      href: "",
    },
  ];
}
