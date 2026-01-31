import { NextResponse } from "next/server";
import { getParticipantId } from "@/lib/participant";
import { prisma } from "@/lib/prisma";
import { workoutLogBody } from "@/lib/validations";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(req: Request) {
  const participantId = await getParticipantId();
  if (!participantId) {
    return NextResponse.json({ error: "참여자를 선택해 주세요." }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = workoutLogBody.safeParse({ ...body, date: body?.date ?? todayStr() });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { date, attended } = parsed.data;
    const todayLogs = await prisma.workoutLog.findMany({
      where: { userId: participantId, date },
    });
    const value = attended ?? true;
    if (todayLogs.length === 0) {
      const log = await prisma.workoutLog.create({
        data: { userId: participantId, date, attended: value },
      });
      return NextResponse.json(log);
    }
    await prisma.workoutLog.updateMany({
      where: { userId: participantId, date },
      data: { attended: value },
    });
    return NextResponse.json({ ...todayLogs[0], attended: value });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "처리 실패" }, { status: 500 });
  }
}
