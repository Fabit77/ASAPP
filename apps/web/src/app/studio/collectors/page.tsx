import { PageHeading, formatDate } from "@asapp/ui";
import { studioContext } from "@/lib/server";
import { CreateOrganization } from "@/components/studio";
export default async function Collectors({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { user, org, svc } = await studioContext();
  if (!org) return <CreateOrganization />;
  if (!["OWNER", "ADMIN"].includes(org.role ?? ""))
    return (
      <p className="notice">
        Los datos de participantes solo están disponibles para administradores
        de la organización.
      </p>
    );
  const q = (await searchParams).q ?? "";
  const collectors = await svc.analyticsService.collectors(user.id, org.id, q);
  return (
    <>
      <PageHeading
        title="Tu comunidad."
        description="Las personas que estuvieron en tus asados."
      />
      <form className="button-row" style={{ marginBottom: 25 }}>
        <input
          style={{ maxWidth: 360 }}
          aria-label="Buscar coleccionista"
          name="q"
          placeholder="Buscar por nombre o email"
          defaultValue={q}
        />
        <button className="button button-secondary">Buscar</button>
      </form>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Asados</th>
              <th>Último recuerdo</th>
            </tr>
          </thead>
          <tbody>
            {collectors.map((c) => (
              <tr key={c.id}>
                <td>
                  <details>
                    <summary>{c.display_name ?? "Coleccionista"}</summary>
                    <p>{c.drop_titles}</p>
                  </details>
                </td>
                <td>{c.email}</td>
                <td>{c.drop_count}</td>
                <td>{formatDate(c.last_claim)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!collectors.length && (
          <p className="notice">No encontramos participantes con esos datos.</p>
        )}
      </div>
      <p className="fineprint" style={{ marginTop: 20 }}>
        Solo se muestran los asados de {org.name}. Abre un nombre para ver sus
        recuerdos compartidos contigo.
      </p>
    </>
  );
}
