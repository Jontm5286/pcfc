# Formulario nuevos patrocinadores — spec (2026-09-28)

## Respuestas Ronda 1 (verbatim)
1. Campos: "Básico" = marca, persona contacto, email, teléfono, mensaje.
2. Destino: "Email del club".
3. Ubicación: "Página nueva /patrocinadores".

## Respuestas Ronda 2 (verbatim)
4. Correo destino: "marketing@" (dominio asumido: marketing@puntacanafc.com — POR CONFIRMAR).
5. Confirmación: "redactalo" (la redacto yo, pendiente aprobación del copy).

## Hallazgos recon (read-only, 2026-09-28)
- Ya existe `src/pages/sponsors.astro` (ruta /sponsors, "Nuestros Patrocinadores") con grid de sponsors + CTA "Ser patrocinador" → apunta a /inscribete.
- `inscribete.astro` tiene form con clases `form-input/form-label/form-group/form-row-2` pero SIN handler de envío (no `<script>`, no `action`): es maqueta, no envía nada.
- No hay endpoint de email en el proyecto (solo `src/pages/api/foto-descarga.ts`). Enviar a marketing@ requiere: (a) `mailto:` v1, o (b) servicio externo (FormSubmit/Formspree), o (c) API + SMTP/Resend.
- Contraste obligatorio: texto pequeño sobre claro = navy/navy-60, nunca blanco ni sky.

## Respuestas Ronda 3 (verbatim)
- Ubicación: "Sección en /sponsors existente" (el CTA 'Ser patrocinador' apuntará a /sponsors#contacto).
- Envío: "Email Service de cloudflare" (Other: servicio de email de Cloudflare — outbound desde el Worker; evaluar MailChannels vs Resend en build).

## Copy propuesto (pendiente aprobación del usuario)
- Eyebrow: "Alianzas" / H2: "¿Tu marca aquí?"
- Lede: "Únete a las marcas que impulsan el fútbol formativo en el Caribe. Completa el formulario y el equipo de alianzas te contactará en menos de 48 horas laborables."
- Campos: Nombre de la marca* | Persona de contacto* | Correo electrónico* | Teléfono* | Mensaje* ("Cuéntanos de tu marca y qué tipo de alianza buscas") + checkbox términos.
- Submit: "Enviar solicitud".
- Éxito: "¡Solicitud recibida! Gracias por tu interés en apoyar a Punta Cana FC. Te contactaremos en menos de 48 horas laborables."
- Destino asumido: marketing@puntacanafc.com (dominio POR CONFIRMAR).
