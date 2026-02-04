import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const prismaClient =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prismaClient;

/** Delegate type for models that may not be in PrismaClient typings */
type Delegate = {
  findMany: (args?: object) => Promise<unknown[]>;
  findUnique: (args: object) => Promise<unknown | null>;
  create: (args: object) => Promise<unknown>;
  update: (args: object) => Promise<unknown>;
  upsert?: (args: object) => Promise<unknown>;
  delete: (args: object) => Promise<unknown>;
};

type PrismaExtended = PrismaClient & {
  psTopic: Delegate;
  psCodePost: Delegate;
  psCodePostComment: Delegate;
  psNote: Delegate;
  psTopicMaterial: Delegate;
  codingBattleProblem: Delegate;
  codingBattleSubmission: Delegate;
  workoutBattle: Delegate;
};

export const prisma = prismaClient as PrismaExtended;

export const db = prisma;
