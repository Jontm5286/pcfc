# Auditoría Sprint 1 (funcional) — Punta Cana FC

- Entorno: dev local `http://localhost:4321` (no producción)
- Fecha: 2026-10-30
- Alcance: rutas principales, 404, enlaces internos, WhatsApp/teléfono, formulario `/inscribete` (validación de API con payloads inválidos)
- Restricción: solo lectura. No se modificó ningún archivo del proyecto. No se enviaron inscripciones reales ni formularios con datos válidos. No se probaron likes (toggle).

## 1. Estado HTTP de rutas

| Ruta | Status | Tiempo | Observación |
|---|---|---|---|
| / | 200 | 0.07s | GA, banner cookies, Lightbox presentes en HTML |
| /club | 200 | 0.04s | |
| /area-deportiva | 200 | 0.04s | |
| /categorias | 200 | 0.04s | |
| /calendario | 200 | 0.04s | |
| /jugadores | 200 | 0.04s | |
| /padres | 200 | 0.04s | |
| /sponsors | 200 | 0.04s | |
| /tienda | 200 | 0.04s | |
| /terminos | 200 | 0.03s | |
| /blog | 200 | 0.04s | |
| /blog/entrevista-juan-perez-disciplina | 200 | 0.04s | |
| /blog/inicio-temporada-2026 | 200 | 0.04s | |
| /blog/primera-semana-torneo-pcfc-2026 | 200 | 0.04s | |
| /blog/resultados-semanal-pcfc-semana-1 | 200 | 0.03s | |
| /fotos | 200 | 0.05s | Lightbox presente |
| /fotos/todas | 200 | 0.08s | Lightbox presente |
| /fotos/amistoso-pcfc-vs-dt-u16 | 200 | 0.05s | |
| /fotos/infantil-26-septiembre-2026 | 200 | 0.07s | |
| /inscribete | 200 | 0.04s | |
| /fotos/no-existe | 404 | 0.04s | Responde 404 pero el HTML conserva layout (Lightbox/GA) |
| /blog/no-existe | 404 | 0.01s | |
| /ruta-falsa | 404 | 0.01s | |

Resultado: las 18 rutas válidas responden 200 en menos de 0.1 s; las 3 rutas inexistentes responden 404.

## 2. Enlaces internos e imágenes

Crawl de 20 páginas, 533 URLs únicas extraídas (href/src/srcset). 11 entradas marcadas como "rotas", todas falsos positivos:

- `${attrs.href}`, `${attrs.src}`, `${s.mapsUrl}` en `/club` (404): son plantillas JS no resueltas. Son código de cliente que el extractor leyó como URL, no enlaces del HTML final. Falso positivo.
- 8 entradas `iVBORw0KGgo…` en `/calendario` (404): son imágenes PNG en base64 (`data:image/png;base64,…`) que el extractor trató como URL relativa. Falso positivo.
- `/perfil` (404) referenciada desde `/`: el enlace está dentro de un comentario HTML (`<!-- <a href="/perfil" …>` en `src/components/Navbar.astro`, ~línea 134-142). No se renderiza, así que no es un enlace roto visible. Falso positivo, aunque conviene retirar el bloque comentado.

No se encontraron enlaces internos rotos reales en las 20 páginas.

## 3. WhatsApp / teléfono

- Búsqueda de `18096529450` / `809-652-9450` en el HTML renderizado de las 18 rutas y en `src/` y `public/`: sin coincidencias.
- Los `wa.me` y `tel:` del HTML renderizado apuntan a números del tipo previsto (`18299889500` Village / `18292464756` BBS-RD Complex). La revisión de los números concretos está limitada por la extracción; ver "No verificado".
- `src/data/sedes.ts`: RD Complex con `telefono: '+1 829-246-4756'`, coherente con `18292464756`.

## 4. Navegación

- `Navbar.astro`: el bloque de perfil está comentado (ver §2). No hay enlace visible a `/perfil`.
- Texto "Punta Cana FC" en la home: presente (conteo realizado, no se conservó el valor exacto).
- Menú móvil y links del footer: NO VERIFICADO en navegador (ver "No verificado").

## 5. Fotos

- Presencia de Lightbox en `/fotos`, `/fotos/todas` y `/fotos/amistoso-pcfc-vs-dt-u16`: confirmada en el HTML.
- Paginador (10 partidos/página), top-4 por likes en `/fotos/<slug>`, botón like y descarga: NO VERIFICADO (requiere navegador o análisis de la lógica de render; no se ejecutó toggle de likes).

