import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Artwork, ButtonLink } from "@asapp/ui";
import { currentUser } from "@/lib/server";
export default async function Home() {
  if (await currentUser()) redirect("/collection");
  return (
    <main className="container">
      <section className="landing-hero">
        <div>
          <p className="eyebrow">Cada asado cuenta.</p>
          <h1 className="hero-title">
            Colecciona los asados que <em>viviste.</em>
          </h1>
          <p className="hero-copy">
            Cada asado tiene una historia. Guarda los que viviste y construye tu
            colección.
          </p>
          <div className="button-row">
            <ButtonLink href="/login">Empezar mi colección</ButtonLink>
            <Link className="text-link" href="/studio">
              Crear un asado <ArrowRight size={17} />
            </Link>
          </div>
        </div>
        <div
          className="hero-art"
          aria-label="Una colección de recuerdos de asados"
        >
          {[1, 2, 6, 3].map((i) => (
            <Artwork
              key={i}
              src={`/artworks/${i}.svg`}
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
          <div className="hero-stamp">
            <strong>Estuviste</strong>
            <span>ahí. Y eso cuenta.</span>
          </div>
        </div>
      </section>
      <section className="how">
        <p className="eyebrow">Así de simple</p>
        <h2>De la mesa a tu historia.</h2>
        <div className="how-grid">
          {[
            [
              "01",
              "Vas a un asado",
              "Te encuentras con tu gente. Compartes la mesa y el momento.",
            ],
            [
              "02",
              "Lo coleccionas",
              "Escaneas el QR o ingresas la palabra que comparte tu anfitrión.",
            ],
            [
              "03",
              "Queda en tu historia",
              "Un recuerdo para volver a ese día, todas las veces que quieras.",
            ],
          ].map(([number, title, copy]) => (
            <div key={number} className="how-item">
              <span>{number}</span>
              <div>
                <h3>{title}</h3>
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
