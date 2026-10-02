# Plan: Sedes + inscripción web→plataforma (sin horario público)

## Goal
La web publica sedes (sin horarios), con contacto y mapa por sede, y su formulario de inscripción replica los campos requeridos de la plataforma y crea la preinscripción vía API para que el coordinador solo la active.

## Current context / assumptions
- Web: `/Users/johantavarez/Desktop/pcfc/punta-cana-fc` (Astro 7.3.1 + EmDash, output server; dev `DEPLOY_TARGET=dev` en 127.0.0.1:4321; prod Cloudflare Workers + binding email `SEB`).
- Plataforma: `/Users/johantavarez/Desktop/pcfc/futbolpro-academy---gestión-integral-de-cantera` (Express `server.ts`, puerto 3000, `bun run dev` / `tsx server.ts`; DB SQLite/Turso vía `sqliteService`).
- Sedes reales (de `src/server/sedesCore.ts` + `GET /api/sedes`): **Village PCIS** (`Boulevard Turístico del Este Km 14, Punta Cana / Bávaro`), **Village Club** (sin dirección), **BBS** (sin dirección). Tipo `Sede`: `name, short, address, phone, color, active` — NO hay contacto por sede ni coordenadas (direcciones de Village Club/BBS + teléfonos/contactos van como `/** PLACEHOLDER */` hasta que el usuario los pase).
- Form plataforma (`src/components/Players/PlayerEnrollmentForm.tsx`): 5 tabs (personal, tactical, tutor, medical, membership). Requerido real: nombre alumno + padre/tutor + sede (`playersCore.ts:128-129` exige `firstName` + `category`; el form exige además tutor y sede). Tipo `Player` (`src/types/index.ts:155+`).
- Estados jugador: `activo | inactivo | lesionado | baja` — NO existe `preinscrito`. La preinscripción web entra como `status: 'inactivo'` + nota origen; el coordinador la activa con el `PlayerStatusModal` existente (clic a `activo`). Sin UI nueva en plataforma salvo filtro/badge opcional.
- Auth plataforma (`server.ts:63-67`): todo `/api/*` exige token salvo `PUBLIC_API_PATHS` (`/health`, `/auth/*`, `/public/matches`). La web NO puede leer sedes ni crear jugadores sin token → se añade endpoint público con secreto compartido (ver tarea 4).
- Donde hay horario publicado hoy (a OCULTAR): `src/pages/categorias.astro:26,39,52,65` (`schedule=` por categoría), `src/pages/area-deportiva.astro:95,109,123,137`, `src/data/homeData.ts` (`getCategoriesData().schedule`), `src/pages/padres.astro:201-202` (FAQ horarios). Calendario de partidos (`fetchAcademyFeed`, `calendario.astro`) NO es horario de entrenamientos → se deja.
- Formularios email existentes (no tocar): `POST /api/contacto-patrocinio` → `rrhhpuntacanafc@gmail.com`, `POST /api/inscripcion` → mismo destino. El nuevo flujo de inscripción es API a plataforma, NO email (el email queda como respaldo si la plataforma no responde — ver tarea 6).
- Contraste obligatorio: texto pequeño sobre claro = navy/navy-60, nunca blanco ni sky. Español UI. Marca sin tilde ("Eter Studio" n/a aquí; club "Punta Cana FC"/"PCFC"). Sin deploy sin OK explícito.

## Architecture / proposed approach
Nueva página `/sedes` en la web con tarjetas por sede (contacto + mapa + CTA que abre `/inscribete?sede=<slug>` preseleccionando sede); el form de inscripción replica 1:1 los campos requeridos del `PlayerEnrollmentForm` y hace `POST /api/inscripcion-plataforma` (endpoint web) que reenvía a `POST /api/public/preinscriptions` (endpoint público nuevo en plataforma, auth por secreto `WEB_API_KEY`) creando el jugador `inactivo`; el coordinador lo ve en su lista y lo activa con el modal existente.
Fuera de alcance: horarios en plataforma (siguen internos), pagos online, edición web de sedes (las sedes se gestionan en plataforma vía `SedeManager`).

## Step-by-step tasks

