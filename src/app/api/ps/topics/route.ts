import { NextResponse } from "next/server";
import { getParticipantId } from "@/lib/participant";
import { prisma } from "@/lib/prisma";
import { psTopicBody } from "@/lib/validations";

export async function GET() {
  const participantId = await getParticipantId();
  if (!participantId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const topics = await prisma.psTopic.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true } },
      _count: { select: { codePosts: true } },
    },
  });
  return NextResponse.json(topics);
}

export async function POST(req: Request) {
  const participantId = await getParticipantId();
  if (!participantId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = psTopicBody.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const topic = await prisma.psTopic.create({
      data: {
        userId: participantId,
        title: parsed.data.title,
        kind: parsed.data.kind,
      },
      include: {
        user: { select: { id: true, name: true } },
        _count: { select: { codePosts: true } },
      },
    });
    return NextResponse.json(topic);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "처리 실패" }, { status: 500 });
  }
}
