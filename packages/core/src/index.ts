export { chileInstant } from "./dates";
import { randomUUID, createHash } from "node:crypto";
import { z } from "zod";
import type { Database } from "@asapp/database";
import {
  assertRole,
  generateClaimCode,
  hashSecret,
  verifySecret,
} from "./security";
import {
  DomainError,
  type Role,
  type User,
  type PublicUser,
  type Organization,
  type Collection,
  type Drop,
  type Claim,
  type ClaimMethod,
} from "./types";
export * from "./types";
export * from "./security";
const id = z.string().uuid();
const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70) +
  "-" +
  randomUUID().slice(0, 8);
const optionalText = z.string().trim().max(200).optional().default("");
export const dropInput = z
  .object({
    organizationId: id,
    collectionId: z.union([id, z.literal("")]).optional(),
    title: z.string().trim().min(3).max(120),
    description: z.string().trim().max(3000),
    artworkUrl: z
      .string()
      .min(1)
      .max(2000)
      .refine(
        (s) =>
          s.startsWith("/artworks/") ||
          s.startsWith("/api/artwork/") ||
          s.startsWith("https://"),
        "Imagen no válida.",
      ),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    startDateTime: z.string().datetime({ offset: true }),
    endDateTime: z
      .union([z.string().datetime({ offset: true }), z.literal("")])
      .optional(),
    venueName: optionalText,
    city: optionalText,
    country: optionalText,
    maxSupply: z.number().int().positive().max(1000000).nullable(),
    visibility: z.enum(["PUBLIC", "UNLISTED", "PRIVATE"]),
    status: z.enum(["DRAFT", "PUBLISHED"]),
    qr: z.boolean(),
    secretEnabled: z.boolean().optional(),
    secretWord: z.string().trim().max(200).optional().default(""),
  })
  .refine(
    (v) =>
      !v.endDateTime || new Date(v.endDateTime) >= new Date(v.startDateTime),
    "El fin debe ser posterior al inicio.",
  );
