import { Compass } from "lucide-react";
import Link from "next/link";
import { PageHeading } from "@asapp/ui";
import { requireUser, services } from "@/lib/server";
import { CollectionGrid } from "@/components/collection-grid";
export default async function Collection() {
  const user = await requireUser();
  const drops = await (
    await services()
  ).collectionService.getUserCollection(user.id);
  return (
    <main className="container">
      <PageHeading
        eyebrow={
          "LOS BUENOS MOMENTOS, " +
          (user.display_name ?? "CONTIGO").toUpperCase()
        }
        title="Mi colección"
        description={`${drops.length} asados coleccionados · y muchas historias para contar.`}
        action={
          <Link href="/explore" className="button button-secondary">
            <Compass size={17} />
            Explorar
          </Link>
        }
      />
      <CollectionGrid drops={drops} filterable />
      <div className="collection-note">
        <span>Cada círculo, una historia compartida.</span>
        <span>Estuviste ahí.</span>
      </div>
    </main>
  );
}
