import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { workspaceRoot } from "@asapp/database";
import { localDemo } from "@/lib/server";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}\.webp$/.test(id))
    return new Response(null, { status: 404 });
  try {
    let bytes: Uint8Array;
    if (localDemo())
      bytes = await readFile(
        path.join(workspaceRoot(), ".data", "artworks", id),
      );
    else {
      const client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } },
      );
      const { data, error } = await client.storage
        .from("artworks")
        .download(id);
      if (error || !data) return new Response(null, { status: 404 });
      bytes = new Uint8Array(await data.arrayBuffer());
    }
    return new Response(bytes as BodyInit, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public,max-age=31536000,immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
