# pcfc-email-resend

Proveedor de email transaccional propio para EmDash (Punta Cana FC) vía
API HTTP de Resend. Habilita el magic link —y cualquier email del
sistema— en producción (Cloudflare Workers), donde el proveedor de
consola de desarrollo no existe.

## Por qué Resend por HTTPS

El hook `email:deliver` corre con el contexto del plugin (`ctx.http`,
`ctx.kv`, `ctx.log`): no recibe `env` ni acceso a los bindings de
Cloudflare, así que el binding `SEB` (Cloudflare Email Sending) no es
alcanzable desde un plugin. La salida es HTTPS (`network:request` +
`allowedHosts: ["api.resend.com"]`), que es además el ejemplo canónico
de la documentación oficial de EmDash para `email:deliver`.

## Configuración

1. Crea una API key en https://resend.com/api-keys (empieza con `re_`).
2. Verifica `puntacanafc.com` en Resend (Domains → Add Domain) para poder
   remitir `@puntacanafc.com`.
3. En el admin: ajustes del plugin `pcfc-email-resend` → pega la API key.
   Se guarda en D1 (`options`, clave
   `plugin:pcfc-email-resend:settings:apiKey`). Nunca va en código.
4. En Ajustes → Email selecciona `pcfc-email-resend` como transporte
   (o preselección vía SQL, ver abajo).

## Preselección vía SQL (sin entrar al admin)

```sql
INSERT INTO options (name, value) VALUES
  ('emdash:exclusive_hook:email:deliver', '"pcfc-email-resend"')
ON CONFLICT (name) DO UPDATE SET value = '"pcfc-email-resend"';
```

## Registro

Solo en la rama Cloudflare de `astro.config.mjs` (en dev local el
proveedor de consola basta y no hay secreto configurado).
