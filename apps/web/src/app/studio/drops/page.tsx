import { PageHeading, ButtonLink, Empty } from "@asapp/ui";
import { studioContext } from "@/lib/server";
import { CreateOrganization, DropTable } from "@/components/studio";
export default async function Drops() {
  const { user, org, svc } = await studioContext();
  if (!org) return <CreateOrganization />;
  const drops = await svc.dropService.list(user.id, org.id);
  return (
    <>
      <PageHeading
        title="Tus asados"
        description="Cada encuentro merece su propio recuerdo."
        action={
          org.role !== "VIEWER" ? (
            <ButtonLink href="/studio/drops/new">Crear un asado</ButtonLink>
          ) : undefined
        }
      />
      {drops.length ? (
        <DropTable drops={drops} />
      ) : (
        <Empty
          title="Todavía no creaste ningún asado."
          href="/studio/drops/new"
          cta="Crear primer asado"
        />
      )}
    </>
  );
}
