import { Empty } from "@asapp/ui";
export default function NotFound() {
  return (
    <main className="container">
      <Empty
        title="Este asado no existe o ya no está disponible."
        description="Hay otras historias esperando por ti."
      />
    </main>
  );
}
