import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { randomUUID } from "node:crypto";
import {
  fromPGlite,
  migrate,
  type Database,
} from "../packages/database/src/index";
import {
  createServices,
  hashSecret,
  verifySecret,
  generateClaimCode,
  safeReturnPath,
  DomainError,
} from "../packages/core/src/index";
let pg: PGlite, db: Database, svc: ReturnType<typeof createServices>;
let owner: string, attendee: string, orgId: string, otherOrg: string;
async function makeDrop(options: Record<string, unknown> = {}) {
  const id = await svc.dropService.createDrop(owner, {
    organizationId: orgId,
    title: "La mesa de prueba",
    description: "Una historia",
    artworkUrl: "/artworks/1.svg",
    date: "2026-09-11",
    startDateTime: "2026-09-11T18:00:00Z",
    maxSupply: 17,
    visibility: "PUBLIC",
    status: "PUBLISHED",
    qr: true,
    secretWord: "Sobremesa",
    ...options,
  });
  const methods = await svc.dropService.methods(owner, id);
  const drop = await svc.dropService.admin(owner, id);
  return { drop, code: methods.find((m) => m.type === "QR")!.code! };
}
beforeAll(async () => {
  pg = new PGlite();
  db = fromPGlite(pg);
  await migrate(db);
  svc = createServices(db);
  owner = randomUUID();
  attendee = randomUUID();
  await svc.userService.syncUser({ id: owner, email: "owner@example.com" });
  await svc.userService.syncUser({ id: attendee, email: "guest@example.com" });
  orgId = (
    await svc.organizationService.create(owner, {
      name: "Convidados",
      description: "",
    })
  ).id;
  otherOrg = (
    await svc.organizationService.create(owner, {
      name: "Otra organización",
      description: "",
    })
  ).id;
});
afterAll(async () => {
  await pg.close();
});
describe("Claims on PostgreSQL", () => {
  it("resolves secure QR and persists a claim in the personal collection", async () => {
    const { drop, code } = await makeDrop();
    expect((await svc.claimService.resolveCode(code))?.id).toBe(drop.id);
    const claim = await svc.claimService.claimDrop(attendee, {
      type: "QR",
      code,
    });
    expect(claim.user_id).toBe(attendee);
    expect(
      (await svc.collectionService.getUserCollection(attendee)).some(
        (d) => d.id === drop.id,
      ),
    ).toBe(true);
    const [record] = await db.query<{ external_network: null }>(
      "SELECT external_network FROM claims WHERE id=$1",
      [claim.id],
    );
    expect(record.external_network).toBeNull();
  });
  it("prevents duplicate ownership across different claim methods", async () => {
    const { drop, code } = await makeDrop();
    await svc.claimService.claimDrop(attendee, { type: "QR", code });
    await expect(
      svc.claimService.claimDrop(attendee, {
        type: "SECRET_WORD",
        slug: drop.slug,
        word: "sobremesa",
      }),
    ).rejects.toMatchObject({ code: "DUPLICATE" });
    expect((await svc.dropService.admin(owner, drop.id)).claim_count).toBe(1);
  });
  it("enforces max supply under concurrent contention", async () => {
    const { drop, code } = await makeDrop({ maxSupply: 1 });
    const outcomes = await Promise.allSettled([
      svc.claimService.claimDrop(attendee, { type: "QR", code }),
      svc.claimService.claimDrop(owner, { type: "QR", code }),
    ]);
    expect(outcomes.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(outcomes.filter((r) => r.status === "rejected")).toHaveLength(1);
    expect((await svc.dropService.admin(owner, drop.id)).claim_count).toBe(1);
  });
  it("prevents the eighteenth claim for supply seventeen", async () => {
    const { drop, code } = await makeDrop();
    for (let i = 0; i < 17; i++) {
      const user = randomUUID();
      await svc.userService.syncUser({
        id: user,
        email: user + "@example.com",
      });
      await svc.claimService.claimDrop(user, { type: "QR", code });
    }
    await expect(
      svc.claimService.claimDrop(attendee, { type: "QR", code }),
    ).rejects.toMatchObject({ code: "SOLD_OUT" });
    expect((await svc.dropService.admin(owner, drop.id)).claim_count).toBe(17);
  });
  it("rejects paused, draft and archived drops", async () => {
    for (const operation of ["pause", "archive"] as const) {
      const { drop, code } = await makeDrop();
      await svc.dropService.manage(owner, drop.id, operation);
      await expect(
        svc.claimService.claimDrop(attendee, { type: "QR", code }),
      ).rejects.toMatchObject({ code: "INACTIVE" });
    }
    const { code } = await makeDrop({ status: "DRAFT" });
    expect(await svc.claimService.resolveCode(code)).toBeNull();
    await expect(
      svc.claimService.claimDrop(attendee, { type: "QR", code }),
    ).rejects.toMatchObject({ code: "INACTIVE" });
  });
  it("validates the secret server side and stores only its salted hash", async () => {
    const { drop } = await makeDrop();
    const [method] = await db.query<{ config: { hash: string } }>(
      "SELECT config FROM claim_methods WHERE drop_id=$1 AND type='SECRET_WORD'",
      [drop.id],
    );
    expect(JSON.stringify(method)).not.toContain("Sobremesa");
    expect(await verifySecret(" SOBREMESA ", method.config.hash)).toBe(true);
    await expect(
      svc.claimService.claimDrop(attendee, {
        type: "SECRET_WORD",
        slug: drop.slug,
        word: "wrong",
      }),
    ).rejects.toMatchObject({ code: "SECRET" });
    await svc.claimService.claimDrop(attendee, {
      type: "SECRET_WORD",
      slug: drop.slug,
      word: "sobremesa",
    });
    expect(await svc.claimService.owned(attendee, drop.id)).toBeTruthy();
  });
  it("persists secret attempt rate limits across service instances", async () => {
    const { drop } = await makeDrop();
    for (let i = 0; i < 5; i++)
      await expect(
        svc.claimService.claimDrop(attendee, {
          type: "SECRET_WORD",
          slug: drop.slug,
          word: "wrong",
        }),
      ).rejects.toBeInstanceOf(DomainError);
    await expect(
      createServices(db).claimService.claimDrop(attendee, {
        type: "SECRET_WORD",
        slug: drop.slug,
        word: "sobremesa",
      }),
    ).rejects.toMatchObject({ code: "RATE_LIMIT" });
  });
  it("returns null for unknown and guessable codes", async () => {
    expect(await svc.claimService.resolveCode("123")).toBeNull();
    expect(await svc.claimService.resolveCode(generateClaimCode())).toBeNull();
  });
});
describe("Organization permissions and privacy", () => {
  it("blocks nonmembers from creating drops and viewing collectors", async () => {
    await expect(
      svc.organizationService.permission(attendee, orgId),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      svc.analyticsService.collectors(attendee, orgId),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("lets editors manage drops but denies collector emails and team administration", async () => {
    await svc.organizationService.setMember(
      owner,
      orgId,
      "guest@example.com",
      "EDITOR",
    );
    await svc.organizationService.permission(attendee, orgId, ["EDITOR"]);
    await expect(
      svc.analyticsService.collectors(attendee, orgId),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      svc.organizationService.setMember(
        attendee,
        orgId,
        "owner@example.com",
        "ADMIN",
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("prevents cross-organization collection references at the database boundary", async () => {
    const collection = await svc.collectionService.save(owner, {
      organizationId: otherOrg,
      name: "Otra historia",
      description: "",
    });
    await expect(makeDrop({ collectionId: collection })).rejects.toThrow();
  });
  it("does not expose private drops or private profiles publicly", async () => {
    const { drop, code } = await makeDrop({ visibility: "PRIVATE" });
    expect(await svc.dropService.bySlug(drop.slug)).toBeNull();
    expect(
      (await svc.dropService.explore()).find((d) => d.id === drop.id),
    ).toBeUndefined();
    await svc.claimService.claimDrop(attendee, { type: "QR", code });
    expect(
      (await svc.collectionService.publicUserCollection(attendee)).some(
        (d) => d.id === drop.id,
      ),
    ).toBe(false);
    await svc.userService.update(attendee, {
      displayName: "Invitado",
      username: "invitado",
      bio: "",
      city: "",
      isPublic: false,
    });
    expect(await svc.userService.publicProfile("invitado")).toBeNull();
    await svc.userService.update(attendee, {
      displayName: "Invitado",
      username: "invitado",
      bio: "",
      city: "",
      isPublic: true,
    });
    expect(await svc.userService.publicProfile("invitado")).not.toHaveProperty(
      "email",
    );
  });
  it("scopes collector details to the requesting organization", async () => {
    const { code, drop } = await makeDrop({
      organizationId: otherOrg,
      title: "Encuentro confidencial",
    });
    await svc.claimService.claimDrop(attendee, { type: "QR", code });
    const records = await svc.analyticsService.collectors(owner, orgId);
    expect(records.find((r) => r.id === attendee)?.drop_titles).not.toContain(
      drop.title,
    );
  });
});
it("calculates 3 / 8 collection completion from actual ownership", async () => {
  const collectionId = await svc.collectionService.save(owner, {
    organizationId: orgId,
    name: "Temporada",
    description: "",
  });
  for (let i = 0; i < 8; i++) {
    const { code } = await makeDrop({ collectionId });
    if (i < 3) await svc.claimService.claimDrop(attendee, { type: "QR", code });
  }
  const progress = await svc.collectionService.progress(collectionId, attendee);
  expect(progress.collected).toBe(3);
  expect(progress.total).toBe(8);
});
it("generates independent codes and hashes, and rejects external return URLs", async () => {
  expect(generateClaimCode()).not.toBe(generateClaimCode());
  expect(generateClaimCode().length).toBe(32);
  expect(await hashSecret("a")).not.toBe(await hashSecret("a"));
  for (const path of [
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
  ])
    expect(safeReturnPath(path)).toBe("/collection");
  expect(safeReturnPath("/claim/abc")).toBe("/claim/abc");
});
it("loads organization analytics including empty and completed collections", async () => {
  const summary = await svc.analyticsService.summary(owner, orgId);
  expect(summary.claims).toBeGreaterThan(0);
  expect(summary.collectors).toBeGreaterThan(0);
  expect(summary.month).toBeGreaterThanOrEqual(0);
  expect(summary.timeline.length).toBeGreaterThan(0);
  expect(Array.isArray(summary.completion)).toBe(true);
});
it("converts Santiago dates using summer and winter offsets", async () => {
  const { chileInstant } = await import("../packages/core/src/dates");
  expect(chileInstant("2026-01-15", "18:00")).toBe("2026-01-15T21:00:00.000Z");
  expect(chileInstant("2026-07-15", "18:00")).toBe("2026-07-15T22:00:00.000Z");
  expect(chileInstant("", "")).toBe("");
});
