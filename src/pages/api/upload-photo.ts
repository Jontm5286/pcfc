import type { APIRoute } from "astro";
import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

/**
 * PCFC — Upload Photo API
 * Endpoint para subir fotos a la galería.
 * Seguridad: validación de tipo, tamaño y sanitización de filename.
 */

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

// Sanitizar nombre de archivo: solo letras, números, guiones
const sanitizeFilename = (filename: string): string => {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const alt = (formData.get("alt") as string) || "Foto PCFC";

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), { status: 400 });
    }

    // Validar tipo de archivo
    if (!ALLOWED_TYPES.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(", ")}` }),
        { status: 400 }
      );
    }

    // Validar tamaño
    if (file.size > MAX_SIZE) {
      return new Response(
        JSON.stringify({ error: `File too large. Max size: ${MAX_SIZE / 1024 / 1024}MB` }),
        { status: 400 }
      );
    }

    const galleryDir = path.resolve("public/images/gallery");
    if (!fs.existsSync(galleryDir)) fs.mkdirSync(galleryDir, { recursive: true });

    const ext = path.extname(file.name) || ".jpg";
    const sanitized = sanitizeFilename(path.basename(file.name, ext));
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const filePath = path.join(galleryDir, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    const db = new Database("data.db");
    const id = `${Date.now()}${Math.random().toString(36).slice(2, 10)}`;
    const slug = `${sanitized || "photo"}-${Date.now()}`;

    db.prepare(`
      INSERT INTO ec_gallery (id, slug, status, src, alt, "order", created_at, updated_at)
      VALUES (?, ?, 'published', ?, ?, 99, datetime('now'), datetime('now'))
    `).run(id, slug, `/images/gallery/${filename}`, alt);

    db.close();

    return new Response(JSON.stringify({ success: true, filename, path: `/images/gallery/${filename}` }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[upload-photo] Error:", err);
    return new Response(JSON.stringify({ error: "Upload failed" }), { status: 500 });
  }
};
