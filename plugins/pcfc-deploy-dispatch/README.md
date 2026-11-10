# pcfc-deploy-dispatch

Dispara el deploy a Cloudflare vía GitHub Actions cuando se **publica**
contenido en EmDash. Solo escucha `content:afterPublish`: los borradores
nunca disparan deploy, y un fallo de GitHub nunca rompe el guardado
(try/catch total + solo `ctx.log.warn`, sin `throw`).

## Flujo

1. Editor publica en `/_emdash/admin/` → hook `content:afterPublish`.
2. El plugin hace `POST https://api.github.com/repos/Jontm5286/pcfc/dispatches`
   con `{ "event_type": "emdash-publish" }` y `Authorization: Bearer <token>`.
3. `.github/workflows/deploy.yml` escucha `repository_dispatch[emdash-publish]`
   y corre `build:cf` + `wrangler deploy`.

## Token (nunca en código)

Orden de resolución en `src/dispatch.ts`:

1. `process.env.GITHUB_DEPLOY_TOKEN` — secreto wrangler `GITHUB_DEPLOY_TOKEN`
   en prod (lo configura el dueño con `wrangler secret put GITHUB_DEPLOY_TOKEN`;
   con `nodejs_compat` está disponible en runtime).
2. Fallback: campo secreto `githubToken` en los settings del plugin (admin,
   cifrado en D1).

Sin token el hook solo registra un warning y no hace nada (en dev local no
hay token, así que editar contenido en `localhost:4321` jamás dispara deploys).

## Secrets que faltan (configurar fuera del repo)

| Dónde | Nombre | Cómo conseguirlo |
|---|---|---|
| GitHub repo → Settings → Secrets → Actions | `CLOUDFLARE_API_TOKEN` | Dash Cloudflare → My Profile → API Tokens → Create (plantilla Edit Cloudflare Workers o custom con permisos Workers + D1 + R2 sobre la cuenta/zona) |
| GitHub repo → Settings → Secrets → Actions | `CLOUDFLARE_ACCOUNT_ID` | Dash Cloudflare → Workers → Overview → Account ID (lateral derecho) |
| Prod (wrangler, lo pone el dueño) | `GITHUB_DEPLOY_TOKEN` | GitHub → Settings → Developer settings → Personal access tokens (classic) con scope `repo` — o fine-grained con permiso Actions:write sobre `Jontm5286/pcfc`. Luego `wrangler secret put GITHUB_DEPLOY_TOKEN` |
