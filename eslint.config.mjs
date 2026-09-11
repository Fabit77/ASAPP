import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
export default defineConfig([
  ...nextVitals,
  { settings: { next: { rootDir: "apps/web/" } } },
  globalIgnores(["**/.next/**", "**/node_modules/**", "**/.data/**"]),
]);
