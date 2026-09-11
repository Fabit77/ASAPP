import { randomUUID } from "node:crypto";
import type { Database } from "./index";
import { hashSecret, generateClaimCode } from "../../core/src/security";
export const DEMO_OWNER = "10000000-0000-4000-8000-000000000001";
export const DEMO_NEW = "10000000-0000-4000-8000-000000000020";
export async function seed(db: Database) {
  if ((await db.query("SELECT id FROM users LIMIT 1")).length) return;
  const hash = await hashSecret("sobremesa");
  await db.transaction(async (tx) => {
    const names = [
      "Fabio",
      "Sofía",
      "Nicolás",
      "Camila",
      "Tomás",
      "Valentina",
      "Diego",
      "Antonia",
      "Pedro",
      "Isidora",
      "Joaquín",
      "Florencia",
      "Matías",
      "Catalina",
      "Lucas",
      "Josefina",
      "Benjamín",
      "Francisca",
      "Martín",
      "Nuevo coleccionista",
    ];
    const users = names.map(
      (_, i) => `10000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
    );
    for (const [i, name] of names.entries())
      await tx.query(
        "INSERT INTO users(id,email,username,display_name,bio,city) VALUES($1,$2,$3,$4,$5,$6)",
        [
          users[i],
          `demo${i + 1}@asapp.example`,
          i === 0 ? "fabio" : `coleccionista${i + 1}`,
          name,
          i === 0 ? "La mejor parte siempre es la sobremesa." : "",
          "Santiago",
        ],
      );
    const orgs = [
      "20000000-0000-4000-8000-000000000001",
      "20000000-0000-4000-8000-000000000002",
    ];
    for (const [i, name] of ["Convidados", "Amigos del Sur"].entries()) {
      await tx.query(
        "INSERT INTO organizations(id,name,slug,description,owner_id,avatar_url) VALUES($1,$2,$3,$4,$5,$6)",
        [
          orgs[i],
          name,
          i ? "amigos-del-sur" : "convidados",
          i
            ? "Encuentros, kilómetros y una mesa que siempre tiene espacio."
            : "Una buena mesa. Gente increíble. Historias para volver a contar.",
          users[0],
          `/artworks/${i + 1}.svg`,
        ],
      );
      await tx.query(
        "INSERT INTO organization_members(id,organization_id,user_id,role) VALUES($1,$2,$3,$4)",
        [randomUUID(), orgs[i], users[0], "OWNER"],
      );
    }
    const cols = [
      "30000000-0000-4000-8000-000000000001",
      "30000000-0000-4000-8000-000000000002",
      "30000000-0000-4000-8000-000000000003",
    ];
    for (const [i, name] of [
      "Convidados — Temporada 01",
      "Patagonia, sin apuro",
      "Entre amigos",
    ].entries())
      await tx.query(
        "INSERT INTO collections(id,organization_id,name,slug,description,cover_image_url) VALUES($1,$2,$3,$4,$5,$6)",
        [
          cols[i],
          orgs[i === 1 ? 1 : 0],
          name,
          ["convidados-temporada-01", "patagonia-sin-apuro", "entre-amigos"][i],
          [
            "Cinco encuentros. Una mesa que se hace más grande.",
            "Recuerdos del sur, donde las conversaciones duran un poco más.",
            "No hace falta una ocasión. Solo estar juntos.",
          ][i],
          `/artworks/${i + 1}.svg`,
        ],
      );
    const titles = [
      "Convidados #001",
      "Convidados #002",
      "Convidados #003",
      "Convidados #004",
      "Convidados #005",
      "Asado Patagonia",
      "Builder Break — Última Noche",
      "Team1 Asado Santiago",
      "Asado Casa de Nico",
      "El próximo encuentro",
    ];
    const dates = [
      "2026-02-14",
      "2026-03-21",
      "2026-04-18",
      "2026-05-23",
      "2026-06-20",
      "2026-07-11",
      "2026-08-08",
      "2026-08-22",
      "2026-09-05",
      "2026-12-12",
    ];
    for (let i = 0; i < 10; i++) {
      const dropId = `40000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`;
      await tx.query(
        "INSERT INTO drops(id,organization_id,collection_id,title,slug,description,artwork_url,date,start_date_time,venue_name,city,country,max_supply,visibility,status,position) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)",
        [
          dropId,
          orgs[i === 5 || i === 6 ? 1 : 0],
          cols[i < 5 ? 0 : i < 7 ? 1 : 2],
          titles[i],
          [
            "convidados-001",
            "convidados-002",
            "convidados-003",
            "convidados-004",
            "convidados-005",
            "asado-patagonia",
            "builder-break",
            "team1-santiago",
            "casa-de-nico",
            "proximo-encuentro",
          ][i],
          "Nos encontramos alrededor de la mesa, compartimos algo rico y dejamos que la tarde se hiciera larga. Este recuerdo es de quienes estuvieron ahí.",
          `/artworks/${i + 1}.svg`,
          dates[i],
          dates[i] + "T17:00:00-03:00",
          i === 5 ? "Casa del Lago" : i === 8 ? "Casa de Nico" : "La terraza",
          i === 5 ? "Puerto Varas" : i === 6 ? "Punta Arenas" : "Santiago",
          "Chile",
          i === 8 ? 17 : 50,
          "PUBLIC",
          "PUBLISHED",
          i,
        ],
      );
      for (const type of ["QR", "SECRET_WORD"])
        await tx.query(
          "INSERT INTO claim_methods(id,drop_id,type,config,code) VALUES($1,$2,$3,$4,$5)",
          [
            randomUUID(),
            dropId,
            type,
            JSON.stringify(type === "SECRET_WORD" ? { hash } : {}),
            type === "QR" ? generateClaimCode() : null,
          ],
        );
      for (let j = 0; j < 4; j++) {
        const userId = users[j === 0 ? 0 : 1 + ((i * 3 + j) % 18)];
        await tx.query(
          "INSERT INTO claims(id,user_id,drop_id,claim_method,claimed_at) VALUES($1,$2,$3,$4,$5)",
          [randomUUID(), userId, dropId, "QR", dates[i] + "T19:00:00-03:00"],
        );
      }
      await tx.query("UPDATE drops SET claim_count=4 WHERE id=$1", [dropId]);
    }
  });
}
