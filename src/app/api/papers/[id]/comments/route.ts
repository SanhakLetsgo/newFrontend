import { NextResponse } from "next/server";
import { getParticipantId } from "@/lib/participant";
import { prisma } from "@/lib/prisma";
import { paperCommentBody } from "@/lib/validations";
import { createPaperCommentNotifications } from "@/lib/notifications";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const participantId = await getParticipantId();
  if (!participantId) {
    return NextResponse.json({ error: "참여자를 선택해 주세요." }, { status: 401 });
  }
  const { id: paperId } = params;
  const comments = await prisma.paperComment.findMany({
    where: { paperId },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(comments);
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const participantId = await getParticipantId();
  if (!participantId) {
    return NextResponse.json({ error: "참여자를 선택해 주세요." }, { status: 401 });
  }
  const { id: paperId } = params;
  const paper = await prisma.paper.findUnique({ where: { id: paperId }, select: { id: true, title: true } });
  if (!paper) {
    return NextResponse.json({ error: "논문을 찾을 수 없습니다." }, { status: 404 });
  }
  try {
    const body = await req.json();
    const parsed = paperCommentBody.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const comment = await prisma.paperComment.create({
      data: {
        paperId,
        userId: participantId,
        content: parsed.data.content.trim(),
      },
      include: { user: { select: { name: true } } },
    });
    const commenterName = comment.user?.name ?? "알 수 없음";
    createPaperCommentNotifications(paperId, participantId, commenterName, paper.title).catch((err) =>
      console.error("Paper comment notification error:", err)
    );
    return NextResponse.json(comment);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "댓글 등록 실패" }, { status: 500 });
  }
}