### 1. Ocultar horarios publicados en la web
- **Archivos**: `src/pages/categorias.astro`, `src/pages/area-deportiva.astro`, `src/data/homeData.ts`, `src/pages/padres.astro`.
- **Acción**: quitar `schedule=` de los 4 objetos de categoría en `categorias.astro` (líneas 26,39,52,65) y su render (`schedule={cat.schedule}` línea 121 → borrar la línea del `<dd>`/badge de horario, NO todo el card); igual en `area-deportiva.astro` (95,109,123,137 + render); en `homeData.ts` quitar el campo `schedule` de `Category` y de los 4 returns (y su uso en `HomeCategories.astro` si lo рендеrea — verificar con `grep -rn "schedule" src/components/`); reescribir `padres.astro:201-202` a: pregunta "¿Cuáles son los horarios?" → respuesta "Cada sede define sus horarios por categoría. Escríbenos y te confirmamos el de tu sede." (copy exacto, aprobado en este plan).
- **Comando**: `grep -rn "schedule\|4:00\|5:30\|6:00\|8:00 pm" src/pages/categorias.astro src/pages/area-deportiva.astro src/pages/padres.astro src/data/homeData.ts src/components/HomeCategories.astro`
- **Esperado**: 0 matches (solo deben quedar menciones de "horario" en el FAQ reescrito y en `calendario.astro`/feed de partidos, que sí se quedan).

### 2. Fuente de sedes en la web (`src/data/sedes.ts`)
- **Archivo nuevo**: `src/data/sedes.ts` con:
```ts
export interface SedeContacto {
  slug: string; nombre: string; direccion: string;
  telefono: string; email: string; mapsUrl: string;
  /** placeholder hasta dato real */
}
export function getSedes(): SedeContacto[] {
  return [
    { slug: 'village-pcis', nombre: 'Village PCIS', direccion: 'Boulevard Turístico del Este Km 14, Punta Cana / Bávaro', telefono: '+1 809-652-9450', email: 'info@puntacanafc.com', mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Boulevard+Tur%C3%ADstico+del+Este+Km+14+Punta+Cana' },
    { slug: 'village-club', nombre: 'Village Club', direccion: '/** PLACEHOLDER — dirección pendiente */', telefono: '+1 809-652-9450', email: 'info@puntacanafc.com', mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Village+Club+Punta+Cana' },
    { slug: 'bbs', nombre: 'BBS', direccion: '/** PLACEHOLDER — dirección pendiente */', telefono: '+1 809-652-9450', email: 'info@puntacanafc.com', mapsUrl: 'https://www.google.com/maps/search/?api=1&query=BBS+Punta+Cana' },
  ];
}
```
- **Regla**: slugs estables (`village-pcis`, `village-club`, `bbs`) porque viajan en `?sede=` y al API. Teléfono/email genéricos del club hasta dato por sede.
- **Comando**: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -i sede; echo "exit=$?"` — Esperado: sin errores de `sedes.ts`.

### 3. Página `/sedes` (`src/pages/sedes.astro`)
- **Archivo nuevo**: hero simple (eyebrow "Sedes", H1 "Nuestras sedes", lede "Elige tu sede más cercana. Los horarios se confirman por sede al inscribirte.") + grid de tarjetas (una por sede de `getSedes()`): nombre, dirección, teléfono (`tel:`), email (`mailto:`), botón "Cómo llegar" (`mapsUrl`, `_blank`), botón "Inscríbete aquí" → `/inscribete?sede=<slug>`. Contraste: tarjetas `bg-white border-navy-10`, texto `navy/navy-60`.
- **Comando**: `curl -s --max-time 8 http://127.0.0.1:4321/sedes/ | grep -c "village-pcis\|village-club\|bbs"` — Esperado: `3`.
- **Comando**: `curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:4321/sedes/` — Esperado: `200`.

