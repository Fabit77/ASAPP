"use client";
import { useActionState, useState } from "react";
import { Artwork } from "@asapp/ui";
import type { Collection, Drop } from "@asapp/core";
import { dropAction } from "@/lib/actions";
import { Submit } from "./forms";
const dateValue = (date: string | Date) =>
  new Date(date).toISOString().slice(0, 10);
const localTime = (date: string | Date) =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Santiago",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(date));
export function DropEditor({
  organizationId,
  organizationName,
  collections,
  drop,
  qrEnabled = true,
  hasSecret = false,
}: {
  organizationId: string;
  organizationName: string;
  collections: Collection[];
  drop?: Drop;
  qrEnabled?: boolean;
  hasSecret?: boolean;
}) {
  const [state, action] = useActionState(dropAction, {});
  const [title, setTitle] = useState(drop?.title ?? "");
  const [artwork, setArtwork] = useState(
    drop?.artwork_url ?? "/artworks/1.svg",
  );
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [secret, setSecret] = useState(hasSecret);
  const [date, setDate] = useState(drop ? dateValue(drop.date) : "");
  const [start, setStart] = useState(
    drop ? localTime(drop.start_date_time) : "18:00",
  );
  const [end, setEnd] = useState(
    drop?.end_date_time ? localTime(drop.end_date_time) : "",
  );
  return (
    <form action={action} className="drop-editor">
      <div>
        <input type="hidden" name="id" value={drop?.id ?? ""} />
        <input type="hidden" name="organizationId" value={organizationId} />
        <input type="hidden" name="artworkUrl" value={artwork} />
        <section className="form-section">
          <h2>01 · El recuerdo</h2>
          <div className="form-stack">
            <label>
              Nombre del asado
              <input
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Convidados #017"
                required
                minLength={3}
                maxLength={120}
              />
            </label>
            <label>
              La historia
              <textarea
                name="description"
                defaultValue={drop?.description}
                placeholder="¿Qué hace especial a este encuentro?"
                maxLength={3000}
              />
            </label>
            <div className="upload-box">
              <p>Una imagen para volver a este día.</p>
              <p className="fineprint">
                Cuadrada · 1080 × 1080 recomendado · JPG, PNG o WebP · hasta 5
                MB
              </p>
              <input
                aria-label="Subir artwork cuadrado"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={uploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploading(true);
                  setUploadError("");
                  try {
                    const data = new FormData();
                    data.set("file", file);
                    data.set("organizationId", organizationId);
                    const response = await fetch("/api/upload", {
                      method: "POST",
                      body: data,
                    });
                    const json = await response.json();
                    if (!response.ok) throw new Error(json.error);
                    setArtwork(json.url);
                  } catch (error) {
                    setUploadError(
                      error instanceof Error
                        ? error.message
                        : "No se pudo subir la imagen.",
                    );
                  } finally {
                    setUploading(false);
                  }
                }}
              />
              {uploading && <p role="status">Subiendo imagen…</p>}
              {uploadError && (
                <p role="alert" className="form-error">
                  {uploadError}
                </p>
              )}
            </div>
          </div>
        </section>
        <section className="form-section">
          <h2>02 · El encuentro</h2>
          <div className="form-grid">
            <label className="field">
              Fecha
              <input
                type="date"
                name="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </label>
            <label className="field">
              Ciudad
              <input
                name="city"
                defaultValue={drop?.city ?? ""}
                maxLength={200}
              />
            </label>
            <label className="field">
              Hora de inicio
              <input
                type="time"
                name="startTime"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                required
              />
            </label>
            <label className="field">
              Hora de fin · opcional
              <input
                type="time"
                name="endTime"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </label>
            <p className="fineprint full">
              Horario de Chile continental (Santiago). El fin corresponde al
              mismo día.
            </p>
            <label className="field">
              Lugar
              <input
                name="venueName"
                defaultValue={drop?.venue_name ?? ""}
                placeholder="La terraza"
                maxLength={200}
              />
            </label>
            <label className="field">
              País
              <input
                name="country"
                defaultValue={drop?.country ?? "Chile"}
                maxLength={200}
              />
            </label>
            <label className="field full">
              Colección
              <select
                name="collectionId"
                defaultValue={drop?.collection_id ?? ""}
              >
                <option value="">Sin colección</option>
                {collections.map((c) => (
                  <option value={c.id} key={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>
        <section className="form-section">
          <h2>03 · Cómo se colecciona</h2>
          <div className="form-stack">
            <div className="form-grid">
              <label>
                Cupo · opcional
                <input
                  name="maxSupply"
                  type="number"
                  min={1}
                  max={1000000}
                  defaultValue={drop?.max_supply ?? ""}
                  placeholder="Sin límite"
                />
              </label>
              <label>
                Visibilidad
                <select
                  name="visibility"
                  defaultValue={drop?.visibility ?? "PUBLIC"}
                >
                  <option value="PUBLIC">Público · aparece en Explorar</option>
                  <option value="UNLISTED">No listado · solo con enlace</option>
                  <option value="PRIVATE">Privado · solo participantes</option>
                </select>
              </label>
            </div>
            <label className="checkbox">
              <input type="checkbox" name="qr" defaultChecked={qrEnabled} />
              Código QR
            </label>
            <p className="fineprint">
              Comparte el QR en el asado. El enlace se crea al guardar y se
              activa al publicar.
            </p>
            <label className="checkbox">
              <input
                type="checkbox"
                name="secretEnabled"
                checked={secret}
                onChange={(e) => setSecret(e.target.checked)}
              />
              Palabra del asado
            </label>
            {secret && (
              <label>
                {hasSecret
                  ? "Cambiar palabra · deja vacío para conservarla"
                  : "Palabra secreta"}
                <input
                  type="password"
                  name="secretWord"
                  autoComplete="new-password"
                  maxLength={200}
                  required={!hasSecret}
                  placeholder={
                    hasSecret
                      ? "La palabra guardada no se muestra"
                      : "Solo quienes estuvieron ahí la conocen"
                  }
                />
              </label>
            )}
            {hasSecret && (
              <p className="fineprint">
                Desmarca esta opción para desactivar el reclamo con palabra.
              </p>
            )}
          </div>
        </section>
        {state.error && (
          <p role="alert" className="form-error">
            {state.error}
          </p>
        )}
        <div className="button-row" style={{ marginTop: 20 }}>
          <fieldset
            disabled={uploading}
            style={{ border: 0, padding: 0, display: "contents" }}
          >
            <Submit name="status" value="PUBLISHED">
              {drop ? "Guardar y publicar" : "Publicar asado"}
            </Submit>
            <Submit name="status" value="DRAFT" secondary>
              Guardar borrador
            </Submit>
          </fieldset>
        </div>
      </div>
      <aside className="preview-panel">
        <p className="eyebrow">Así se verá tu recuerdo</p>
        <Artwork src={artwork} title={title || "Vista previa del asado"} />
        <p className="card-org">{organizationName}</p>
        <h3>{title || "Tu próximo gran asado"}</h3>
        <p className="fineprint">{date || "Una fecha para recordar"}</p>
      </aside>
    </form>
  );
}
