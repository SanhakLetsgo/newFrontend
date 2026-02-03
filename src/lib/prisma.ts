import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/** Prisma client with PS/Note models for type resolution (avoids generated delegate type names) */
type Delegate = {
  findMany: (args?: object) => Promise<unknown[]>;
  findUnique: (args: object) => Promise<unknown | null>;
  create: (args: object) => Promise<unknown>;
  update: (args: object) => Promise<unknown>;
  upsert?: (args: object) => Promise<unknown>;
  delete: (args: object) => Promise<unknown>;
};

export const db = prisma as typeof prisma & {
  psTopic: Delegate;
  psCodePost: Delegate;
  psCodePostComment: Delegate;
  psNote: Delegate;
};
