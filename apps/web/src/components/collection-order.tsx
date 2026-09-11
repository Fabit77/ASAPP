"use client";
import { useState } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import type { Drop } from "@asapp/core";
export function CollectionOrder({
  drops,
  editable,
}: {
  drops: Drop[];
  editable: boolean;
}) {
  const [items, setItems] = useState(drops);
  function move(index: number, delta: number) {
    setItems((current) => {
      const copy = [...current];
      [copy[index], copy[index + delta]] = [copy[index + delta], copy[index]];
      return copy;
    });
  }
  return (
    <div>
      <input
        type="hidden"
        name="order"
        value={items.map((d) => d.id).join(",")}
      />
      {items.map((d, i) => (
        <div className="team-member" key={d.id}>
          <span>{d.title}</span>
          {editable && (
            <div className="button-row">
              <button
                type="button"
                aria-label={"Subir " + d.title}
                disabled={i === 0}
                onClick={() => move(i, -1)}
              >
                <ArrowUp size={16} />
              </button>
              <button
                type="button"
                aria-label={"Bajar " + d.title}
                disabled={i === items.length - 1}
                onClick={() => move(i, 1)}
              >
                <ArrowDown size={16} />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
