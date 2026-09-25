## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

### Quality Tools (Agregado 2026-09-08)

El proyecto ahora incluye herramientas de calidad de código:

```bash
pnpm lint          # Verificar código con ESLint
pnpm lint:fix      # Auto-corregir problemas
pnpm format        # Formatear código con Prettier
pnpm format:check  # Verificar formato sin modificar
pnpm check         # Verificar tipos con astro check
```

### Seguridad

El proyecto incluye middleware de seguridad (`src/middleware.ts`) que agrega:
- Content Security Policy (CSP) headers
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy
- Permissions-Policy

### Accesibilidad

Skip link activado en `src/layouts/Base.astro`. Los usuarios pueden navegar con Tab para ver el enlace "Saltar al contenido".

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Project Status

**Puntuación de calidad: 8.2/10** (evaluado 2026-09-08)

Ver `evaluacion-proyecto.md` para detalles completos.
Ver `CHANGELOG.md` para historial de cambios.
