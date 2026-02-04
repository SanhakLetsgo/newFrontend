import { NextResponse } from "next/server";
import { getParticipantId } from "@/lib/participant";
import { db } from "@/lib/prisma";

type Params = { params: Promise<{ id: string; commentId: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const participantId = await getParticipantId();
  if (!participantId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const { id: codePostId, commentId } = await params;

  const comment = await db.psCodePostComment.findUnique({
    where: { id: commentId },
    include: { codePost: true },
  }) as { id: string; codePostId: string; userId: string; codePost: { userId: string } } | null;

  if (!comment || comment.codePostId !== codePostId) {
    return NextResponse.json({ error: "댓글을 찾을 수 없습니다." }, { status: 404 });
  }

  // 코드 글쓴이(피드백 요청자) 또는 댓글 글쓴이만 삭제 가능
  const isPostAuthor = comment.codePost.userId === participantId;
  const isCommentAuthor = comment.userId === participantId;
  if (!isPostAuthor && !isCommentAuthor) {
    return NextResponse.json({ error: "삭제 권한이 없습니다." }, { status: 403 });
  }

  await db.psCodePostComment.delete({ where: { id: commentId } });
  return NextResponse.json({ ok: true });
}
