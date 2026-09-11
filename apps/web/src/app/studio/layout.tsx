import Link from "next/link";
import { Logo } from "@asapp/ui";
import { studioContext } from "@/lib/server";
import { selectOrg } from "@/lib/actions";
import { StudioNav } from "@/components/studio-nav";
export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { org, orgs } = await studioContext();
  return (
    <div className="studio-shell">
      <aside className="studio-sidebar">
        <div className="studio-brand">
          <Logo />
          <span>Studio</span>
        </div>
        {org && (
          <form action={selectOrg}>
            <select
              name="organizationId"
              defaultValue={org.id}
              aria-label="Organización activa"
            >
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
            <button
              className="text-link"
              style={{ marginTop: 8 }}
              type="submit"
            >
              Cambiar organización
            </button>
          </form>
        )}
        <StudioNav />
        <Link className="consumer-link" href="/collection">
          ← Volver a mi colección
        </Link>
      </aside>
      <main className="studio-main">{children}</main>
    </div>
  );
}
