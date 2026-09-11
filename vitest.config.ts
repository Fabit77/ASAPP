import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { include: ["tests/**/*.test.ts"], testTimeout: 30000 },
  resolve: {
    alias: {
      "@asapp/core": new URL("./packages/core/src/index.ts", import.meta.url)
        .pathname,
      "@asapp/database": new URL(
        "./packages/database/src/index.ts",
        import.meta.url,
      ).pathname,
    },
  },
});
