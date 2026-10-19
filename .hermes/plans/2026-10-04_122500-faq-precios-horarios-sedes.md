# FAQ Precios y Horarios por Sede — Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Responder en la web las preguntas "precios y horarios para BBS (niño de 8 años)" y "precios y horarios para cada sede".

**Architecture:** Nuevo módulo de datos `src/data/sede-info.ts` con precio y horarios por sede (fuente única), FAQ de `/padres` reescrita con respuestas concretas que lean ese módulo, y réplica resumida en `/inscribete` y `/jugadores`. Sin tocar `sedes.ts` (su REGLA DE ORO prohíbe horarios ahí) ni el CMS EmDash.

**Tech Stack:** Astro 7, FaqSection.astro (props `faqs`, `contactPhone`), `pnpm build:cf`, `wrangler deploy`.

---

## Contexto actual (verificado 2026-10-04)

- `src/components/FaqSection.astro:1-40` — componente accordion; props `faqs: FaqItem[]`, `contactPhone` default `+1 829-246-4756`, `contactEmail` default `admisiones@puntacanafc.com`.
- `src/pages/padres.astro:137-175` — FAQ "Preguntas que nos hacen todos los padres" (6 items). Hoy EVADE el dato:
  - `'¿Cuáles son los horarios?'` → "Cada sede define sus horarios por categoría. Escríbenos y te confirmamos el de tu sede."
  - `'¿Cuánto cuesta y hay becas o facilidades?'` → describe qué incluye, sin cifra: "Escríbenos y te enviamos el detalle actualizado de costos y documentos (...)".
- `src/pages/inscribete.astro:93`, `src/pages/jugadores.astro:135` — usan `FaqSection` con sus propios arrays (revisar si repiten las mismas evasivas).
- `src/data/sedes.ts:1-72` — 4 sedes (`village-pcis`, `village-club`, `bbs`, `rd-complex`) con `telefono`, `direccion`, `mapsUrl`. **REGLA DE ORO (líneas 5-6): los horarios NO viven aquí.** No agregar campos de horario a este módulo.
- Categoría niño 8 años: confirmar con el club (típico U8/U9 "Prebenjamín/Bibero"?). La respuesta de BBS debe nombrar la categoría real.
- ⚠️ En curso en paralelo: delegación `deleg_ca01fb6a` cambiando links ex-genéricos a RD Complex + deploy. No tocar `EnrollmentCta.astro`, `FaqSection.astro` defaults, `padres/tienda/terminos/jugadores/inscribete/blog` hasta que esa delegación termine, o coordinar el orden.

## Datos faltantes (BLOQUEANTE — pedir al usuario antes de implementar)

Sin estos datos reales NO implementar (prohibido inventar cifras; placeholders `TODO` solo para maquetar, nunca publicar):

1. **Precio mensual por sede** (¿mismo precio las 4 o difiere? ¿matrícula/inscripción aparte? ¿descuento hermanos?).
2. **Horarios BBS para niño de 8 años** (días + horas + nombre de la categoría).
3. **Horarios de las otras 3 sedes** (mismo formato; si alguna sede no atiende esa edad, decirlo explícito).
4. **Becas/facilidades**: ¿qué becas existen y requisitos? (el FAQ actual promete "becas de mérito" — confirmar que es real).
5. **Documentos de inscripción**: confirmar lista (acta de nacimiento, cédula, certificado médico, fotos).

## Enfoque propuesto

1. Crear `src/data/sede-info.ts`: `{ slug, precioMensual, matricula?, horarios: [{ categoria, edades, dias, hora }], notas? }` por sede. Fuente única que leen las páginas.
2. Reescribir en `/padres` las 2 FAQs evasivas con datos concretos: una para BBS (edad 8 años → categoría + días/horas + precio) y tabla/resumen de las 4 sedes.
3. Replicar resumen corto en `/inscribete` y `/jugadores` solo si repiten la evasiva (verificar antes).
4. `contactPhone` de cada FAQ → teléfono de la sede correspondiente (ya existe en `getSedes()`).
5. `pnpm build:cf` verde + `grep` de cifras en `dist/` + `wrangler deploy` (solo con OK explícito) + `curl` 200 prod.

## Step-by-step plan

### Task 1: Recoger datos reales del club

