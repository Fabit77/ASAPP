import Link from "next/link";
import { Artwork, Badge, formatDate } from "@asapp/ui";
import type { Drop } from "@asapp/core";
import { organizationAction } from "@/lib/actions";
import { ActionForm, Submit } from "./forms";
export const statusLabel = (drop: Drop) =>
  drop.claims_paused
    ? "Pausado"
    : {
        DRAFT: "Borrador",
        PUBLISHED: "Publicado",
        ENDED: "Finalizado",
        ARCHIVED: "Archivado",
      }[drop.status];
export function CreateOrganization() {
  return (
    <section className="narrow">
      <h2>Una mesa empieza contigo.</h2>
      <p className="description">
        Crea tu organización para compartir asados y reunir sus recuerdos.
      </p>
      <div className="panel">
        <ActionForm action={organizationAction}>
          <label>
            Nombre de la organización
            <input
              name="name"
              placeholder="Convidados"
              minLength={2}
              maxLength={100}
              required
            />
          </label>
          <label>
            Cuéntanos de qué se trata
            <textarea name="description" maxLength={2000} />
          </label>
          <Submit>Crear organización</Submit>
        </ActionForm>
      </div>
    </section>
  );
}
export function DropTable({ drops }: { drops: Drop[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Asado</th>
            <th>Estado</th>
            <th>Coleccionados</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {drops.map((d) => (
            <tr key={d.id}>
              <td>
                <Link className="table-drop" href={"/studio/drops/" + d.id}>
                  <Artwork src={d.artwork_url} title={d.title} size="small" />
                  <span>
                    {d.title}
                    <small>{d.collection_name ?? "Sin colección"}</small>
                  </span>
                </Link>
              </td>
              <td>
                <Badge>{statusLabel(d)}</Badge>
              </td>
              <td>
                {d.claim_count}
                {d.max_supply ? " / " + d.max_supply : ""}
              </td>
              <td>{formatDate(d.date)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function Stats({
  drops,
  claims,
  collectors,
  month,
}: {
  drops: number;
  claims: number;
  collectors: number;
  month: number;
}) {
  return (
    <div className="stats-grid">
      {[
        ["Asados creados", drops],
        ["Recuerdos coleccionados", claims],
        ["Coleccionistas únicos", collectors],
        ["Coleccionados este mes", month],
      ].map(([label, value], index) => (
        <div className="stat" key={label}>
          <span className="stat-index">0{index + 1}</span>
          <p>{label}</p>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}
