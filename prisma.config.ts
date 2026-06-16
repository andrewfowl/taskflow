import path from "node:path";

import { defineConfig } from "prisma/config";

// Prisma 7 removes the `package.json#prisma` config block, so Prisma
// configuration lives here instead.
//
// Note: defining a Prisma config file disables Prisma's automatic `.env`
// loading, so we load it ourselves for local CLI commands (migrate, db push,
// seed). In CI/production DATABASE_URL is already present in the environment
// and no `.env` file exists, so this is best-effort and ignores a missing file.
try {
  process.loadEnvFile();
} catch {
  // No local .env file — rely on the real environment variables.
}

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
