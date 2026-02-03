import { NextResponse } from "next/server";
import { getParticipantId } from "@/lib/participant";
import { prisma } from "@/lib/prisma";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export async function GET() {
  const participantId = await getParticipantId();
  if (!participantId) {
    return NextResponse.json({ error: "참여자를 선택해 주세요." }, { status: 401 });
  }
  const sessions = await prisma.workoutLog.findMany({
    where: { userId: participantId, date: todayStr() },
  });
  const sorted = [...sessions].sort((a, b) => {
    const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bt - at;
  });
  return NextResponse.json(sorted);
}
