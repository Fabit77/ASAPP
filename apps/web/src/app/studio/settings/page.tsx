import Link from "next/link";
import { PageHeading } from "@asapp/ui";
import { studioContext } from "@/lib/server";
export default async function Settings() {
  const { org } = await studioContext();
  return (
    <>
      <PageHeading
        title="Todo en su lugar."
        description="Administra tu cuenta y tu organización."
      />
      <div className="form-stack narrow">
        <Link className="panel" href="/profile">
          <h3>Mi cuenta</h3>
          <p className="description">
            Nombre, ciudad y privacidad de tu perfil.
          </p>
        </Link>
        <Link className="panel" href="/studio/organization">
          <h3>{org?.name ?? "Tu organización"}</h3>
          <p className="description">
            Identidad y descripción de tus encuentros.
          </p>
        </Link>
        <Link className="panel" href="/studio/team">
          <h3>Equipo y permisos</h3>
          <p className="description">
            Quién puede crear asados y consultar participantes.
          </p>
        </Link>
      </div>
    </>
  );
}
