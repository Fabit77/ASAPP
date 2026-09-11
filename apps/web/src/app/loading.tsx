export default function Loading() {
  return (
    <main
      className="container"
      aria-label="Cargando recuerdos"
      aria-busy="true"
    >
      <div
        className="skeleton"
        style={{ height: 55, width: "50%", marginBottom: 50 }}
      />
      <div className="collectible-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton circle" />
        ))}
      </div>
    </main>
  );
}
