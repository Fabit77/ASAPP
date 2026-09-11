import { randomUUID } from "node:crypto";
import QRCode from "qrcode";
import { getDatabase, isLocalDemo } from "../packages/database/src/index";
import { createServices } from "../packages/core/src/index";
import { DEMO_OWNER, DEMO_NEW } from "../packages/database/src/seed";
async function main() {
  if (!isLocalDemo())
    throw new Error(
      "Development tools only work with the isolated local database.",
    );
  const svc = createServices(await getDatabase());
  const [command, arg] = process.argv.slice(2);
  if (command === "user")
    console.log(
      await svc.userService.syncUser({
        id: randomUUID(),
        email: arg ?? "test-" + Date.now() + "@asapp.example",
      }),
    );
  else if (command === "organization")
    console.log(
      await svc.organizationService.create(DEMO_OWNER, {
        name: arg ?? "Nueva mesa",
        description: "Organización de prueba",
      }),
    );
  else if (command === "drop") {
    const org = (await svc.organizationService.list(DEMO_OWNER))[0];
    console.log(
      await svc.dropService.createDrop(DEMO_OWNER, {
        organizationId: org.id,
        title: arg ?? "Asado de prueba",
        description: "Creado con las herramientas locales.",
        artworkUrl: "/artworks/1.svg",
        date: "2026-09-11",
        startDateTime: "2026-09-11T18:00:00Z",
        maxSupply: 17,
        visibility: "PUBLIC",
        status: "PUBLISHED",
        qr: true,
      }),
    );
  } else if (command === "qr") {
    if (!arg) throw new Error("Provide a drop ID.");
    const methods = await svc.dropService.methods(DEMO_OWNER, arg);
    const code = methods.find((m) => m.type === "QR")?.code;
    if (!code) throw new Error("No QR method");
    console.log(
      await QRCode.toString(
        (process.env.APP_URL ?? "http://localhost:3000") + "/claim/" + code,
        { type: "terminal" },
      ),
    );
  } else if (command === "claim") {
    if (!arg) throw new Error("Provide a QR code.");
    console.log(
      await svc.claimService.claimDrop(DEMO_NEW, { type: "QR", code: arg }),
    );
  } else
    console.log(
      "Commands: user [email], organization [name], drop [title], qr <drop-id>, claim <code>.",
    );
}
main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
