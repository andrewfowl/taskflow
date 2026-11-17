import { PrismaClient } from "@prisma/client";

// Reuse a single PrismaClient across hot-reloads in dev and across lambda
// invocations in serverless. Standard Prisma + Next.js pattern.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // The Vercel Neon integration injects prefixed variables; fall back to its
    // pooled Prisma URL when no explicit DATABASE_URL is set (e.g. Development).
    datasourceUrl:
      process.env.DATABASE_URL || process.env.NEON_POSTGRES_PRISMA_URL,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
