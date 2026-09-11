import { PageHeading } from "@asapp/ui";
import { studioContext } from "@/lib/server";
import { organizationSettingsAction } from "@/lib/actions";
import { CreateOrganization } from "@/components/studio";
import { ActionForm, Submit } from "@/components/forms";
export default async function Organization() {
  const { org } = await studioContext();
  return (
    <>
      <PageHeading
        title="Detrás de cada encuentro."
        description="Dale identidad a tu organización."
      />
      {org && ["OWNER", "ADMIN"].includes(org.role ?? "") && (
        <div className="panel narrow" style={{ marginBottom: 40 }}>
          <ActionForm action={organizationSettingsAction}>
            <input type="hidden" name="organizationId" value={org.id} />
            <label>
              Nombre
              <input
                name="name"
                defaultValue={org.name}
                required
                maxLength={100}
              />
            </label>
            <label>
              Descripción
              <textarea
                name="description"
                defaultValue={org.description}
                maxLength={2000}
              />
            </label>
            <Submit>Guardar cambios</Submit>
          </ActionForm>
        </div>
      )}
      <CreateOrganization />
    </>
  );
}
