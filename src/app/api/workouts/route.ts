import { NextResponse } from "next/server";
import { getParticipantId } from "@/lib/participant";
import { prisma } from "@/lib/prisma";
import { workoutCreateBody } from "@/lib/validations";

export async function POST(req: Request) {
  const participantId = await getParticipantId();
  if (!participantId) {
    return NextResponse.json({ error: "참여자를 선택해 주세요." }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = workoutCreateBody.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { date, attended, startTime, endTime, workoutType, details } = parsed.data;
    if (startTime && endTime) {
      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);
      if (eh < sh || (eh === sh && em < sm)) {
        return NextResponse.json(
          { error: "종료 시간은 시작 시간보다 이후여야 합니다" },
          { status: 400 }
        );
      }
    }
    const log = await prisma.workoutLog.create({
      data: {
        userId: participantId,
        date,
        attended: attended ?? false,
        startTime: startTime?.trim() || null,
        endTime: endTime?.trim() || null,
        workoutType: workoutType?.trim() || null,
        details: details && Object.keys(details).length > 0 ? details : undefined,
      },
    });
    return NextResponse.json(log);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "처리 실패" }, { status: 500 });
  }
}

export async function GET() {
  const participantId = await getParticipantId();
  if (!participantId) {
    return NextResponse.json({ error: "참여자를 선택해 주세요." }, { status: 401 });
  }
  const today = new Date();
  const from = new Date(today);
  from.setDate(from.getDate() - 14);
  const fromStr = from.toISOString().slice(0, 10);
  const toStr = today.toISOString().slice(0, 10);
  const logs = await prisma.workoutLog.findMany({
    where: {
      userId: participantId,
      date: { gte: fromStr, lte: toStr },
    },
  });
  logs.sort(
    (a, b) =>
      b.date.localeCompare(a.date) ||
      (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0)
  );
  return NextResponse.json(logs);
}
