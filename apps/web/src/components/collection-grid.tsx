"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, ArrowUpRight, Check } from "lucide-react";
import { Artwork, Empty, formatDate } from "@asapp/ui";
import type { Drop } from "@asapp/core";
export function DropCard({ drop }: { drop: Drop }) {
  return (
    <Link className="drop-card" href={"/collectibles/" + drop.slug}>
      <div className="card-art">
        <Artwork src={drop.artwork_url} title={drop.title} />
        <span className="card-arrow">
          <ArrowUpRight size={20} />
        </span>
        {drop.claimed_at && (
          <span className="owned-dot" aria-label="Coleccionado">
            <Check size={13} />
          </span>
        )}
      </div>
      <p className="card-org">{drop.organization_name}</p>
      <h3>{drop.title}</h3>
      <p className="card-meta">
        {formatDate(drop.date)}
        <span>·</span>
        {drop.city}
      </p>
    </Link>
  );
}
export function CollectionGrid({
  drops,
  filterable = false,
}: {
  drops: Drop[];
  filterable?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("");
  const [collection, setCollection] = useState("");
  const [org, setOrg] = useState("");
  const [city, setCity] = useState("");
  const filtered = useMemo(
    () =>
      drops.filter(
        (d) =>
          (!year || new Date(d.date).getUTCFullYear().toString() === year) &&
          (!collection || d.collection_name === collection) &&
          (!org || d.organization_name === org) &&
          (!city || d.city === city) &&
          `${d.title} ${d.organization_name} ${d.city}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [drops, query, year, collection, org, city],
  );
  const unique = (key: "collection_name" | "organization_name" | "city") =>
    Array.from(new Set(drops.map((d) => d[key]).filter(Boolean))) as string[];
  return (
    <>
      {filterable && (
        <>
          <div className="collection-toolbar">
            <div className="filter-chips">
              <button
                className={
                  !year && !collection && !org && !city
                    ? "chip selected"
                    : "chip"
                }
                onClick={() => {
                  setYear("");
                  setCollection("");
                  setOrg("");
                  setCity("");
                  setQuery("");
                }}
              >
                Todos <span>{drops.length}</span>
              </button>
              <select
                aria-label="Filtrar por año"
                className={"chip " + (year ? "selected" : "")}
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                <option value="">Año</option>
                {Array.from(
                  new Set(drops.map((d) => new Date(d.date).getUTCFullYear())),
                )
                  .sort()
                  .reverse()
                  .map((y) => (
                    <option key={y}>{y}</option>
                  ))}
              </select>
              {(
                [
                  {
                    label: "Colecciones",
                    value: collection,
                    set: setCollection,
                    key: "collection_name",
                  },
                  {
                    label: "Organizadores",
                    value: org,
                    set: setOrg,
                    key: "organization_name",
                  },
                  { label: "Ciudades", value: city, set: setCity, key: "city" },
                ] as const
              ).map((f) => (
                <select
                  key={f.key}
                  aria-label={"Filtrar por " + f.label.toLowerCase()}
                  className={"chip " + (f.value ? "selected" : "")}
                  value={f.value}
                  onChange={(e) => f.set(e.target.value)}
                >
                  <option value="">{f.label}</option>
                  {unique(f.key).map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              ))}
            </div>
            <SlidersHorizontal size={18} className="muted" />
          </div>
          <label className="search-field">
            <Search size={17} />
            <input
              placeholder="Buscar un recuerdo…"
              aria-label="Buscar en mi colección"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </>
      )}
      {filtered.length ? (
        <div className="collectible-grid">
          {filtered.map((drop) => (
            <DropCard drop={drop} key={drop.id} />
          ))}
        </div>
      ) : drops.length ? (
        <Empty
          title="No encontramos ese recuerdo."
          description="Prueba con otro nombre o cambia los filtros."
        />
      ) : (
        <Empty />
      )}
    </>
  );
}
