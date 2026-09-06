# Revisión de Copy — Punta Cana FC

> **Fecha:** 5 de Septiembre, 2026
> **Sitio:** https://puntacanafc.com
> **Tipo:** Academia de fútbol / educación deportiva — Punta Cana, República Dominicana
> **Puntuación General:** **7.5/10**

---

## 📊 Resumen Ejecutivo

El copy de Punta Cana FC es **sólido y maduro** en comparación con el benchmark de Eter Studio (8.5/10). Transmite claramente que es una academia premium de alto rendimiento, con un camino estructurado de 4 a 19 años y una propuesta basada en metodología europea, valores y formación integral.

**Lo positivo:** enfoque en el "camino claro", messaging profesional, progresión por etapas, y diferenciación clara (UEFA, instalaciones). El tono es serio y premium, alineado con el positioning de una academia de élite.

**Lo que necesita mejora:** (1) el copy de `/calendario` es funcional pero poco emocional, (2) `/fotos` carece de narrative hook en el hero, (3) inconsistencias en el nivel de detalle entre páginas, (4) varios CTAs genéricos como "Ver programa" y "Ver calendario".

---

## 🐛 Errores Críticos

| # | Error | Ubicación | Corrección |
|---|---|---|---|
| 1 | **"Ver programa" duplicado** — aparece dos veces por categoría en index.astro | Hero → Categorías | Eliminar el duplicado, debe aparecer una sola vez |
| 2 | **"Área Deportiva"** con acento gracioso — en el title tag HTML pero no en nav | `<title>Area Deportiva...` | Corregir a "Área Deportiva" en title |
| 3 | Copy de `/calendario` es funcional, no conecta emocionalmente con padres | `calendario.astro` H2 "Lo que viene" | Añadir un pain point específico: "¿Sabes cuándo juega tu hijo?" |
| 4 | Hero de `/fotos` no tiene hook narrativo | `fotos.astro` hero | Agregar frase que conecte emocionalmente: "Porque cada partido es un recuerdo" |
| 5 | **"Programa Familiar"** en inglés mixto con español | index.astro → Comunidad | Unificar: todo el copy en español, o marcar claramente como "Parents Program" |

---

## 📑 Revisión Sección por Sección

### 👑 HERO (index.astro)

**Actual:**
```
Academia · Punta Cana
Pasión por el Fútbol
Academia premium de alto rendimiento en el Caribe dominicano.
Metodología profesional, valores sólidos y un camino claro
desde los 4 hasta los 19 años.
Inscríbete →   Conoce el club
```

**Problemas:**
- "Pasión por el Fútbol" es genérico — podría ser más específico sobre lo que hace única a PCFC.
- "Metodología profesional, valores sólidos y un camino claro" → la segunda frase es un poco corporativa. El "camino claro desde los 4 hasta los 19" es bueno, pero podría ser más concreto.

**Sugerencia:**
```
Academia · Punta Cana
Fútbol desde los 4 hasta los 19
Academia premium de alto rendimiento. Formamos futbolistas
con metodología europea, valores y un camino claro hacia
el nivel profesional. Tu hijo juega y crece con nosotros.
Inscríbete →   Conoce el club
```

---

### 🚦 CATEGORÍAS (index.astro)

**Actual:**
```
UN CAMINO CLARO, DE 4 A 19 AÑOS
Cuatro etapas formativas con objetivos propios,
evaluación continua y progresión garantizada hacia
el alto rendimiento.

4 a 8 años   01 Pre-Formativas
Primer contacto con el balón. Coordinación,
motricidad y amor por el juego.
Ver programa → Ver programa →

9 a 12 años   02 Formativas Bajas
Técnica individual, fundamentos tácticos y
primeras competencias oficiales.
Ver programa → Ver programa →
...
```

**Problemas:**
- "Ver programa → Ver programa →" aparece DUPLICADO en cada categoría (bug visual).
- Las descripciones son funciones, no emocionales. No conectan con el padre que quiere ver crecer a su hijo.
- No hay un "punch" emocional en la sección de progresión.

**Sugerencia:**
```
CUATRO ETAPAS, UN CAMINO HACIA EL PROFESIONAL
De los primeros toques de balón hasta los partidos
de competición regional. Cada etapa evalúa,
corrige y eleva el nivel.

[Eliminar duplicado de "Ver programa"]
```

---

### 🏆 POR QUÉ PCFC (index.astro)

**Actual:**
```
POR QUÉ PCFC
LO QUE NOS HACE DIFERENTES

01 Metodología europea
Plan formativo estructurado por etapa biológica,
no por edad cronológica. Evaluaciones trimestrales
con métricas objetivas.

02 Cuerpo técnico certificado
Entrenadores con licencias UEFA y experiencia en
academias de primer nivel. Ratio máximo 1:12
jugador-entrenador.

03 Formación integral
Trabajo coordinado con el área académica y familiar.
Valores, disciplina y liderazgo son tan importantes
como el toque de balón.
```

**Problemas:**
- Muy buen copy, pero podría incluir un resultado concreto (métrica). Eter Studio logró un 8.5/10 en parte porque incluyó "35% crecimiento" en un testimonial. PCFC no menciona logros.

**Sugerencia:** Añadir una línea de resultado:
```
02 Cuerpo técnico certificado
Entrenadores con licencias UEFA y experiencia en
academias de primer nivel. Ratio máximo 1:12
jugador-entrenador. 7 de nuestros exalumnos
han firmado con ligas profesionales en los últimos 2 años.
```

---

### 🗓️ CALENDARIO (calendario.astro)

