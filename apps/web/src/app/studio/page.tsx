import { PageHeading, ButtonLink, Empty, formatDate } from "@asapp/ui";
import { studioContext } from "@/lib/server";
import { CreateOrganization, DropTable, Stats } from "@/components/studio";
export default async function Studio() {
  const { user, org, svc } = await studioContext();
  if (!org) return <CreateOrganization />;
  const summary = await svc.analyticsService.summary(user.id, org.id);
  return (
    <>
      <PageHeading
        eyebrow={org.name + " · Tu mesa, tu comunidad"}
        title={"Hola, " + (user.display_name ?? "anfitrión") + "."}
        description="Los encuentros que creaste, las historias que quedan."
        action={
          org.role !== "VIEWER" ? (
            <ButtonLink href="/studio/drops/new">Crear un asado</ButtonLink>
          ) : undefined
        }
      />
      <Stats {...summary} drops={summary.drops.length} />
      <div className="section-heading">
        <h2>Tus últimos asados</h2>
      </div>
      {summary.drops.length ? (
        <DropTable drops={summary.drops.slice(0, 5)} />
      ) : (
        <Empty
          title="Todavía no creaste ningún asado."
          description="Dale un lugar en la historia a tu próximo encuentro."
          href="/studio/drops/new"
          cta="Crear primer asado"
        />
      )}
      <div className="section-heading">
        <h2>Lo que está pasando</h2>
      </div>
      <div className="panel">
        {summary.recent.length ? (
          summary.recent.map((r, i) => (
            <div className="activity" key={i}>
              <span className="mini-avatar">{r.display_name?.charAt(0)}</span>
              <div>
                <strong>{r.display_name ?? "Coleccionista"}</strong> coleccionó{" "}
                {r.title}
                <p>{formatDate(r.claimed_at)}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="muted">
            Cuando alguien coleccione tu asado, aparecerá aquí.
          </p>
        )}
      </div>
    </>
  );
}
