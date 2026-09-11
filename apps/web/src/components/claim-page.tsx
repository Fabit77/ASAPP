import Link from "next/link";
import { Artwork, formatDate } from "@asapp/ui";
import type { Drop } from "@asapp/core";
import { currentUser, services } from "@/lib/server";
import { ClaimForm } from "./forms";
export async function ClaimPage({
  drop,
  path,
  code,
  type,
}: {
  drop: Drop;
  path: string;
  code?: string;
  type: "QR" | "SECRET_WORD";
}) {
  const user = await currentUser();
  const owned = user
    ? await (await services()).claimService.owned(user.id, drop.id)
    : null;
  return (
    <main className="container claim-layout">
      <p className="eyebrow">Los buenos momentos se guardan.</p>
      <Artwork src={drop.artwork_url} title={drop.title} />
      <p className="card-org">{drop.organization_name}</p>
      <h1>{drop.title}</h1>
      <p className="muted">
        {formatDate(drop.date)} · {drop.city}
      </p>
      <p className="description">
        Un recuerdo de una mesa compartida.
        <br />
        Una historia que también es tuya.
      </p>
      {user ? (
        <ClaimForm slug={drop.slug} code={code} type={type} owned={!!owned} />
      ) : (
        <div className="form-stack">
          <p className="muted">Inicia sesión para coleccionarlo.</p>
          <Link
            className="button"
            href={"/login?next=" + encodeURIComponent(path)}
          >
            Iniciar sesión
          </Link>
        </div>
      )}
    </main>
  );
}
