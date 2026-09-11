import { PageHeading } from "@asapp/ui";
import { studioContext } from "@/lib/server";
import { CreateOrganization } from "@/components/studio";
import { DropEditor } from "@/components/drop-editor";
export default async function NewDrop() {
  const { user, org, svc } = await studioContext();
  if (!org) return <CreateOrganization />;
  await svc.organizationService.permission(user.id, org.id, [
    "OWNER",
    "ADMIN",
    "EDITOR",
  ]);
  const collections = await svc.collectionService.list(org.id, user.id);
  return (
    <>
      <PageHeading
        title="Un asado para recordar."
        description="Tú pones la mesa. Nosotros guardamos la historia."
      />
      <DropEditor
        organizationId={org.id}
        organizationName={org.name}
        collections={collections}
      />
    </>
  );
}
