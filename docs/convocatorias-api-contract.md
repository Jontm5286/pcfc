# Contrato de API — Convocatorias (sistema externo → PCFC)

> Sistema externo **a medida**. Este documento define el contrato que el sistema
> externo debe exponer para que el sitio PCFC consuma las convocatorias.
> Al ser a medida, **este contrato es la fuente de verdad** para ambos lados.

## Endpoints

```
GET  /api/convocatorias                 → lista (filtrable por rango de fechas)
GET  /api/convocatorias?desde=&hasta=   → ISO 8601 (YYYY-MM-DD)
GET  /api/convocatorias/{id}            → una convocatoria por ID externo
```

- Respuesta: `application/json; charset=utf-8`
- Auth: `Authorization: Bearer <token>` (token compartido, rotable)
- Paginación: `?page=&limit=` (default limit 50) con `{ "data": [...], "meta": { "page", "limit", "total" } }`

## Payload

```json
{
  "id": "conv_00123",
  "actualizado_en": "2026-08-30T14:00:00-04:00",
  "partido": {
    "id": "match_0099",
    "fecha": "2026-08-29T10:30:00-04:00",
    "categoria": "Sub-10 (Benjamín)",
    "liga": "Liga Cantera",
    "tipo": "prueba",
    "estado": "finalizado",
    "rival": "Atletico CIbao",
    "condicion": "local",
    "marcador": { "favor": 3, "contra": 1 },
    "hora_partido": "10:30",
    "hora_cita": "09:45",
    "instalacion": { "nombre": "Complejo Punta Cana FC", "campo": "Campo 1" }
  },
  "equipacion": { "nombre": "Titular", "colores": "Azul Marino/Cielo PCFC" },
  "jugadores_citados": [
    { "dorsal": 9, "nombre": "Mateo Gómez", "posicion": "Delantero Centro" },
    { "dorsal": 8, "nombre": "Santiago Fernández", "posicion": "Mediocentro" }
  ],
  "material_obligatorio": [
    "Equipación oficial Titular (Azul Marino/Cielo PCFC)",
    "Espinilleras obligatorias",
    "Botas de fútbol reglamentarias",
    "Botella de agua personal"
  ]
}
```

## Enums (valores permitidos)

| Campo | Valores |
|---|---|
| `partido.tipo` | `prueba`, `amistoso`, `liga`, `copa` |
| `partido.estado` | `programado`, `finalizado`, `suspendido`, `aplazado` |
| `partido.condicion` | `local`, `visitante`, `neutral` |

## Reglas

1. **`id` externo es obligatorio y estable** — es la clave de upsert. Si cambia, se duplica.
2. **`actualizado_en` obligatorio** — permite sync incremental (`?desde_actualizacion=`).
3. `marcador` es `null` mientras `estado == "programado"`.
4. Fechas en **ISO 8601 con offset** (ej. `-04:00`). No enviar strings tipo "29 ago 2026".
5. `jugadores_citados` puede venir vacío ([]) si aún no se publicó la citación.
6. `dorsal` es number, no string.

## Cambios sugeridos (opcionales)

- `GET /api/convocatorias/{id}/pdf` → URL del acta oficial en PDF (para enlazar en la página).
- Campo `escudo_rival` (URL) → para mostrar el logo del rival en la web.
