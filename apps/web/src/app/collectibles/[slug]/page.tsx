import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, Check } from "lucide-react";
import { Artwork, Badge, formatDate } from "@asapp/ui";
import { currentUser, services } from "@/lib/server";
import { ShareButton } from "@/components/forms";
export default async function Detail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await currentUser();
  const svc = await services();
  const drop = await svc.dropService.bySlug(slug, user?.id);
  if (!drop) notFound();
  const progress = drop.collection_id
    ? await svc.collectionService.progress(drop.collection_id, user?.id)
    : null;
  return (
    <main className="container detail">
      <Link href={user ? "/collection" : "/explore"} className="back-link">
        <ArrowLeft size={16} />
        Volver a {user ? "mi colección" : "explorar"}
      </Link>
      <div className="detail-grid">
        <div className="detail-art">
          <Artwork src={drop.artwork_url} title={drop.title} size="large" />
        </div>
        <div className="detail-info">
          <Badge>Un asado para recordar</Badge>
          <h1>{drop.title}</h1>
          <p className="org-line">
            Organizado por <strong>{drop.organization_name}</strong>
          </p>
          <div className="detail-facts">
            <div>
              <CalendarDays size={19} />
              {formatDate(drop.date)}
            </div>
            <div>
              <MapPin size={19} />
              <span>
                {drop.venue_name}
                <br />
                <span className="muted">
                  {[drop.city, drop.country].filter(Boolean).join(", ")}
                </span>
              </span>
            </div>
          </div>
          <p className="description">{drop.description}</p>
          {drop.claimed_at ? (
            <div className="memory-proof">
              <strong>
                <Check size={18} /> Coleccionado · Estuviste ahí.
              </strong>
              <p>Lo guardaste el {formatDate(drop.claimed_at)}.</p>
            </div>
          ) : (
            <p className="notice">
              Para coleccionarlo, abre el QR o pide la palabra del asado a su
              organizador.
            </p>
          )}
          <ShareButton title={drop.title} />
          {progress && progress.total > 0 && (
            <Link
              className="related-collection"
              href={"/collections/" + drop.collection_slug}
            >
              <p className="eyebrow">Parte de una historia más grande</p>
              <h3>{drop.collection_name}</h3>
              <p>
                {progress.collected} de {progress.total} coleccionados
              </p>
              <div className="progress-track">
                <div
                  style={{
                    width: `${(progress.collected / progress.total) * 100}%`,
                  }}
                />
              </div>
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