### 4. Endpoint público en plataforma (`POST /api/public/preinscriptions`)
- **Archivos plataforma**: `server.ts` (ruta + añadir `'/public/preinscriptions'` a `PUBLIC_API_PATHS` junto a `'/public/matches'`), `src/server/playersCore.ts` (nueva función `createPreinscription(data)` o reutilizar create con defaults).
- **Contrato exacto**:
  - Request JSON: `{ firstName, lastName, birthDate (YYYY-MM-DD), category, sedeId/sedeSlug, parentName, parentRelationship, parentPhone, parentEmail, address?, medicalNotes?, source: 'web', sedeNombre? }`. Auth: header `x-web-key: <WEB_API_KEY>` (comparación timing-safe; ver `authCore.ts` `authenticate` como referencia de estilo).
  - Crea jugador con `status: 'inactivo'`, `paymentStatus: 'pendiente'`, `notes: '[WEB] Preinscripción <fecha> — sede <nombre>. Activar desde ficha.'`, resto de campos `Player` con defaults sanos (`dorsal: 0`, `position: ''`, `avatarUrl: ''`, `matchesPlayed/goals/assists: 0`, `monthlyFee: 0`, `hasInsurance: false`, `emergencyContact/Phone` = datos del tutor).
  - Response: `201 { ok: true, playerId }` / `400 { ok:false, error }` (mismos mensajes ES que `playersCore`: 'El nombre es requerido', 'La categoría es requerida') / `401` key inválida.
- **Levantar plataforma local**: `cd "/Users/johantavarez/Desktop/pcfc/futbolpro-academy---gestión-integral-de-cantera" && PORT=3000 bun run dev` — Esperado: `Punta Cana FC Academy server running on http://0.0.0.0:3000`.
- **Comando**: `curl -s -X POST http://127.0.0.1:3000/api/public/preinscriptions -H 'Content-Type: application/json' -H 'x-web-key: test' -d '{"firstName":"Prueba","lastName":"Uno","birthDate":"2015-03-10","category":"Sub-12","sedeId":"<id>","parentName":"Madre","parentRelationship":"Madre","parentPhone":"+18090000000","parentEmail":"m@t.com","source":"web"}'` — Esperado: `401` con key mala; con key real `201 {ok:true, playerId}`.
- **Secreto**: `WEB_API_KEY` en `.env` plataforma (generar: `openssl rand -hex 32`); la web lo lee de env `PLATFORM_API_KEY` (Cloudflare secret en prod, `.env` en dev). NUNCA commitear el valor.

### 5. Form web = campos plataforma + sede (`src/pages/inscribete.astro`)
- **Archivo**: reescribir fieldsets para replicar requerido de `PlayerEnrollmentForm`: Datos del jugador (`firstName`, `lastName`, `birthDate` date, `category` select con las `CategoryType` de plataforma — verificar valores exactos en `src/types/index.ts` de plataforma, p.ej. `Sub-6/Sub-8/Sub-10/Sub-12/...`, NO los slugs web `pre/form-baja`), Sede (`sede` select poblado de `getSedes()`, preselección por `?sede=` vía `Astro.url.searchParams`), Datos del tutor (`parentName`, `parentRelationship` select Padre/Madre/Tutor Legal/Abuelo-a/Otro, `parentPhone`, `parentEmail`, `address`), Notas médicas (`medicalNotes` textarea opcional → `allergies`/`medicalConditions`), checkbox términos. Mantener clases `form-*` y `id="inscription-form"`.
- **Comando**: `curl -s http://127.0.0.1:4321/inscribete/?sede=bbs | grep -c 'value="bbs" selected\|selected.*bbs'` — Esperado: `>=1` (preselección funciona).

### 6. Puente web→plataforma (`src/pages/api/inscripcion-plataforma.ts`)
- **Archivo nuevo**: `POST` lee el form, valida (requeridos, email regex, fecha válida, `sede` ∈ slugs de `getSedes()`, términos), resuelve `sedeId` de plataforma por `short`/nombre (mapeo en código con comentario: ajustar si plataforma renombra sedes), `fetch(${PLATFORM_URL}/api/public/preinscriptions, { headers: { 'x-web-key': PLATFORM_API_KEY } })`.
  - Éxito (201) → `json({ ok: true })` (front muestra: "¡Solicitud recibida! Te contactaremos en menos de 24 horas para confirmar tu sede y horario." — copy exacto, menciona sede+horario a propósito).
  - Plataforma caída/error → fallback email a `rrhhpuntacanafc@gmail.com` con todos los datos + `sede` (reutilizar lógica de `src/pages/api/inscripcion.ts`, NO borrar ese archivo en este plan) → `json({ ok: true, fallback: 'email' })`.
