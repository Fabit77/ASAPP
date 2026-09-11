import { PageHeading, Badge } from "@asapp/ui";
import { studioContext } from "@/lib/server";
import { teamAction } from "@/lib/actions";
import { CreateOrganization } from "@/components/studio";
import { ActionForm, Submit } from "@/components/forms";
export default async function Team() {
  const { user, org, svc } = await studioContext();
  if (!org) return <CreateOrganization />;
  if (!["OWNER", "ADMIN"].includes(org.role ?? ""))
    return (
      <p className="notice">
        La gestión del equipo está reservada a administradores.
      </p>
    );
  const members = await svc.organizationService.team(user.id, org.id);
  return (
    <>
      <PageHeading
        title="La gente detrás de la mesa."
        description="Comparte la organización de tus encuentros."
      />
      <div className="studio-two">
        <div className="panel">
          {members.map((m) => (
            <div className="team-member" key={m.id}>
              <div>
                <strong>{m.display_name}</strong>
                <p className="fineprint">{m.email}</p>
              </div>
              <Badge>
                {
                  {
                    OWNER: "Propietario",
                    ADMIN: "Administrador",
                    EDITOR: "Editor",
                    VIEWER: "Lector",
                  }[m.role]
                }
              </Badge>
            </div>
          ))}
        </div>
        {org.role === "OWNER" && (
          <div className="panel">
            <h3 style={{ marginBottom: 20 }}>Agregar o cambiar permisos</h3>
            <ActionForm action={teamAction}>
              <input type="hidden" name="organizationId" value={org.id} />
              <label>
                Email de una cuenta existente
                <input type="email" name="email" required />
              </label>
              <label>
                Rol
                <select name="role">
                  <option value="EDITOR">Editor · asados y colecciones</option>
                  <option value="ADMIN">
                    Administrador · acceso a participantes
                  </option>
                  <option value="VIEWER">
                    Lector · resumen y estadísticas
                  </option>
                </select>
              </label>
              <Submit>Guardar permisos</Submit>
              <p className="fineprint">
                La persona debe registrarse en ASAPP primero. No se envía una
                invitación por email.
              </p>
            </ActionForm>
          </div>
        )}
      </div>
    </>
  );
}
