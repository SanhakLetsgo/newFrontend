import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getParticipantId } from "@/lib/participant";
import { prisma } from "@/lib/prisma";
import { workoutCreateBody } from "@/lib/validations";

export async function POST(req: Request) {
  const participantId = await getParticipantId();
  if (!participantId) {
    return NextResponse.json({ error: "참여자를 선택해 주세요." }, { status: 401 });
  }
  try {
    const user = await prisma.user.findUnique({ where: { id: participantId }, select: { id: true } });
    if (!user) {
      return NextResponse.json(
        { error: "로그인 정보가 만료되었거나 사용자를 찾을 수 없습니다. 다시 로그인해 주세요." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = workoutCreateBody.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstMessage = Object.values(fieldErrors).flat().find(Boolean);
      return NextResponse.json(
        { error: typeof firstMessage === "string" ? firstMessage : "입력값을 확인해 주세요.", fieldErrors },
        { status: 400 }
      );
    }
    const { date, attended, startTime, endTime, workoutType, reps, calories, details } = parsed.data;
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

    const caloriesInt = calories != null && Number.isFinite(Number(calories)) ? Math.round(Number(calories)) : null;
    const repsInt = reps != null && Number.isFinite(Number(reps)) ? Math.round(Number(reps)) : null;
    const workoutTypeVal = workoutType?.trim() || null;
    const startTimeVal = startTime?.trim() || null;
    const endTimeVal = endTime?.trim() || null;

    let detailsJson: Prisma.InputJsonValue | null = null;
    if (details && typeof details === "object" && !Array.isArray(details) && Object.keys(details).length > 0) {
      try {
        detailsJson = JSON.parse(JSON.stringify(details)) as Prisma.InputJsonValue;
      } catch {
        detailsJson = null;
      }
    }

    const log = await prisma.workoutLog.create({
      data: {
        userId: participantId,
        date,
        attended: attended ?? false,
        startTime: startTimeVal,
        endTime: endTimeVal,
        workoutType: workoutTypeVal,
        ...(repsInt != null && { reps: repsInt }),
        ...(caloriesInt != null && { calories: caloriesInt }),
        ...(detailsJson != null && { details: detailsJson }),
      } as Prisma.WorkoutLogUncheckedCreateInput,
    });
    return NextResponse.json(log);
  } catch (e) {
    console.error("workouts POST error:", e);
    const message = e instanceof Error ? e.message : "처리 실패";
    return NextResponse.json({ error: "처리 실패", debug: message }, { status: 500 });
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
