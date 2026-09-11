import Link from "next/link";
import Image from "next/image";
import QRCode from "qrcode";
import { PageHeading, Artwork, Badge, formatDate } from "@asapp/ui";
import { requireUser, services, appOrigin } from "@/lib/server";
import { manageDropAction } from "@/lib/actions";
import { ActionForm, Submit, CopyButton } from "@/components/forms";
import { statusLabel } from "@/components/studio";
export default async function DropAdmin({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser("/studio");
  const svc = await services();
  const drop = await svc.dropService.admin(user.id, id);
  const role = await svc.organizationService.permission(
    user.id,
    drop.organization_id,
  );
  const editable = role !== "VIEWER";
  const methods = editable ? await svc.dropService.methods(user.id, id) : [];
  const qr = methods.find((m) => m.type === "QR" && m.active);
  const claimUrl = qr?.code ? appOrigin() + "/claim/" + qr.code : null;
  const collectors = ["OWNER", "ADMIN"].includes(role)
    ? (
        await svc.analyticsService.collectors(user.id, drop.organization_id)
      ).filter((c) => c.drop_ids.includes(drop.id))
    : [];
  return (
    <>
      <PageHeading
        eyebrow={drop.organization_name}
        title={drop.title}
        description={`${formatDate(drop.date)} · ${drop.venue_name ?? ""} · ${drop.city ?? ""}`}
        action={
          editable ? (
            <Link
              className="button button-secondary"
              href={"/studio/drops/" + id + "/edit"}
            >
              Editar asado
            </Link>
          ) : undefined
        }
      />
      <div className="studio-two">
        <div>
          <div className="panel">
            <div className="admin-art">
              <Artwork src={drop.artwork_url} title={drop.title} />
            </div>
            <div style={{ marginTop: 22 }}>
              <Badge>{statusLabel(drop)}</Badge>
            </div>
            <h2 style={{ marginTop: 20 }}>
              {drop.claim_count}
              {drop.max_supply ? " / " + drop.max_supply : ""} coleccionados
            </h2>
            <p className="description">{drop.description}</p>
            <p className="fineprint">
              {drop.collection_name ?? "Sin colección"} ·{" "}
              {drop.visibility === "PUBLIC"
                ? "Público"
                : drop.visibility === "PRIVATE"
                  ? "Privado"
                  : "No listado"}
            </p>
            {editable && (
              <ActionForm action={manageDropAction} className="form-stack">
                <input type="hidden" name="id" value={id} />
                <div className="inline-actions" style={{ marginTop: 20 }}>
                  <Submit
                    name="operation"
                    value={drop.claims_paused ? "resume" : "pause"}
                    secondary
                  >
                    {drop.claims_paused
                      ? "Reanudar reclamos"
                      : "Pausar reclamos"}
                  </Submit>
                  {drop.status === "DRAFT" && (
                    <Submit name="operation" value="publish">
                      Publicar
                    </Submit>
                  )}
                  <Submit name="operation" value="duplicate" secondary>
                    Duplicar
                  </Submit>
                  {drop.status !== "ARCHIVED" && (
                    <Submit name="operation" value="archive" secondary>
                      Archivar
                    </Submit>
                  )}
                </div>
              </ActionForm>
            )}
          </div>
        </div>
        <div className="panel qr-panel">
          <h2>Invita a coleccionar.</h2>
          <p className="description">
            Muéstralo en la mesa. Cada invitado guarda su propio recuerdo.
          </p>
          {claimUrl ? (
            <>
              <Image
                className="qr-image"
                src={await QRCode.toDataURL(claimUrl, {
                  width: 500,
                  margin: 3,
                  color: { dark: "#24483c" },
                })}
                width={500}
                height={500}
                alt="Código QR para coleccionar este asado"
                unoptimized
              />
              {drop.status !== "PUBLISHED" && (
                <p className="notice">
                  El QR se activará al publicar este asado.
                </p>
              )}
              <div className="button-row" style={{ justifyContent: "center" }}>
                <a className="button" href={"/api/qr/" + id} download>
                  Descargar QR
                </a>
                <CopyButton value={claimUrl} />
              </div>
              <Link
                className="text-link"
                style={{ marginTop: 20 }}
                href={"/claim/" + qr!.code}
              >
                Abrir página de reclamo ↗
              </Link>
            </>
          ) : (
            <p className="notice">
              {editable
                ? "Activa QR desde Editar asado."
                : "Los métodos de reclamo solo están disponibles para editores y administradores."}
            </p>
          )}
          {methods.some((m) => m.type === "SECRET_WORD" && m.active) && (
            <div className="related-collection">
              <h3>Palabra del asado activa</h3>
              <p>La palabra está protegida. Puedes reemplazarla al editar.</p>
              <Link className="text-link" href={"/claim/secret/" + drop.slug}>
                Abrir reclamo con palabra ↗
              </Link>
            </div>
          )}
        </div>
      </div>
      {["OWNER", "ADMIN"].includes(role) && (
        <>
          <div className="section-heading">
            <h2>Quienes estuvieron ahí</h2>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {collectors.map((c) => (
                  <tr key={c.id}>
                    <td>{c.display_name}</td>
                    <td>{c.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!collectors.length && (
              <p className="notice">Todavía no hay participantes.</p>
            )}
          </div>
        </>
      )}
    </>
  );
}
