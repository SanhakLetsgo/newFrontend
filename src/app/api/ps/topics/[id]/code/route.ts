import { NextResponse } from "next/server";
import { getParticipantId } from "@/lib/participant";
import { db } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const participantId = await getParticipantId();
  if (!participantId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const { id: topicId } = await params;
  const topic = await db.psTopic.findUnique({ where: { id: topicId } });
  if (!topic) return NextResponse.json({ error: "주제를 찾을 수 없습니다." }, { status: 404 });
  const posts = await db.psCodePost.findMany({
    where: { topicId },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true } } },
  });
  return NextResponse.json(posts);
}
