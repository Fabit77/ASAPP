import QRCode from "qrcode";
import { currentUser, services, appOrigin } from "@/lib/server";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user) return new Response(null, { status: 401 });
  try {
    const { id } = await params;
    const methods = await (await services()).dropService.methods(user.id, id);
    const method = methods.find((m) => m.type === "QR" && m.active);
    if (!method?.code) return new Response(null, { status: 404 });
    const bytes = await QRCode.toBuffer(appOrigin() + "/claim/" + method.code, {
      width: 1080,
      margin: 4,
      color: { dark: "#193D32" },
    });
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": 'attachment; filename="asapp-qr.png"',
        "Cache-Control": "private,no-store",
      },
    });
  } catch {
    return new Response(null, { status: 403 });
  }
}
