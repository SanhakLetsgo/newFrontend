import { NextResponse } from "next/server";
import { getParticipantId } from "@/lib/participant";
import { db } from "@/lib/prisma";
import { psTopicBody } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const participantId = await getParticipantId();
  if (!participantId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const { id } = await params;
  const topic = await db.psTopic.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true } },
      codePosts: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });
  if (!topic) return NextResponse.json({ error: "주제를 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json(topic);
}

type TopicRow = { userId: string };

export async function PATCH(req: Request, { params }: Params) {
  const participantId = await getParticipantId();
  if (!participantId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const { id } = await params;
  const topic = await db.psTopic.findUnique({ where: { id } }) as TopicRow | null;
  if (!topic) return NextResponse.json({ error: "주제를 찾을 수 없습니다." }, { status: 404 });
  if (topic.userId !== participantId) {
    return NextResponse.json({ error: "수정 권한이 없습니다." }, { status: 403 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = psTopicBody.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const updated = await db.psTopic.update({
      where: { id },
      data: parsed.data,
      include: {
        user: { select: { id: true, name: true } },
        _count: { select: { codePosts: true } },
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "처리 실패" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const participantId = await getParticipantId();
  if (!participantId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const { id } = await params;
  const topic = await db.psTopic.findUnique({ where: { id } }) as TopicRow | null;
  if (!topic) return NextResponse.json({ error: "주제를 찾을 수 없습니다." }, { status: 404 });
  if (topic.userId !== participantId) {
    return NextResponse.json({ error: "삭제 권한이 없습니다." }, { status: 403 });
  }
  await db.psTopic.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