## 6. Formulario `/inscribete`

### 6.1 Sedes

- `src/data/sedes.ts` define las 4 sedes: `village-pcis`, `village-club`, `bbs`, `rd-complex`.
- `src/pages/api/inscripcion-plataforma.ts` contiene el mapeo `SEDE_ID_POR_SLUG` (comentario "Mapeo slug web → sedeId de plataforma (`sedesCore.ts` DEFAULT_SEDES)"). Comentario indica: ante un id desconocido, la plataforma responde 400.
- Pruebas de API con payloads inválidos (sin enviar nada real):
  - `sede: "no-existe"` (con categoría válida) → 400 `Selecciona una sede válida.`
  - `terminos: false` → 400 `Debes aceptar los términos y condiciones.`
  - `lastName: ""` → 400 `Completa todos los campos obligatorios.`
  - `birthDate: "1990-01-01"` → 400 `La fecha de nacimiento no es válida.`
  - `birthDate: "2015-02-30"` (fecha imposible) → 400 `La fecha de nacimiento no es válida.`
  - `birthDate: "2099-01-01"` (futura) → 400 `La fecha de nacimiento no es válida.`
  - JSON roto y body vacío → 400 `Solicitud inválida. Inténtalo de nuevo.`

Las validaciones de fecha, campos, términos y sede responden bien.

### 6.2 Causa probable de "Solicitud inválida" en RD Complex (MEDIA, no confirmada)

Evidencia:
- El mensaje `Solicitud inválida. Inténtalo de nuevo.` se devuelve (verificado con curl) cuando `request.json()` falla (JSON roto o body vacío). El cliente (`WizardForm.astro` ~línea 800-830) muestra `out?.error` tal cual, así que cualquier 400 con ese texto llega al usuario.
- El payload que arma `WizardForm.astro` (~líneas 769-800) incluye `sede` tomado de `data-slug` (`sede` puede quedar `''` si el dataset no se llenó) y `trial` según `modoPrueba`. Con una sede válida el JSON es válido, así que el fallo en prod no parece de parseo.
- Causa más probable: el `sedeId` que el endpoint envía a la plataforma para `rd-complex` no coincide con el id configurado en la plataforma externa (el comentario de `SEDE_ID_POR_SLUG` indica que hay que "AJUSTAR" si la plataforma renombra o recrea sedes). La plataforma responde 400 y el endpoint lo reenvía como 400 al cliente con el mensaje genérico.
- Hipótesis secundaria: un 400 propagado de la plataforma con cuerpo no JSON, que el endpoint traduce a "Solicitud inválida".

No se confirmó el id real de `rd-complex` en `sedesCore.ts` del repositorio hermano (solo lectura). Verificar en prod con la respuesta de la plataforma para `rd-complex` (no enviar datos reales: usar el coordinador o el panel de la plataforma).

Fallback por email: el comentario de `SEDE_ID_POR_SLUG` indica "caemos al…" (texto truncado en la lectura). No se pudo confirmar si el fallback envía email; revisar ese bloque completo antes de cerrar la hipótesis.

### 6.3 Categoría provisional

- `categoriaProvisional()` en `WizardForm.astro` (~línea 369) calcula edad y devuelve una de las categorías del `CATEGORIAS` del endpoint. Las categorías coinciden entre cliente y servidor (verificado por lectura).

## 7. Cookies y GA4

- `G-SS9SN2G5DQ`: presente en el HTML de todas las rutas válidas.
- `cookies_accepted`: presente en el HTML de las rutas válidas.
- Eventos `submit_inscription` / `submit_trial` (en `WizardForm.astro`), `toggle_like`, `download_photo`, `navigation_toggle`: NO VERIFICADO el disparo real (requiere navegador).

## Hallazgos por severidad

### Alta
- Ninguno confirmado.

### Media
1. `/inscribete` — "Solicitud inválida" para RD Complex en prod: causa probable en el mapeo `SEDE_ID_POR_SLUG` (`src/pages/api/inscripcion-plataforma.ts`, ~línea 58-62 bloque de mapeo) o en un 400 propagado de la plataforma; sin confirmar. Fix sugerido: confirmar el sedeId de `rd-complex` en la plataforma; hacer que el endpoint registre el status y el cuerpo de la respuesta de la plataforma; no mostrar el mensaje genérico cuando la plataforma responde 400 por sede desconocida.

