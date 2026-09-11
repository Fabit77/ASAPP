import { PageHeading } from "@asapp/ui";
import { requireUser, services } from "@/lib/server";
import { DropEditor } from "@/components/drop-editor";
export default async function EditDrop({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser("/studio");
  const svc = await services();
  const { id } = await params;
  const drop = await svc.dropService.admin(user.id, id);
  const methods = await svc.dropService.methods(user.id, id);
  const collections = await svc.collectionService.list(
    drop.organization_id,
    user.id,
  );
  return (
    <>
      <PageHeading
        title="Editar asado"
        description="Los detalles que hacen al recuerdo."
      />
      <DropEditor
        organizationId={drop.organization_id}
        organizationName={drop.organization_name ?? ""}
        collections={collections}
        drop={drop}
        qrEnabled={methods.some((m) => m.type === "QR" && m.active)}
        hasSecret={methods.some((m) => m.type === "SECRET_WORD" && m.active)}
      />
    </>
  );
}