**Objective:** Tener precios y horarios verdaderos por sede antes de tocar código.

**Files:** ninguno (solo conversación).

- Preguntar al usuario los 5 puntos de "Datos faltantes".
- Expected: tabla completa sede × (precio, horarios U8, notas). Si el club NO quiere publicar precios → el plan cambia a "CTA a WhatsApp por sede" y se detiene aquí.

### Task 2: Crear `src/data/sede-info.ts` con datos reales

**Objective:** Fuente única de precio + horarios por sede.

**Files:**
- Create: `src/data/sede-info.ts`

```ts
export interface SedeHorario { categoria: string; edades: string; dias: string; hora: string; }
export interface SedeInfo { slug: string; precioMensual: string; matricula?: string; horarios: SedeHorario[]; notas?: string; }
export function getSedeInfo(): SedeInfo[] { return [ /* 4 sedes, datos reales */ ]; }
```

**Verify:** `npx tsc --noEmit` o `pnpm build:cf` compila (el import debe resolver).

### Task 3: Reescribir las 2 FAQs evasivas en `/padres`

**Objective:** Responder precio + horarios BBS (8 años) y resumen por sede.

**Files:**
- Modify: `src/pages/padres.astro:152-166` (los dos items `¿Cuáles son los horarios?` y `¿Cuánto cuesta...?`)

- Item horarios → días/horas BBS para la categoría de 8 años + "otras sedes: ..." (1 línea por sede desde `getSedeInfo()`).
- Item precio → cifra mensual + qué incluye + matrícula si aplica + becas solo si confirmadas en Task 1.
- `contactPhone="+1 829-246-4756"` (BBS/RD Complex, ya correcto en `padres.astro:174`).

**Verify:** `curl -s http://localhost:4321/padres | grep -c '<cifra del precio>'` ≥ 1.

### Task 4: Replicar en `/inscribete` y `/jugadores` si aplica

**Objective:** No dejar la evasiva vieja en otras páginas.

**Files:**
- Modify (solo si repiten la evasiva): `src/pages/inscribete.astro` (~línea 96), `src/pages/jugadores.astro` (~línea 139).

**Verify:** `grep -rn "te confirmamos el de tu sede\|detalle actualizado de costos" src/pages/` → 0 resultados.

### Task 5: Build + deploy (solo con OK)

**Objective:** Publicar respuestas verificadas.

- Run: `pnpm build:cf` — Expected: `Complete!` exit 0.
- Run: `grep -r '<cifra>' dist/client/padres/` — Expected: ≥1.
- Run (solo con pedido explícito): `npx wrangler deploy`.
- Run: `curl -s https://puntacanafc.com/padres | grep -c '<cifra>'` — Expected: ≥1.

## Tests / validación

| Check | Comando | Esperado |
|---|---|---|
| Sin evasivas | `grep -rn "te confirmamos el de tu sede\|detalle actualizado de costos" src/pages/` | 0 matches |
| Precio visible dev | `curl -s localhost:4321/padres \| grep -c '<precio>'` | ≥ 1 |
| Build CF | `pnpm build:cf` | exit 0 |
| Precio en dist | `grep -r '<precio>' dist/client/padres/` | ≥ 1 |
| Precio en prod | `curl -s https://puntacanafc.com/padres \| grep -c '<precio>'` | ≥ 1 |

## Riesgos y decisiones

- **Precios cambian con frecuencia** → al vivir en `src/data/sede-info.ts` el cambio es 1 línea + redeploy; alternativa (CMS EmDash) se descartó porque el loader del CMS no funciona en dev y el club ya gestiona copy en código.
- **`sedes.ts` no se toca** (REGLA DE ORO); si a futuro horarios deben ser editables sin deploy, migrar `sede-info.ts` a colección EmDash.
- **Conflicto con delegación en curso** (`deleg_ca01fb6a` toca los mismos archivos + deploy): ejecutar este plan DESPUÉS de que termine, o re-verificar `git status` antes de empezar.
- **Restricciones heredadas**: sin `git commit` ni `wrangler deploy` sin pedido explícito; no tocar `DESIGN.md`, `AGENTS.md`, `wrangler.jsonc`, ni datos `players/match_photos/sponsors/stats_pillars/gallery`.
