import {
  getDatabase,
  migrate,
  isLocalDemo,
} from "../packages/database/src/index";
import { seed } from "../packages/database/src/seed";
async function main() {
  const command = process.argv[2];
  const db = await getDatabase();
  if (command === "reset") {
    if (!isLocalDemo())
      throw new Error(
        "Reset is restricted to the isolated local demo database.",
      );
    await db.query(
      "TRUNCATE claims,claim_methods,drops,collections,organization_members,organizations,users,rate_limits CASCADE",
    );
    await seed(db);
  } else if (command === "migrate") await migrate(db);
  else if (command === "seed") {
    if (
      process.env.NODE_ENV === "production" &&
      process.env.ALLOW_DEMO_SEED !== "true"
    )
      throw new Error(
        "Production seed requires ALLOW_DEMO_SEED=true. Use a staging database.",
      );
    await migrate(db);
    await seed(db);
  } else throw new Error("Use migrate, seed or reset");
  console.log("Database operation complete.");
}
main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
