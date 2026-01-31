import { NextResponse } from "next/server";
import { getParticipantId } from "@/lib/participant";
import { prisma } from "@/lib/prisma";
import { workoutLogBody } from "@/lib/validations";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const participantId = await getParticipantId();
  if (!participantId) {
    return NextResponse.json({ error: "참여자를 선택해 주세요." }, { status: 401 });
  }
  const { id } = await params;
  try {
    const body = await req.json();
    const parsed = workoutLogBody.pick({ attended: true, startTime: true, endTime: true }).partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const existing = await prisma.workoutLog.findUnique({
      where: { id },
    });
    if (!existing || existing.userId !== participantId) {
      return NextResponse.json({ error: "기록을 찾을 수 없습니다." }, { status: 404 });
    }
    const { attended, startTime, endTime } = parsed.data;
    const s = startTime !== undefined ? (startTime?.trim() || null) : existing.startTime;
    const e = endTime !== undefined ? (endTime?.trim() || null) : existing.endTime;
    if (s && e) {
      const [sh, sm] = s.split(":").map(Number);
      const [eh, em] = e.split(":").map(Number);
      if (eh < sh || (eh === sh && em <= sm)) {
        return NextResponse.json(
          { error: "종료 시간은 시작 시간보다 이후여야 합니다" },
          { status: 400 }
        );
      }
    }
    const log = await prisma.workoutLog.update({
      where: { id },
      data: {
        ...(attended !== undefined && { attended }),
        ...(startTime !== undefined && { startTime: startTime?.trim() || null }),
        ...(endTime !== undefined && { endTime: endTime?.trim() || null }),
      },
    });
    return NextResponse.json(log);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "처리 실패" }, { status: 500 });
  }
}
