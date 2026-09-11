import postgres from "postgres";
import { PGlite } from "@electric-sql/pglite";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
export type Row = Record<string, unknown>;
export interface Database {
  query<T = Row>(sql: string, params?: unknown[]): Promise<T[]>;
  transaction<T>(fn: (db: Database) => Promise<T>): Promise<T>;
}
export function fromPGlite(pg: PGlite): Database {
  return {
    query: async <T>(sql: string, params: unknown[] = []) =>
      (await pg.query<T>(sql, params)).rows,
    transaction: (fn) =>
      pg.transaction((tx) =>
        fn({
          query: async <T>(sql: string, params: unknown[] = []) =>
            (await tx.query<T>(sql, params)).rows,
          transaction: () => {
            throw new Error("Nested transaction unsupported");
          },
        }),
      ),
  };
}
export function workspaceRoot() {
  const cwd = process.cwd();
  return cwd.endsWith(path.join("apps", "web"))
    ? path.resolve(cwd, "../..")
    : cwd;
}
export async function migrate(db: Database) {
  await db.query(
    "CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY)",
  );
  const rows = await db.query(
    "SELECT version FROM schema_migrations WHERE version=$1",
    ["001"],
  );
  if (!rows.length)
    await db.transaction(async (tx) => {
      const source = await readFile(
        path.join(
          workspaceRoot(),
          "packages/database/migrations/001_initial.sql",
        ),
        "utf8",
      );
      for (const statement of source
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean))
        await tx.query(statement);
      await tx.query("INSERT INTO schema_migrations(version) VALUES ($1)", [
        "001",
      ]);
    });
}
const globalDb = globalThis as unknown as { asappDatabase?: Promise<Database> };
export const isLocalDemo = () =>
  !process.env.DATABASE_URL &&
  (process.env.ASAPP_HOSTED_DEMO === "true" ||
    (process.env.NODE_ENV !== "production" &&
      !process.env.VERCEL &&
      process.env.ASAPP_LOCAL_DEMO !== "false"));
export async function getDatabase(): Promise<Database> {
  if (!globalDb.asappDatabase)
    globalDb.asappDatabase = (async () => {
      if (process.env.DATABASE_URL) {
        const sql = postgres(process.env.DATABASE_URL, {
          prepare: false,
          max: 5,
          ssl: process.env.DATABASE_SSL === "false" ? false : "require",
        });
        const wrap = (client: typeof sql): Database => ({
          query: async <T>(q: string, p: unknown[] = []) =>
            (await client.unsafe(q, p as never[])) as unknown as T[],
          transaction: (fn) =>
            sql.begin((tx) => fn(wrap(tx as unknown as typeof sql))) as Promise<
              Awaited<ReturnType<typeof fn>>
            >,
        });
        return wrap(sql);
      }
      if (!isLocalDemo())
        throw new Error(
          "Configura DATABASE_URL y Supabase para activar ASAPP.",
        );
      const hostedDemo = process.env.ASAPP_HOSTED_DEMO === "true";
      const directory = path.join(workspaceRoot(), ".data");
      if (!hostedDemo) await mkdir(directory, { recursive: true });
      const db = fromPGlite(
        new PGlite(hostedDemo ? undefined : path.join(directory, "postgres")),
      );
      await migrate(db);
      const { seed } = await import("./seed");
      await seed(db);
      return db;
    })();
  return globalDb.asappDatabase;
}
