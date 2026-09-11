import { notFound } from "next/navigation";
import { PageHeading, Badge } from "@asapp/ui";
import { currentUser, services } from "@/lib/server";
import { CollectionGrid } from "@/components/collection-grid";
export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await currentUser();
  const svc = await services();
  const collection = await svc.collectionService.bySlug(slug);
  if (!collection) notFound();
  const progress = await svc.collectionService.progress(
    collection.id,
    user?.id,
  );
  return (
    <main className="container">
      <PageHeading
        eyebrow="Una historia, varios encuentros"
        title={collection.name}
        description={collection.description}
        action={<Badge>{progress.total} asados</Badge>}
      />
      {user && (
        <div className="memory-proof">
          <strong>
            {progress.collected} / {progress.total} coleccionados
          </strong>
          <p>
            {progress.collected === progress.total
              ? "Estuviste en todos. Esta historia también es tuya."
              : "Cada encuentro te acerca a completar esta historia."}
          </p>
          <div className="progress-track">
            <div
              style={{
                width: `${progress.total ? (progress.collected / progress.total) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}
      <CollectionGrid drops={progress.drops} />
    </main>
  );
}
