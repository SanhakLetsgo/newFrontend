/**
 * WorkoutLog 문서 중 created_at이 없는 레코드에 기본값 추가
 * 실행: npx tsx scripts/fix-created-at.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await (prisma as any).$runCommandRaw({
    update: "workout_logs",
    updates: [
      {
        q: { created_at: { $exists: false } },
        u: { $set: { created_at: { $date: "2020-01-01T00:00:00.000Z" } } },
        multi: true,
      },
    ],
  });
  console.log("Updated workout_logs:", result);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
