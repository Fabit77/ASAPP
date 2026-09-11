import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";
import { workspaceRoot } from "@asapp/database";
import { currentUser, services, localDemo, appOrigin } from "@/lib/server";
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user)
    return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  if (
    request.headers.get("origin") !== appOrigin() &&
    !(
      localDemo() &&
      ["http://127.0.0.1:3000", "http://localhost:3000"].includes(
        request.headers.get("origin") ?? "",
      )
    )
  )
    return NextResponse.json(
      { error: "Origen no permitido." },
      { status: 403 },
    );
  try {
    if (Number(request.headers.get("content-length") ?? 0) > 6 * 1024 * 1024)
      throw new Error("La imagen debe pesar menos de 5 MB.");
    const f = await request.formData();
    await (
      await services()
    ).organizationService.permission(user.id, String(f.get("organizationId")), [
      "OWNER",
      "ADMIN",
      "EDITOR",
    ]);
    const file = f.get("file");
    if (
      !(file instanceof File) ||
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    )
      throw new Error("Usa JPG, PNG o WebP de hasta 5 MB.");
    const input = Buffer.from(await file.arrayBuffer());
    const pipeline = sharp(input, { limitInputPixels: 25000000 });
    const metadata = await pipeline.metadata();
    if (
      !metadata.width ||
      !metadata.height ||
      metadata.width !== metadata.height
    )
      throw new Error("Elige una imagen cuadrada. Recomendamos 1080 × 1080.");
    const bytes = await pipeline
      .resize(1080, 1080, { withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
    const key = randomUUID() + ".webp";
    if (localDemo()) {
      const dir = path.join(workspaceRoot(), ".data", "artworks");
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, key), bytes);
    } else {
      const client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } },
      );
      const { error } = await client.storage
        .from("artworks")
        .upload(key, bytes, { contentType: "image/webp" });
      if (error)
        throw new Error(
          "No pudimos subir la imagen. Revisa la configuración de Storage.",
        );
    }
    return NextResponse.json({ url: "/api/artwork/" + key });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo subir la imagen." },
      { status: 400 },
    );
  }
}
