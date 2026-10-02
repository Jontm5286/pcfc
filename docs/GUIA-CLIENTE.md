# Guía del cliente — Qué puedes editar en el admin

Panel: **`/_emdash/admin`** (en local: `http://localhost:4321/_emdash/admin`).
Todo lo que edites aquí se publica en la web **sin tocar código**. Si algo no aparece
en esta guía, **no lo toques**: pide ayuda al equipo técnico.

> Campos verificados contra `.emdash/schema.json`. Los marcados con **\*** son obligatorios.

## 1. Fotos de partidos (`Match Photos`) — la colección más importante

Cada partido con fotos es una entrada. Campos:

- **Name\***: nombre interno, ej. `PCFC Sub-15 vs Canay FC — 24 ago`.
- **Home Team / Away Team**: nombres de los equipos. **Home Score / Away Score**: resultado.
- **Date**: fecha del partido (texto, ej. `2026-08-24`).
- **Images**: las fotos. Botón **“Añadir a la galería”**, hasta 50 por partido.
  Cada foto admite **alt** (descripción) y **caption** (pie de foto).
- **Portada**: la foto principal que se ve en `/fotos` y en tarjetas.
- **Mostrar en hero (`show_in_hero`)**: actívalo solo en 1–3 partidos con las mejores
  fotos — esas imágenes rotan en el hero de la portada.
- **Order**: número para ordenar (menor = primero). **Partido**: referencia interna, no tocar.

### Cómo publicar una galería paso a paso

1. Entra a `/_emdash/admin` → **Match Photos** → **crear** (o abre el draft del partido).
2. Completa equipos, resultado y fecha. El **Name** debe ser claro y único.
3. Sube las fotos en **Images** (JPG/PNG/WebP; si pesan mucho, el equipo las convierte
   a WebP con `pnpm images:webp`).
4. Elige la **Portada**. Marca **show_in_hero** solo si las fotos son destacadas.
5. **Publica** el draft (en borrador NO sale en `/fotos` ni en `/calendario`).

Regla de oro: **sin fotos no hay galería** — `/fotos` y `/calendario` solo muestran
partidos publicados **con fotos**.

## 2. Jugadores (`Jugadores`)

- **Name\***, **Slug** (ej. `diego-ramirez`; si lo dejas vacío lo genera el sistema).
- **Position**: Portero / Defensa / Centrocampista / Atacante.
- **Number**: dorsal. **Photo** + **Photo Alt** (descripción para accesibilidad).
- **Category**: pre / form-baja / form-alta / elite (debe coincidir con la categoría real).
- **Featured**: actívalo para que salga en “Jugadores destacados” de la portada.
- **Order**: orden de aparición. **Matches / Goals / Assists**: estadísticas.
- **Season**: temporada, ej. `2026/2027`.

## 3. Categorías (`Categories`)

- **Name\*** (ej. `Formativas Altas`), **Badge**, **Ages** (ej. `13–15 años`).
- **Copy** (frase corta), **Focus**, **Format**, **Schedule** (horarios), **Description** (texto largo).
- **CTA Href**: a dónde lleva el botón (normalmente `/inscribete`). **Order**: orden.
- **Item Slug**: identificador interno — **no cambiarlo** una vez creado.

## 4. Patrocinadores (`Sponsors`)

- **Name\***, **Logo** (SVG o WebP sobre fondo transparente, idealmente), **Alt**.
- **URL**: web del patrocinador. **Published**: debe estar activado para que se vea.

## 5. Hero (`Hero`)

- **Title\***, **Subtitle**, **Image** + **Image Alt**.
- **CTA Primary / CTA Secondary**: textos de los botones.
- **CTA Primary Href / CTA Secondary Href**: destinos (ej. `/inscribete`, `/categorias`).
- **Slides** (avanzado): no tocar sin ayuda técnica.

## 6. Cifras y pilares (`Stats Pillars`)

- **Label\*** (ej. `Jugadores formados`), **Value** (ej. `+350`), **Icon**, **Order**.

## 7. Galería general (`Gallery`)

Fotos sueltas que no son de un partido (instalaciones, entrenamientos).
Campos: **Title\***, **Image**, **Alt**, **Equipo ID** (normalmente vacío).

## Lo que NO puedes editar desde el admin (pide al equipo técnico)

- **Historia del club, entrenadores, próximos partidos del calendario y blog**:
  viven en archivos (`src/content/`) y los edita el equipo.
- **Preguntas frecuentes, tienda/productos y textos de “staff”**: están en el código.
  (Existen `staff`, `products` y `faqs` en la base de datos, pero **ninguna página
  los muestra todavía** y **no aparecen en el admin** — no los uses.)
- **La colección `partidos`**: es la versión antigua de `Match Photos`. No crear ni
  editar nada ahí; la canónica es **`Match Photos`**.

## Qué NO tocar nunca

1. Slugs, `Item Slug`, `Equipo ID`, campo `Partido` y `Slides`: son referencias internas.
2. Entradas publicadas de otros: duplica antes de experimentar.
3. `show_in_hero` en más de 3 partidos (el hero se vuelve lento y confuso).
4. Logos en formatos pesados (BMP/TIFF) o fotos sin `alt` descriptivo.
5. Nada fuera de las colecciones listadas arriba (ajustes, API keys, medios huérfanos).
