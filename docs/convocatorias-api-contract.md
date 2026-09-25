# Contrato de API — FutbolPro Academy → PCFC

> Feed público de la app de gestión. Sin auth, CORS abierto.
> Solo expone datos aptos para publicar. Este contrato es la fuente de verdad.

## Endpoints

```
GET https://futbolpro-academy.johantavarez89.workers.dev/api/public/matches
GET http://localhost:3001/api/public/matches   (app en local)
```

- Respuesta: `application/json` → `{ upcoming[], played[] }`
- `upcoming` = convocadas futuras · `played` = jugadas (máx. 20)
- En prod la tabla existe y está vacía: el feed se llena al crear
  convocatorias reales en la app de producción (no mocks).

## Partido

```json
{
  "id": "call-1",
  "title": "Jornada 12 - Punta Cana FC vs Atlántico FC",
  "category": "Sub-10 (Benjamín)",
  "opponent": "Atlántico FC Cantera",
  "opponentLogo": "https://.../escudo.png",
  "matchType": "Liga Cantera",
  "matchDate": "2026-08-29",
  "matchTime": "10:30",
  "meetingTime": "09:45",
  "location": "Complejo Deportivo PCFC · Cancha Principal",
  "isHome": true,
  "status": "jugada",
  "result": { "home": 3, "away": 1 }
}
```

| Campo | Notas |
|---|---|
| `category` | Nombres de la app (`Sub-10 (Benjamín)`, `Femenino Juvenil`, …). El agrupado a niveles web (`pre`/`form-baja`/`form-alta`/`elite`) lo hace PCFC (`academyCategoryToWeb`). |
| `matchDate` | `YYYY-MM-DD` |
| `result` | `null` mientras no hay marcador |
| fotos | Sin campo — la galería es de PCFC (ver abajo) |

## Reglas lado PCFC

1. **Galería es nuestra** — por cada fecha jugada, `pnpm sync:match-photos`
   crea un draft (`published: false`, sin fotos) en `src/content/match_photos/`.
   Sin fotos no hay galería: `/fotos` y `/calendario` solo enlazan entradas
   publicadas con fotos (`/fotos#<slug>`).
2. **Slug determinista** — `pcfc-<equipo>-vs-<rival>-<DDmmm>`
   (ej. `pcfc-sub-10-vs-atlantico-fc-cantera-29ago`).
   Algoritmo en `src/lib/match-photos.ts` (¡mantener igual en el script!).
3. **Fallback local** — si el feed falla o viene vacío, calendario y marquee
   usan datos locales. Variable: `PUBLIC_ACADEMY_API_URL` (default = prod).
