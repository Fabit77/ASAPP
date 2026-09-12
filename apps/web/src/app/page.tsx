import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { CollectibleArtwork, ButtonLink } from "@asapp/ui";
import { currentUser } from "@/lib/server";
export default async function Home() {
  if (await currentUser()) redirect("/collection");
  return (
    <main className="container">
      <section className="landing-hero">
        <div className="hero-copy-block">
          <p className="hero-brand" aria-hidden="true">
            ASAPP
          </p>
          <h1 className="hero-title">
            Colecciona los asados
            <br />
            que <em>viviste.</em>
          </h1>
          <p className="hero-copy">
            Cada asado tiene una historia. Guarda los que viviste y construye tu
            colección.
          </p>
          <div className="button-row">
            <ButtonLink href="/explore">Ver coleccionables</ButtonLink>
            <Link className="text-link" href="/studio">
              Crear coleccionable <ArrowRight size={17} />
            </Link>
          </div>
        </div>
        <div
          className="hero-orbit"
          aria-label="Una colección de recuerdos de asados"
        >
          {[1, 2, 6, 3].map((i) => (
            <CollectibleArtwork
              key={i}
              src={`/artworks/${i}.svg`}
              size={i === 1 ? "hero" : i === 2 ? "xl" : "lg"}
              priority={i === 1}
              title={
                [
                  "",
                  "Convidados, la primera mesa",
                  "Convidados, la sobremesa",
                  "Convidados, buena compañía",
                  "",
                  "",
                  "Patagonia, sin apuro",
                ][i]
              }
            />
          ))}
          <div className="hero-stamp" aria-hidden="true">
            <span>ESTUVISTE</span>
            <strong>AHÍ</strong>
            <span>ASAPP · 2026</span>
          </div>
        </div>
      </section>
      <section className="how">
        <p className="eyebrow">ASÍ DE SIMPLE</p>
        <div className="how-grid">
          {[
            ["01", "VAS.", "Una mesa, tu gente, ese momento."],
            ["02", "COLECCIONAS.", "Un QR. Un gesto. Ya es parte de ti."],
            ["03", "QUEDA.", "El asado pasa. La historia se queda."],
          ].map(([number, title, copy]) => (
            <div key={number} className="how-item">
              <span>{number}</span>
              <div>
                <h2>{title}</h2>
                <p>{copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="closing">
        <h2>
          Un recuerdo digital
          <br />
          de cada asado.
        </h2>
        <ButtonLink href="/explore">Descubrir ASAPP</ButtonLink>
      </section>
    </main>
  );
}
