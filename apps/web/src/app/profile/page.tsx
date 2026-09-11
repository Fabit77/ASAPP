import Link from "next/link";
import { PageHeading } from "@asapp/ui";
import { requireUser } from "@/lib/server";
import { profileAction, logoutAction } from "@/lib/actions";
import { ActionForm, Submit } from "@/components/forms";
export default async function ProfileSettings() {
  const user = await requireUser("/profile");
  return (
    <main className="container narrow">
      <PageHeading
        title="Tu perfil"
        description="La persona detrás de los recuerdos."
        action={
          user.is_public && user.username ? (
            <Link className="text-link" href={"/u/" + user.username}>
              Ver perfil público ↗
            </Link>
          ) : undefined
        }
      />
      <div className="panel">
        <ActionForm action={profileAction}>
          <label>
            Tu nombre
            <input
              name="displayName"
              defaultValue={user.display_name ?? ""}
              required
              maxLength={80}
            />
          </label>
          <label>
            Nombre de usuario
            <input
              name="username"
              defaultValue={user.username ?? ""}
              pattern="[a-z0-9_]{3,30}"
              required
            />
            <span className="fineprint">
              Entre 3 y 30 letras minúsculas, números o guiones bajos.
            </span>
          </label>
          <label>
            Sobre ti
            <textarea
              name="bio"
              defaultValue={user.bio ?? ""}
              maxLength={500}
            />
          </label>
          <label>
            Ciudad
            <input name="city" defaultValue={user.city ?? ""} maxLength={100} />
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              name="isPublic"
              defaultChecked={user.is_public}
            />
            Perfil público
          </label>
          <p className="fineprint">
            Solo se muestran asados públicos. Tu email nunca aparece en tu
            perfil.
          </p>
          <Submit>Guardar perfil</Submit>
        </ActionForm>
      </div>
      <form action={logoutAction} style={{ marginTop: 25 }}>
        <button className="button button-secondary">Cerrar sesión</button>
      </form>
    </main>
  );
}