- **Comandos**: con plataforma arriba: POST válido → `{"ok":true}`; con plataforma apagada: POST válido → `{"ok":true,"fallback":"email"}`; sede inválida → `400`.
- **Vars**: `PLATFORM_URL` (dev `http://127.0.0.1:3000`, prod URL de la plataforma), `PLATFORM_API_KEY` en `wrangler.jsonc` (vacío) + `.env.example` documentado. Front de `inscribete.astro` apunta al endpoint nuevo (cambiar el `fetch('/api/inscripcion')` por `/api/inscripcion-plataforma` en el `<script>`).

### 7. Activación en 1 clic (plataforma, sin UI nueva)
- **Verificación, no código**: con la preinscripción creada en tarea 4, abrir plataforma local → lista de jugadores → filtrar `inactivo` → abrir ficha → `PlayerStatusModal` → "Activo" → guardar. El jugador queda `activo` sin re-escribir datos.
- **Mejora opcional (solo si sobra tiempo)**: badge "WEB" en `PlayerList.tsx` cuando `notes` contiene `[WEB]` (1 línea + estilo existente, sin nuevos componentes).
- **Comando**: `curl -s -H "Authorization: Bearer <token-coordinador>" http://127.0.0.1:3000/api/players | python3 -c "import json,sys; d=json.load(sys.stdin); print([ (p['firstName'],p['status']) for p in (d if isinstance(d,list) else d.get('players',[])) ])"` — Esperado: la preinscripción figura `inactivo` antes del clic y `activo` después.

## Tests / validation
Por tarea se sigue TDD reducido (endpoint-first): 1) escribir el `curl` esperado de cada tarea y confirmar que FALLA antes (`404`/campo ausente), 2) implementar lo mínimo, 3) repetir el `curl` y confirmar el output esperado, 4) commit por tarea (`git add` solo archivos propios — nunca arrastrar WIP ajeno — ver memoria: EterStudio WIP rule aplica igual aquí). Validación final: recorrido padre completo en browser (captura): `/sedes` → "Inscríbete aquí" (sede preseleccionada) → enviar → éxito 24h → jugador `inactivo` visible en plataforma → activar → `activo`. Sin deploy (prohibido sin OK).

## Risks, tradeoffs, and open questions
- **Riesgo auth**: `x-web-key` compartido es suficiente para v1 (endpoint solo crea `inactivo`, no lee ni borra); si se filtra, rotar `WEB_API_KEY`. No exponer `POST /api/players` (con auth de coordinador) a la web.
- **Riesgo mapeo sede**: web usa slugs (`bbs`), plataforma usa `sedeId` interno; si coordinador renombra una sede en `SedeManager`, el mapeo se rompe → el endpoint responde `400 sede desconocida` y cae al fallback email (fail-safe, no se pierde el lead).
- **Riesgo duplicados**: padre que envía 2 veces crea 2 preinscripciones → el coordinador las ve por nombre+tutor y descarta una (documentar en plataforma, no código).
- **Tradeoff form completo vs requerido**: replicar las 5 tabs (táctico/médico/membresía) haría el form web eterno y baja conversión; se replica lo requerido + notas médicas. El resto lo completa el coordinador al activar (ya es su flujo actual).
- **Tradeoff email fallback**: mantiene `inscripcion.ts` vivo como respaldo; cuando la API lleve 1 mes estable, se puede retirar (anotar, no hacer ahora).
- **Open**: ¿`CategoryType` exactos de plataforma para el select web? (leer `src/types/index.ts` de plataforma en tarea 5 — si difieren de Sub-6/8/10/12, usar los reales). ¿Contacto real por sede (tel/email/dirección Village Club y BBS)? Van placeholder; el usuario los pasa después. ¿URL prod de la plataforma (`PLATFORM_URL` prod)? Se configura al desplegar. ¿Rota `WEB_API_KEY` inicial? Generarla en build, no en este plan.
