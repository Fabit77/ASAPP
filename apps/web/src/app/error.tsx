"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="container narrow">
      <div className="empty">
        <h1>No pudimos abrir esta página.</h1>
        <p className="muted">Inténtalo nuevamente en un momento.</p>
        <button className="button" onClick={reset}>
          Volver a intentar
        </button>
      </div>
    </main>
  );
}