### Baja
1. `src/components/Navbar.astro` ~líneas 134-142: bloque `<!-- <a href="/perfil"…> -->` comentado. Provoca falsos positivos en crawlers. Fix: eliminar el bloque o marcarlo como pendiente.
2. `/club` (`${attrs.href}`, `${attrs.src}`, `${s.mapsUrl}`) y `/calendario` (imagen base64): el crawler los trata como enlaces rotos. Fix: excluir plantillas y `data:` URIs del crawl; no requiere cambio de código.
3. `/fotos/no-existe`: responde 404 pero renderiza el layout completo. Revisar que el 404 no indexe y que el layout sea correcto (o que sea intencional).

## No verificado

- Errores de consola JS y carga real en navegador: no se usó el navegador (no ejecutado en esta pasada).
- Menú móvil, links del footer, paginador de fotos, top-4 por likes, botón like y descarga de fotos: requieren navegador.
- Disparo de eventos GA4 (`submit_inscription`, `toggle_like`, `download_photo`, `navigation_toggle`): solo confirmada la presencia del ID en el HTML.
- Lectura completa de los números `wa.me` / `tel:` de cada página: la extracción mostró los números, pero no se comparó cada uno contra los dos esperados en este informe.
- Fallback por email en `inscripcion-plataforma.ts` (texto del comentario truncado en la lectura).
- Id real de `rd-complex` en la plataforma externa (`sedesCore.ts` del repositorio hermano): no confirmado.


## Calendario — sede de la convocatoria (solo lectura)

Nota del usuario: que los partidos se rendericen siempre con Punta Cana FC como local es intencional. No se reporta como bug.

**Campo existente en el feed**
- `src/lib/academy-feed.ts:26-30`: tipo `AcademyMatch` con `sedeId`, `sedeName`, `opponentSedeId`, `opponentSedeName`. `location` en `:24` e `isHome` en `:25`.
- `src/lib/academy-feed.ts:120-130`: `fetchAcademyFeed` pasa `apiData.upcoming` / `apiData.played` sin normalizar (sin mapeo snake_case → camelCase). Depende de que el API devuelva claves camelCase.
- Backend (repo hermano, solo lectura): `src/server/callupsCore.ts:415-429` arma `sedeName` (desde `sede_id`) y `opponentSedeName` (desde `opponent_sede_id`). `:269-270` devuelve `location` e `isHome` en el mapeo público. `worker/index.ts:910-917` pasa `sedeNames` a `handlePublicMatches`.

**Dónde se convierte en texto**
- `src/lib/academy-feed.ts:69-76`: `matchSedeLine(m)` produce `📍 {sedeName} · Intersedes vs {opponentSedeName}` o `📍 {sedeName}`. Vacío si no hay datos.

**Dónde llega a la UI (ya renderizado)**
- `src/pages/calendario.astro:56-57`: `venue` (desde `location`, con respaldo) y `sedeLine` (desde `matchSedeLine`). `:285-286` y `:323-324` pasan `venue` y `sedeLine` a `MatchListItem`.
- `src/components/MatchListItem.astro:104-125`: muestra `sedeLine` bajo la ubicación, solo si existe.
- `src/components/FixturesBar.astro:112` y `:249-250`: `sedeLine` en las tarjetas de próximos partidos (`.fx-sede`, CSS en `:453`).

**Qué falta / riesgos**
- No hay un campo de sede separado en la UI de `calendario.astro` para el partido jugado de `FixturesBar` (`played`); solo se usa `sedeLine` en las tarjetas de próximos partidos. Revisar si la tarjeta de jugados debe mostrar la misma línea.
- `calendario.astro:56` usa `location` como `venue`. Si `location` está vacío y el partido es away, se muestra `Por confirmar`, aunque `sedeName` sí venga en el feed. La sede de la convocatoria solo aparece en `sedeLine`, no como fallback de `venue`.
- Riesgo de mapeo: si el API público devuelve `sede_name` en vez de `sedeName`, `matchSedeLine` queda vacío sin error. No verificado contra la respuesta viva del API (URL externa `ACADEMY_API_URL`).
- Home/away: `academy-feed.ts:25` conserva `isHome`. `FixturesBar.astro:75-76` lo usa para orientar el marcador. `calendario.astro:55` fija `team1` como `PCFC`, lo cual es intencional según el usuario. No se encontró una UI que contradiga el `isHome` del feed, salvo esa intención.

**Estado de los archivos:** `git status` muestra `M` en `academy-feed.ts`, `FixturesBar.astro`, `MatchListItem.astro`, `calendario.astro` y `.emdash/migrations.json` (WIP del usuario). No se editaron.