export type DropInput = z.input<typeof dropInput>;
const joined = `SELECT d.*,o.name organization_name,o.slug organization_slug,c.name collection_name,c.slug collection_slug FROM drops d JOIN organizations o ON o.id=d.organization_id LEFT JOIN collections c ON c.id=d.collection_id`;
export function createServices(db: Database) {
  async function permission(
    userId: string,
    organizationId: string,
    allowed: Role[] = ["OWNER", "ADMIN", "EDITOR", "VIEWER"],
    tx = db,
  ) {
    const [member] = await tx.query<{ role: Role }>(
      "SELECT role FROM organization_members WHERE user_id=$1 AND organization_id=$2",
      [userId, organizationId],
    );
    assertRole(member?.role, allowed);
    return member.role;
  }
  async function throttle(key: string, limit = 5, seconds = 900) {
    const [result] = await db.query<{ attempts: number }>(
      `INSERT INTO rate_limits(key,attempts,expires_at) VALUES($1,1,now()+($2 * interval '1 second')) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN rate_limits.expires_at<=now() THEN 1 ELSE rate_limits.attempts+1 END,expires_at=CASE WHEN rate_limits.expires_at<=now() THEN now()+($2 * interval '1 second') ELSE rate_limits.expires_at END RETURNING attempts`,
      [createHash("sha256").update(key).digest("hex"), seconds],
    );
    if (result.attempts > limit)
      throw new DomainError(
        "RATE_LIMIT",
        "Demasiados intentos. Vuelve a probar en 15 minutos.",
      );
  }
  const userService = {
    async syncUser(user: { id: string; email: string }) {
      const [result] = await db.query<User>(
        `INSERT INTO users(id,email,username,display_name) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO UPDATE SET email=excluded.email RETURNING *`,
        [user.id, user.email, "u-" + user.id.slice(0, 8), "Coleccionista"],
      );
      return result;
    },
    async get(id: string) {
      return (
        (await db.query<User>("SELECT * FROM users WHERE id=$1", [id]))[0] ??
        null
      );
    },
    async publicProfile(username: string) {
      return (
        (
          await db.query<PublicUser>(
            "SELECT id,username,display_name,avatar_url,bio,city,is_public FROM users WHERE username=$1 AND is_public=true",
            [username],
          )
        )[0] ?? null
      );
    },
    async update(userId: string, input: unknown) {
      const v = z
        .object({
          displayName: z.string().trim().min(1).max(80),
          username: z.string().regex(/^[a-z0-9_]{3,30}$/),
          bio: z.string().max(500),
          city: z.string().max(100),
          isPublic: z.boolean(),
        })
        .parse(input);
      await db.query(
        "UPDATE users SET display_name=$2,username=$3,bio=$4,city=$5,is_public=$6,updated_at=now() WHERE id=$1",
        [userId, v.displayName, v.username, v.bio, v.city, v.isPublic],
      );
    },
  };
  const organizationService = {
    permission,
    async list(userId: string) {
      return db.query<Organization>(
        "SELECT o.*,m.role FROM organizations o JOIN organization_members m ON o.id=m.organization_id WHERE m.user_id=$1 ORDER BY o.created_at",
        [userId],
      );
    },
    async publicList() {
      return db.query<Organization>(
        `SELECT DISTINCT o.id,o.name,o.slug,o.description,o.avatar_url FROM organizations o JOIN drops d ON d.organization_id=o.id WHERE d.visibility='PUBLIC' AND d.status IN ('PUBLISHED','ENDED')`,
      );
    },
    async create(userId: string, input: unknown) {
      const v = z
        .object({
          name: z.string().trim().min(2).max(100),
          description: z.string().max(2000),
        })
        .parse(input);
      return db.transaction(async (tx) => {
        const [org] = await tx.query<Organization>(
          "INSERT INTO organizations(id,name,slug,description,owner_id) VALUES($1,$2,$3,$4,$5) RETURNING *",
          [randomUUID(), v.name, slugify(v.name), v.description, userId],
        );
        await tx.query(
          "INSERT INTO organization_members(id,organization_id,user_id,role) VALUES($1,$2,$3,$4)",
          [randomUUID(), org.id, userId, "OWNER"],
        );
        return org;
      });
    },
    async update(
      userId: string,
      orgId: string,
      name: string,
      description: string,
    ) {
      await permission(userId, orgId, ["OWNER", "ADMIN"]);
      z.string().trim().min(2).max(100).parse(name);
      z.string().max(2000).parse(description);
      await db.query(
        "UPDATE organizations SET name=$2,description=$3,updated_at=now() WHERE id=$1",
        [orgId, name, description],
      );
    },
    async team(userId: string, orgId: string) {
      await permission(userId, orgId, ["OWNER", "ADMIN"]);
      return db.query<{
        id: string;
        display_name: string;
        email: string;
        role: Role;
      }>(
        "SELECT u.id,u.display_name,u.email,m.role FROM organization_members m JOIN users u ON u.id=m.user_id WHERE m.organization_id=$1",
        [orgId],
      );
    },
    async setMember(userId: string, orgId: string, email: string, role: Role) {
      await permission(userId, orgId, ["OWNER"]);
      z.enum(["ADMIN", "EDITOR", "VIEWER"]).parse(role);
      const [user] = await db.query<User>(
        "SELECT * FROM users WHERE email=$1",
        [z.email().parse(email).toLowerCase()],
      );
      if (!user)
        throw new DomainError(
          "NOT_FOUND",
          "Esta persona debe crear una cuenta primero.",
        );
      if (user.id === userId)
        throw new DomainError("FORBIDDEN", "No puedes cambiar tu propio rol.");
      await db.query(
        "INSERT INTO organization_members(id,organization_id,user_id,role) VALUES($1,$2,$3,$4) ON CONFLICT(organization_id,user_id) DO UPDATE SET role=excluded.role",
        [randomUUID(), orgId, user.id, role],
      );
    },
  };
  const collectionService = {
    async getUserCollection(userId: string) {
      return db
        .query<Drop>(
          `${joined} JOIN claims cl ON cl.drop_id=d.id WHERE cl.user_id=$1 ORDER BY cl.claimed_at DESC`,
          [userId],
        )
        .then(async (drops) => {
          const claims = await db.query<Claim>(
            "SELECT * FROM claims WHERE user_id=$1",
            [userId],
          );
          return drops.map((d) => ({
            ...d,
            claimed_at: claims.find((c) => c.drop_id === d.id)?.claimed_at,
          }));
        });
    },
    async publicUserCollection(userId: string) {
      return db.query<Drop>(
        `${joined} JOIN claims cl ON cl.drop_id=d.id JOIN users u ON u.id=cl.user_id WHERE cl.user_id=$1 AND u.is_public=true AND d.visibility='PUBLIC' AND d.status IN ('PUBLISHED','ENDED') ORDER BY cl.claimed_at DESC`,
        [userId],
      );
    },
    async list(orgId?: string, userId?: string) {
      if (orgId) {
        if (!userId) throw new DomainError("FORBIDDEN", "Inicia sesión.");
        await permission(userId, orgId);
        return db.query<Collection>(
          "SELECT * FROM collections WHERE organization_id=$1 ORDER BY created_at",
          [orgId],
        );
      }
      return db.query<Collection>(
        `SELECT DISTINCT c.* FROM collections c JOIN drops d ON d.collection_id=c.id WHERE d.visibility='PUBLIC' AND d.status IN ('PUBLISHED','ENDED')`,
      );
    },
    async bySlug(slug: string) {
      return (
        (
          await db.query<Collection>(
            `SELECT c.* FROM collections c WHERE c.slug=$1 AND EXISTS(SELECT 1 FROM drops d WHERE d.collection_id=c.id AND d.visibility='PUBLIC' AND d.status IN ('PUBLISHED','ENDED'))`,
            [slug],
          )
        )[0] ?? null
      );
    },
    async progress(collectionId: string, userId?: string) {
      const drops = await db.query<Drop>(
        `${joined} WHERE d.collection_id=$1 AND d.visibility='PUBLIC' AND d.status IN ('PUBLISHED','ENDED') ORDER BY d.position,d.date`,
        [collectionId],
      );
      const claims = userId
        ? await db.query<Claim>("SELECT * FROM claims WHERE user_id=$1", [
            userId,
          ])
        : [];
      const owned = new Set(claims.map((c) => c.drop_id));
      return {
        drops,
        total: drops.length,
        collected: drops.filter((d) => owned.has(d.id)).length,
      };
    },
    async save(userId: string, input: unknown) {
      const v = z
        .object({
          id: id.optional(),
          organizationId: id,
          name: z.string().trim().min(2).max(100),
          description: z.string().max(2000),
        })
        .parse(input);
      await permission(userId, v.organizationId, ["OWNER", "ADMIN", "EDITOR"]);
      if (v.id) {
        await db.query(
          "UPDATE collections SET name=$3,description=$4,updated_at=now() WHERE id=$1 AND organization_id=$2",
          [v.id, v.organizationId, v.name, v.description],
        );
        return v.id;
      }
      const collectionId = randomUUID();
      await db.query(
        "INSERT INTO collections(id,organization_id,name,slug,description) VALUES($1,$2,$3,$4,$5)",
        [
          collectionId,
          v.organizationId,
          v.name,
          slugify(v.name),
          v.description,
        ],
      );
      return collectionId;
    },
    async reorder(
      userId: string,
      orgId: string,
      collectionId: string,
      ids: string[],
    ) {
      await permission(userId, orgId, ["OWNER", "ADMIN", "EDITOR"]);
      z.array(id).max(1000).parse(ids);
      await db.transaction(async (tx) => {
        for (const [index, dropId] of ids.entries())
          await tx.query(
            "UPDATE drops SET position=$1 WHERE id=$2 AND organization_id=$3 AND collection_id=$4",
            [index, dropId, orgId, collectionId],
          );
      });
    },
  };
  const dropService = {
    async explore() {
      return db.query<Drop>(
        `${joined} WHERE d.visibility='PUBLIC' AND d.status IN ('PUBLISHED','ENDED') ORDER BY d.date DESC`,
      );
    },
    async bySlug(slug: string, userId?: string) {
      const [drop] = await db.query<Drop>(`${joined} WHERE d.slug=$1`, [slug]);
      if (!drop) return null;
      if (userId) {
        const [owned] = await db.query<Claim>(
          "SELECT * FROM claims WHERE user_id=$1 AND drop_id=$2",
          [userId, drop.id],
        );
        if (owned) return { ...drop, claimed_at: owned.claimed_at };
        const [member] = await db.query(
          "SELECT id FROM organization_members WHERE user_id=$1 AND organization_id=$2",
          [userId, drop.organization_id],
        );
        if (member) return drop;
      }
      return drop.visibility === "PUBLIC" &&
        ["PUBLISHED", "ENDED"].includes(drop.status)
        ? drop
        : null;
    },
    async list(userId: string, orgId: string) {
      await permission(userId, orgId);
      return db.query<Drop>(
        `${joined} WHERE d.organization_id=$1 ORDER BY d.created_at DESC`,
        [orgId],
      );
    },
    async admin(userId: string, dropId: string) {
      const [drop] = await db.query<Drop>(`${joined} WHERE d.id=$1`, [
        id.parse(dropId),
      ]);
      if (!drop) throw new DomainError("NOT_FOUND", "Este asado no existe.");
      await permission(userId, drop.organization_id);
      return drop;
    },
    async methods(userId: string, dropId: string) {
      const drop = await this.admin(userId, dropId);
      await permission(userId, drop.organization_id, [
        "OWNER",
        "ADMIN",
        "EDITOR",
      ]);
      return db.query<Omit<ClaimMethod, "config">>(
        "SELECT id,drop_id,type,code,active FROM claim_methods WHERE drop_id=$1",
        [dropId],
      );
    },
    async createDrop(userId: string, input: unknown, existingId?: string) {
      const v = dropInput.parse(input);
      await permission(userId, v.organizationId, ["OWNER", "ADMIN", "EDITOR"]);
      if (v.status === "PUBLISHED" && !v.qr && !v.secretWord && !existingId)
        throw new DomainError(
          "INVALID",
          "Elige al menos un método para coleccionar.",
        );
      const secretHash = v.secretWord ? await hashSecret(v.secretWord) : null;
      return db.transaction(async (tx) => {
        let dropId = existingId ?? randomUUID();
        if (existingId) {
          const [current] = await tx.query<Drop>(
            "SELECT * FROM drops WHERE id=$1 FOR UPDATE",
            [id.parse(existingId)],
          );
          if (!current || current.organization_id !== v.organizationId)
            throw new DomainError("FORBIDDEN", "Asado no disponible.");
          if (v.maxSupply !== null && v.maxSupply < current.claim_count)
            throw new DomainError(
              "SUPPLY",
              "El cupo no puede ser menor a los recuerdos ya coleccionados.",
            );
          await tx.query(
            "UPDATE drops SET collection_id=$2,title=$3,description=$4,artwork_url=$5,date=$6,start_date_time=$7,end_date_time=$8,venue_name=$9,city=$10,country=$11,max_supply=$12,visibility=$13,status=$14,updated_at=now() WHERE id=$1",
            [
              dropId,
              v.collectionId || null,
              v.title,
              v.description,
              v.artworkUrl,
              v.date,
              v.startDateTime,
              v.endDateTime || null,
              v.venueName,
              v.city,
              v.country,
              v.maxSupply,
              v.visibility,
              v.status,
            ],
          );
        } else
          await tx.query(
            "INSERT INTO drops(id,organization_id,collection_id,title,slug,description,artwork_url,date,start_date_time,end_date_time,venue_name,city,country,max_supply,visibility,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)",
            [
              dropId,
              v.organizationId,
              v.collectionId || null,
              v.title,
              slugify(v.title),
              v.description,
              v.artworkUrl,
              v.date,
              v.startDateTime,
              v.endDateTime || null,
              v.venueName,
              v.city,
              v.country,
              v.maxSupply,
              v.visibility,
              v.status,
            ],
          );
        if (v.qr)
          await tx.query(
            `INSERT INTO claim_methods(id,drop_id,type,code) VALUES($1,$2,'QR',$3) ON CONFLICT(drop_id,type) DO UPDATE SET active=true`,
            [randomUUID(), dropId, generateClaimCode()],
          );
        else
          await tx.query(
            `UPDATE claim_methods SET active=false WHERE drop_id=$1 AND type='QR'`,
            [dropId],
          );
        if (v.secretEnabled === false)
          await tx.query(
            "UPDATE claim_methods SET active=false WHERE drop_id=$1 AND type='SECRET_WORD'",
            [dropId],
          );
        else if (secretHash)
          await tx.query(
            `INSERT INTO claim_methods(id,drop_id,type,config) VALUES($1,$2,'SECRET_WORD',$3) ON CONFLICT(drop_id,type) DO UPDATE SET config=excluded.config,active=true`,
            [randomUUID(), dropId, JSON.stringify({ hash: secretHash })],
          );
        if (v.status === "PUBLISHED") {
          const methods = await tx.query(
            "SELECT id FROM claim_methods WHERE drop_id=$1 AND active=true",
            [dropId],
          );
          if (!methods.length)
            throw new DomainError(
              "INVALID",
              "Activa QR o define una palabra secreta.",
            );
        }
        return dropId;
      });
    },
    async manage(
      userId: string,
      dropId: string,
      action: "pause" | "resume" | "archive" | "duplicate" | "publish",
    ) {
      const drop = await this.admin(userId, dropId);
      await permission(userId, drop.organization_id, [
        "OWNER",
        "ADMIN",
        "EDITOR",
      ]);
      if (action === "duplicate")
        return this.createDrop(userId, {
          organizationId: drop.organization_id,
          collectionId: drop.collection_id ?? "",
          title: drop.title + " · copia",
          description: drop.description,
          artworkUrl: drop.artwork_url,
          date: new Date(drop.date).toISOString().slice(0, 10),
          startDateTime: new Date(drop.start_date_time).toISOString(),
          endDateTime: drop.end_date_time
            ? new Date(drop.end_date_time).toISOString()
            : "",
          venueName: drop.venue_name ?? "",
          city: drop.city ?? "",
          country: drop.country ?? "",
          maxSupply: drop.max_supply,
          visibility: drop.visibility,
          status: "DRAFT",
          qr: true,
        });
      if (action === "publish") {
        const methods = await db.query(
          "SELECT id FROM claim_methods WHERE drop_id=$1 AND active=true",
          [dropId],
        );
        if (!methods.length)
          throw new DomainError("INVALID", "Agrega un método de reclamo.");
        await db.query(
          `UPDATE drops SET status='PUBLISHED',claims_paused=false,updated_at=now() WHERE id=$1`,
          [dropId],
        );
      } else if (action === "archive")
        await db.query(
          `UPDATE drops SET status='ARCHIVED',claims_paused=true,updated_at=now() WHERE id=$1`,
          [dropId],
        );
      else
        await db.query(
          "UPDATE drops SET claims_paused=$2,updated_at=now() WHERE id=$1",
          [dropId, action === "pause"],
        );
      return dropId;
    },
  };
  const claimService = {
    async resolveCode(code: string) {
      if (!/^[a-zA-Z0-9_-]{20,80}$/.test(code)) return null;
      const [drop] = await db.query<Drop>(
        `${joined} JOIN claim_methods cm ON cm.drop_id=d.id WHERE cm.code=$1 AND cm.type='QR' AND cm.active=true AND d.status IN ('PUBLISHED','ENDED')`,
        [code],
      );
      return drop ?? null;
    },
    async resolveSecret(slug: string) {
      const [drop] = await db.query<Drop>(
        `${joined} JOIN claim_methods cm ON cm.drop_id=d.id WHERE d.slug=$1 AND cm.type='SECRET_WORD' AND cm.active=true AND d.status IN ('PUBLISHED','ENDED')`,
        [slug],
      );
      return drop ?? null;
    },
    async owned(userId: string, dropId: string) {
      return (
        (
          await db.query<Claim>(
            "SELECT * FROM claims WHERE user_id=$1 AND drop_id=$2",
            [userId, dropId],
          )
        )[0] ?? null
      );
    },
    async claimDrop(
      userId: string,
      proof:
        | { type: "QR"; code: string }
        | { type: "SECRET_WORD"; slug: string; word: string },
    ) {
      id.parse(userId);
      let method: ClaimMethod | undefined;
      if (proof.type === "QR") {
        z.string().min(20).max(80).parse(proof.code);
        [method] = await db.query<ClaimMethod>(
          `SELECT * FROM claim_methods WHERE code=$1 AND type='QR' AND active=true`,
          [proof.code],
        );
      } else {
        z.string().max(200).parse(proof.word);
        await throttle(`secret:user:${userId}`, 20);
        await throttle(`secret:${userId}:${proof.slug}`);
        [method] = await db.query<ClaimMethod>(
          `SELECT cm.* FROM claim_methods cm JOIN drops d ON d.id=cm.drop_id WHERE d.slug=$1 AND cm.type='SECRET_WORD' AND cm.active=true`,
          [proof.slug],
        );
        if (
          !method?.config.hash ||
          !(await verifySecret(proof.word, method.config.hash))
        )
          throw new DomainError(
            "SECRET",
            "Esa no es la palabra. Inténtalo de nuevo.",
          );
      }
      if (!method)
        throw new DomainError("NOT_FOUND", "Este enlace no está disponible.");
      return db.transaction(async (tx) => {
        const [drop] = await tx.query<Drop>(
          "SELECT * FROM drops WHERE id=$1 FOR UPDATE",
          [method!.drop_id],
        );
        const [currentMethod] = await tx.query<ClaimMethod>(
          "SELECT * FROM claim_methods WHERE id=$1",
          [method!.id],
        );
        if (
          !currentMethod?.active ||
          JSON.stringify(currentMethod.config) !==
            JSON.stringify(method!.config)
        )
          throw new DomainError(
            "INACTIVE",
            "Este método ya no está disponible.",
          );
        const [existing] = await tx.query<Claim>(
          "SELECT * FROM claims WHERE user_id=$1 AND drop_id=$2",
          [userId, drop.id],
        );
        if (existing)
          throw new DomainError(
            "DUPLICATE",
            "Ya tienes este asado en tu colección.",
          );
        if (drop.status !== "PUBLISHED" || drop.claims_paused)
          throw new DomainError(
            "INACTIVE",
            "Este asado no está recibiendo nuevos recuerdos.",
          );
        if (drop.max_supply !== null && drop.claim_count >= drop.max_supply)
          throw new DomainError(
            "SOLD_OUT",
            "Todos los recuerdos de este asado ya fueron coleccionados.",
          );
        const [claim] = await tx.query<Claim>(
          "INSERT INTO claims(id,user_id,drop_id,claim_method) VALUES($1,$2,$3,$4) RETURNING *",
          [randomUUID(), userId, drop.id, proof.type],
        );
        await tx.query(
          "UPDATE drops SET claim_count=claim_count+1 WHERE id=$1",
          [drop.id],
        );
        return claim;
      });
    },
  };
  const analyticsService = {
    async collectors(userId: string, orgId: string, search = "") {
      await permission(userId, orgId, ["OWNER", "ADMIN"]);
      return db.query<{
        id: string;
        display_name: string;
        email: string;
        drop_count: number;
        last_claim: string;
        drop_titles: string;
        drop_ids: string[];
      }>(
        `SELECT u.id,u.display_name,u.email,count(*)::int drop_count,max(c.claimed_at) last_claim,string_agg(d.title,', ' ORDER BY d.title) drop_titles,array_agg(d.id) drop_ids FROM claims c JOIN users u ON u.id=c.user_id JOIN drops d ON d.id=c.drop_id WHERE d.organization_id=$1 AND (u.email ILIKE $2 OR u.display_name ILIKE $2) GROUP BY u.id ORDER BY last_claim DESC`,
        [orgId, "%" + search.slice(0, 100) + "%"],
      );
    },
    async summary(userId: string, orgId: string) {
      await permission(userId, orgId);
      const drops = await dropService.list(userId, orgId);
      const [totals] = await db.query<{
        claims: number;
        collectors: number;
        month: number;
      }>(
        `SELECT count(*)::int claims,count(DISTINCT c.user_id)::int collectors,count(*) FILTER(WHERE c.claimed_at>=date_trunc('month',now()))::int AS "month" FROM claims c JOIN drops d ON d.id=c.drop_id WHERE d.organization_id=$1`,
        [orgId],
      );
      const timeline = await db.query<{ day: string; count: number }>(
        `SELECT to_char(c.claimed_at,'YYYY-MM-DD') AS "day",count(*)::int count FROM claims c JOIN drops d ON d.id=c.drop_id WHERE d.organization_id=$1 GROUP BY "day" ORDER BY "day"`,
        [orgId],
      );
      const recent = await db.query<{
        display_name: string;
        title: string;
        claimed_at: string;
      }>(
        `SELECT u.display_name,d.title,c.claimed_at FROM claims c JOIN users u ON u.id=c.user_id JOIN drops d ON d.id=c.drop_id WHERE d.organization_id=$1 ORDER BY c.claimed_at DESC LIMIT 8`,
        [orgId],
      );
      const completion = await db.query<{ name: string; completed: number }>(
        `SELECT co.name,(SELECT count(*)::int FROM (SELECT cl.user_id FROM claims cl JOIN drops dr ON dr.id=cl.drop_id WHERE dr.collection_id=co.id GROUP BY cl.user_id HAVING count(DISTINCT dr.id)=(SELECT count(*) FROM drops dd WHERE dd.collection_id=co.id)) done) completed FROM collections co WHERE co.organization_id=$1`,
        [orgId],
      );
      return { ...totals, drops, timeline, recent, completion };
    },
  };
  return {
    userService,
    organizationService,
    collectionService,
    dropService,
    claimService,
    analyticsService,
    throttle,
  };
}
