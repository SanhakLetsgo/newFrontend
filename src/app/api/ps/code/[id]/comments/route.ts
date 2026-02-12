import { NextResponse } from "next/server";
import { getParticipantId } from "@/lib/participant";
import { db } from "@/lib/prisma";
import { psCodePostCommentBody } from "@/lib/validations";
import { createCodeCommentNotifications } from "@/lib/notifications";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const participantId = await getParticipantId();
  if (!participantId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const { id: codePostId } = await params;
  const post = await db.psCodePost.findUnique({ where: { id: codePostId } });
  if (!post) return NextResponse.json({ error: "코드를 찾을 수 없습니다." }, { status: 404 });
  const comments = await db.psCodePostComment.findMany({
    where: { codePostId },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { id: true, name: true } } },
  });
  return NextResponse.json(comments);
}

export async function POST(req: Request, { params }: Params) {
  const participantId = await getParticipantId();
  if (!participantId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const { id: codePostId } = await params;
  const post = await db.psCodePost.findUnique({ where: { id: codePostId } });
  if (!post) return NextResponse.json({ error: "코드를 찾을 수 없습니다." }, { status: 404 });
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = psCodePostCommentBody.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const comment = (await db.psCodePostComment.create({
      data: {
        codePostId,
        userId: participantId,
        content: parsed.data.content.trim(),
        code: parsed.data.code?.trim() || null,
        language: parsed.data.language?.trim() || null,
      },
      include: { user: { select: { id: true, name: true } } },
    })) as { user: { id: string; name: string | null } | null };
    const commenterName = comment.user?.name ?? "알 수 없음";
    createCodeCommentNotifications(codePostId, participantId, commenterName).catch((err) =>
      console.error("Code comment notification error:", err)
    );
    return NextResponse.json(comment);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "처리 실패" }, { status: 500 });
  }
}
