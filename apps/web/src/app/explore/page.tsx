import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHeading, Artwork, Empty } from "@asapp/ui";
import { services } from "@/lib/server";
import { CollectionGrid } from "@/components/collection-grid";
export default async function Explore() {
  const svc = await services();
  const [drops, collections, organizations] = await Promise.all([
    svc.dropService.explore(),
    svc.collectionService.list(),
    svc.organizationService.publicList(),
  ]);
  const today = new Date().toISOString().slice(0, 10);
  const future = drops
    .filter((d) => new Date(d.date).toISOString().slice(0, 10) >= today)
    .reverse();
  const previous = drops.filter(
    (d) => new Date(d.date).toISOString().slice(0, 10) < today,
  );
  return (
    <main className="container">
      <PageHeading
        eyebrow="Siempre hay una mesa más"
        title="Encuentra tu próximo recuerdo."
        description="Asados, personas y lugares que vale la pena coleccionar."
      />
      <div className="section-heading">
        <h2>Próximos asados</h2>
        <span className="fineprint">Que no se te pase la próxima.</span>
      </div>
      {future.length ? (
        <CollectionGrid drops={future} />
      ) : (
        <Empty
          title="La próxima mesa se está preparando."
          description="Vuelve pronto para descubrir nuevos encuentros."
          href="/studio/drops/new"
          cta="Crear coleccionable"
        />
      )}
      <div className="section-heading">
        <h2>Últimos asados</h2>
        <span className="fineprint">Todavía se habla de ellos.</span>
      </div>
      <CollectionGrid drops={previous.slice(0, 8)} />
      <div className="section-heading">
        <h2>Colecciones destacadas</h2>
      </div>
      <div className="collection-cards">
        {collections.map((c) => (
          <Link
            key={c.id}
            href={"/collections/" + c.slug}
            className="collection-tile"
          >
            <Artwork
              src={c.cover_image_url ?? "/artworks/1.svg"}
              title={c.name}
            />
            <div>
              <h3>{c.name}</h3>
              <p>
                {drops.filter((d) => d.collection_id === c.id).length} recuerdos{" "}
                <ArrowUpRight size={13} style={{ display: "inline" }} />
              </p>
            </div>
          </Link>
        ))}
      </div>
      <div className="section-heading">
        <h2>Organizadores</h2>
      </div>
      <div className="organizer-list">
        {organizations.map((o) => (
          <div className="organizer" key={o.id}>
            <Artwork
              src={o.avatar_url ?? "/artworks/1.svg"}
              title={o.name}
              size="small"
            />
            <div>
              <h3>{o.name}</h3>
              <p className="fineprint">
                {drops.filter((d) => d.organization_id === o.id).length} asados
                compartidos
              </p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
