import { PageHeading } from "@asapp/ui";
import { studioContext } from "@/lib/server";
import { CreateOrganization, DropTable, Stats } from "@/components/studio";
export default async function Analytics() {
  const { user, org, svc } = await studioContext();
  if (!org) return <CreateOrganization />;
  const data = await svc.analyticsService.summary(user.id, org.id);
  const timeline = data.timeline.slice(-12);
  const max = Math.max(...timeline.map((t) => t.count), 1);
  return (
    <>
      <PageHeading
        title="Tu mesa sigue creciendo."
        description="Una mirada a los recuerdos que compartiste."
      />
      <Stats {...data} drops={data.drops.length} />
      <div className="studio-two">
        <div className="panel">
          <h3>Recuerdos a lo largo del tiempo</h3>
          {timeline.length ? (
            <div
              className="chart"
              role="img"
              aria-label={timeline
                .map((t) => `${t.day}: ${t.count} recuerdos`)
                .join("; ")}
            >
              {timeline.map((t) => (
                <div
                  key={t.day}
                  className="chart-bar"
                  title={t.day + ": " + t.count}
                  style={{ height: `${(t.count / max) * 100}%` }}
                >
                  <span>{t.day.slice(5)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="description">
              Las primeras historias están por llegar.
            </p>
          )}
          <p className="fineprint">
            Coleccionados por día · últimos {timeline.length} días con
            actividad.
          </p>
        </div>
        <div className="panel">
          <h3>Colecciones completas</h3>
          {data.completion.map((c) => (
            <div className="team-member" key={c.name}>
              <span>{c.name}</span>
              <strong>{c.completed}</strong>
            </div>
          ))}
          <p className="fineprint" style={{ marginTop: 18 }}>
            Personas que coleccionaron todos los asados de cada colección.
          </p>
        </div>
      </div>
      <div className="section-heading">
        <h2>Los más coleccionados</h2>
      </div>
      <DropTable
        drops={[...data.drops].sort((a, b) => b.claim_count - a.claim_count)}
      />
    </>
  );
}
