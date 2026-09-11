import { Compass } from "lucide-react";
import Link from "next/link";
import { requireUser, services } from "@/lib/server";
import { CollectionGrid } from "@/components/collection-grid";
export default async function Collection() {
  const user = await requireUser();
  const drops = await (
    await services()
  ).collectionService.getUserCollection(user.id);
  return (
    <main className="container">
      <header className="collection-hero">
        <div>
          <p className="eyebrow">MI COLECCIÓN</p>
          <div className="collection-count">
            <strong>{drops.length}</strong>
            <span>
              asados
              <br />
              coleccionados
            </span>
          </div>
          <p>Los buenos momentos de {user.display_name ?? "tu historia"}.</p>
        </div>
        <Link href="/explore" className="button button-secondary">
          <Compass size={17} />
          Explorar
        </Link>
      </header>
      <CollectionGrid drops={drops} filterable />
      <div className="collection-note">
        <span>Cada círculo, una historia compartida.</span>
        <span>Estuviste ahí.</span>
      </div>
    </main>
  );
}
