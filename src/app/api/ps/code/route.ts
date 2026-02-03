import { NextResponse } from "next/server";
import { getParticipantId } from "@/lib/participant";
import { prisma } from "@/lib/prisma";
import { psCodePostBody } from "@/lib/validations";

export async function POST(req: Request) {
  const participantId = await getParticipantId();
  if (!participantId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = psCodePostBody.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const topic = await prisma.psTopic.findUnique({
      where: { id: parsed.data.topicId },
    });
    if (!topic) {
      return NextResponse.json({ error: "주제를 찾을 수 없습니다." }, { status: 404 });
    }
    const post = await prisma.psCodePost.create({
      data: {
        topicId: parsed.data.topicId,
        userId: participantId,
        kind: parsed.data.kind,
        title: parsed.data.title ?? null,
        code: parsed.data.code,
        language: parsed.data.language,
      },
      include: { user: { select: { id: true, name: true } } },
    });
    return NextResponse.json(post);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "처리 실패" }, { status: 500 });
  }
}
