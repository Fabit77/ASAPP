import { notFound } from "next/navigation";
import { services } from "@/lib/server";
import { CollectionGrid } from "@/components/collection-grid";
export default async function Profile({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const svc = await services();
  const user = await svc.userService.publicProfile(username);
  if (!user) notFound();
  const drops = await svc.collectionService.publicUserCollection(user.id);
  return (
    <main className="container">
      <div className="profile-header">
        <div className="profile-avatar">{user.display_name?.charAt(0)}</div>
        <div>
          <p className="eyebrow">@{user.username}</p>
          <h1>{user.display_name}</h1>
          <p>
            {drops.length} asados públicos ·{" "}
            {new Set(drops.map((d) => d.collection_id).filter(Boolean)).size}{" "}
            colecciones · {user.city}
          </p>
          {user.bio && <p className="description">{user.bio}</p>}
        </div>
      </div>
      <CollectionGrid drops={drops} filterable />
    </main>
  );
}
