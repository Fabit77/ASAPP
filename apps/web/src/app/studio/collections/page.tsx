import { PageHeading } from "@asapp/ui";
import { studioContext } from "@/lib/server";
import { saveCollectionAction } from "@/lib/actions";
import { CreateOrganization } from "@/components/studio";
import { ActionForm, Submit } from "@/components/forms";
import { CollectionOrder } from "@/components/collection-order";
export default async function Collections() {
  const { user, org, svc } = await studioContext();
  if (!org) return <CreateOrganization />;
  const [collections, drops] = await Promise.all([
    svc.collectionService.list(org.id, user.id),
    svc.dropService.list(user.id, org.id),
  ]);
  const editable = org.role !== "VIEWER";
  return (
    <>
      <PageHeading
        title="Historias que se completan."
        description="Agrupa encuentros que son parte de una misma colección."
      />
      <div className="studio-two">
        <div className="form-stack">
          {collections.map((c) => (
            <div className="panel" key={c.id}>
              <ActionForm action={saveCollectionAction}>
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="organizationId" value={org.id} />
                <label>
                  Nombre
                  <input
                    name="name"
                    defaultValue={c.name}
                    required
                    readOnly={!editable}
                  />
                </label>
                <label>
                  Descripción
                  <textarea
                    name="description"
                    defaultValue={c.description}
                    readOnly={!editable}
                  />
                </label>
                <p className="fineprint">
                  {drops.filter((d) => d.collection_id === c.id).length} asados
                </p>
                <CollectionOrder
                  drops={drops
                    .filter((d) => d.collection_id === c.id)
                    .sort((a, b) => a.position - b.position)}
                  editable={editable}
                />
                {editable && <Submit>Guardar colección</Submit>}
              </ActionForm>
            </div>
          ))}
          {!collections.length && (
            <p className="notice">Tus colecciones aparecerán aquí.</p>
          )}
        </div>
        {editable && (
          <div className="panel">
            <h2 style={{ fontSize: 24, marginBottom: 25 }}>Crear colección</h2>
            <ActionForm action={saveCollectionAction}>
              <input type="hidden" name="organizationId" value={org.id} />
              <label>
                Nombre
                <input
                  name="name"
                  placeholder="Convidados — Temporada 02"
                  minLength={2}
                  maxLength={100}
                  required
                />
              </label>
              <label>
                Descripción
                <textarea name="description" maxLength={2000} />
              </label>
              <Submit>Crear colección</Submit>
            </ActionForm>
          </div>
        )}
      </div>
    </>
  );
}
