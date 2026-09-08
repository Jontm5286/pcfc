import type { APIRoute } from "astro";
import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const alt = (formData.get("alt") as string) || "Foto PCFC";

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), { status: 400 });
    }

    const galleryDir = path.resolve("public/images/gallery");
    if (!fs.existsSync(galleryDir)) fs.mkdirSync(galleryDir, { recursive: true });

    const ext = path.extname(file.name) || ".jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const filePath = path.join(galleryDir, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    const db = new Database("data.db");
    const id = `${Date.now()}${Math.random().toString(36).slice(2, 10)}`;
    const slug = filename.replace(/\.[^.]+$/, "");

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
