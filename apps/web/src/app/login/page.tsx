import { redirect } from "next/navigation";
import { Artwork } from "@asapp/ui";
import { safeReturnPath } from "@asapp/core";
import { currentUser, localDemo } from "@/lib/server";
import { demoAction } from "@/lib/actions";
import { LoginForm } from "@/components/forms";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = safeReturnPath(params.next);
  if (await currentUser()) redirect(next);
  return (
    <main className="container login-layout">
      <div className="login-intro">
        <Artwork src="/artworks/2.svg" title="Convidados — La sobremesa" />
        <h2>
          Los asados pasan.
          <br />
          Los recuerdos quedan.
        </h2>
      </div>
      <section className="login-panel">
        <p className="eyebrow">Bienvenido a ASAPP</p>
        <h1>
          Tu próxima historia
          <br />
          empieza aquí.
        </h1>
        <p className="muted">Colecciona los asados que viviste.</p>
        {params.error && (
          <p role="alert" className="form-error">
            El enlace expiró. Solicita uno nuevo para entrar.
          </p>
        )}
        {localDemo() ? (
          <>
            <p className="notice">
              Estás en la versión de desarrollo. Elige una cuenta de ejemplo
              para recorrer ASAPP.
            </p>
            <form action={demoAction} className="form-stack">
              <input type="hidden" name="next" value={next} />
              <button className="button" name="persona" value="new">
                Entrar con colección vacía
              </button>
              <button
                className="button button-secondary"
                name="persona"
                value="owner"
              >
                Entrar como Fabio · organizador
              </button>
              <p className="fineprint">
                En producción, el acceso se realiza por email con Supabase.
              </p>
            </form>
          </>
        ) : (
          <LoginForm next={next} />
        )}
      </section>
    </main>
  );
}