**Actual:**
```
Temporada 2026
Calendario
Todos los partidos de Punta Cana FC — próximos encuentros
y resultados de las cuatro categorías formativas.
Filtra por tu equipo y entérate cuándo juega tu hijo.

Filtra por categoría
Encuentra rápidamente los partidos de tu equipo.
Todas  Pre-Formativas  Formativas Bajas  Formativas Altas  Elite / Reserva

Lo que viene
PRÓXIMOS PARTIDOS
Ya viene el siguiente encuentro. Anticípate,
planifica y acompaña al equipo.
```

**Problemas:**
- "Ya viene el siguiente encuentro" es genérico. No conecta con la frustración del padre que "nunca sabe cuándo juega".
- Los partidos pasados no tienen galería de fotos para todos ("Sin fotos" aparece en uno). Eso rompe la promesa del hero.

**Sugerencia para H2:**
```
Lo que viene
PRÓXIMOS PARTIDOS
¿No sabes cuándo juega tu hijo esta semana?
Filtra por categoría y planifica tu fin de semana.
```

---

### 📸 FOTOS (fotos.astro)

**Actual:**
```
Temporada 2026 (esto parece copiado del calendario)
Galería de fotos
Todos los partidos de Punta Cana FC en fotos...
```

**Problemas:**
- El hero de fotos dice "Temporada 2026" (eyebrow) igual que calendario — no es específico.
- No hay un "emotional hook" — las fotos son el recuerdo más valioso para un padre.

**Sugerencia:**
```
 eyegrood: PARTIDOS RECIENTES
 h1: GALERÍA DE FOTOS
 lede: Porque cada partido es un recuerdo. Descarga las fotos de tu hijo en acción.
```

---

### 👨‍👩‍👧‍👦 PROGRAMA FAMILIAR (index.astro → Comunidad)

**Actual:**
```
PROGRAMA FAMILIAR
PARENTSA: Safety, Methodology, Values
Visit our facilities, power learning and monitored
sessions ensuring your child thrives in a secure
environment.
LEARN MORE

RUTAS COMPETITIVAS
PLAYERSA: Competition, Fun, Growth
Competition, action-packed games, high energy
matches, tactical growth, and elite scouting
tournaments.
LEARN MORE
```

**Problemas:**
- **INGLÉS parcial** mezclado con español. "PARENTSA" y "PLAYERSA" no son palabras. El copy está 70% en inglés y 30% en español.
- "Power learning" no es español (debería ser "aprendizaje en potencia" o similar).
- Rompe la regla de DESIGN.md §2: "Mezclar inglés y español innecesariamente".

**Sugerencia:** Traducir completamente al español manteniendo el tono familiar:
```
PROGRAMA FAMILIAR
PARA PADRES: Seguridad, Metodología, Valores
Visita nuestras instalaciones. Sesiones supervisadas
y aprendizaje profundo asegurando que tu hijo
progresa en un entorno seguro.
SABER MÁS

RUTAS COMPETITIVAS
PARA JUGADORES: Competencia, Diversión, Crecimiento
Partidos intensos, tours de scouting y
torneos para medir tu potencial al máximo.
SABER MÁS
```

---

### 🎯 CTAs GENÉRICOS

**Actual:**
- "Ver programa →" (categorías)
- "Ver calendario →" (hero → próximo partido)
- "Conoce el club" (hero)
- "Ver galería completa →" (fotos)
- "Leer más →" (footer de ValuePillars)

**Problemas:** Los CTAs son consistentes en estilo pero algunos son genéricos ("Ver programa" no dice qué vas a encontrar).

**Sugerencia:** Hacer CTAs más específicos:
- "Ver programa →" → "Ver requisitos y horarios →"
- "Ver calendario →" → "Ver todos los partidos →"

---

## 🎯 Prioridades

### 🔴 Prioridad Alta (Fix Inmediato)
1. **Eliminar el "Ver programa → Ver programa →" duplicado** en index.astro categorías
2. **Traducir Programa Familiar al 100% español** o marcar claramente como versión bilingüe (PARENTSA/PLAYERSA son errores)
3. **Corregir "Area" → "Área"** en el title tag de area-deportiva

### 🟡 Prioridad Media (Esta semana)
4. **Añadir hook emocional al hero de /fotos** — "porque cada partido es un recuerdo"
5. **Mejorar el lede de /calendario** — conectar con el pain point del padre
6. **Especificar CTAs** — "Ver programa" → "Ver requisitos y horarios"
7. **Añadir un resultado concreto a Por qué PCFC** (ej: "7 exalumnos en ligas profesionales")

### 🟢 Prioridad Baja (Próximas semanas)
8. **Testimonial con resultado** — un padre diciendo "mi hijo mejoró X en Y meses"
9. **Revisar /club copy** (historia, misión/visión) para asegurar voice consistency
10. **Agregar schema FAQ** para preguntas frecuentes sobre inscripciones

---

## ✅ Veredicto Final

**7.5/10** — El copy de PCFC es profesional, consistente en voice y transmite bien el mensaje premium. Las violaciones de DESIGN.md (mezcla inglés/español) y bugs visuales (CTA duplicado) son prioritarias. La oportunidad más grande es **humanizar** el copy — conectar más emocionalmente con padres y jugadores, y agregar resultados concretos que demuestren el valor real de la academia.

El copy es funcional y serio, pero necesita un empujón narrativo para pasar de "informativo" a "emocionalmente persuasivo". El patrón de "camino claro de 4 a 19" es fuerte — solo necesita más testigos concretos.

---

*Revisión generada 5 de Septiembre, 2026 — PCFC Copy Review v1*
