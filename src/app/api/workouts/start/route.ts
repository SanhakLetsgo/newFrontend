import { NextResponse } from "next/server";
import { getParticipantId } from "@/lib/participant";
import { prisma } from "@/lib/prisma";
import { workoutStartBody } from "@/lib/validations";

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
    const parsed = workoutStartBody.safeParse({ ...body, date: body?.date ?? todayStr() });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { date } = parsed.data;
    if (date !== todayStr()) {
      return NextResponse.json(
        { error: "오늘 날짜에만 시작할 수 있습니다" },
        { status: 400 }
      );
    }
    const now = new Date();
    const startTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const log = await prisma.workoutLog.create({
      data: { userId: participantId, date, attended: true, startTime },
    });
    return NextResponse.json(log);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "처리 실패" }, { status: 500 });
  }
}
