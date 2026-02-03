import { NextResponse } from "next/server";
import { getParticipantId } from "@/lib/participant";
import { prisma } from "@/lib/prisma";
import { psCodePostBody } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const participantId = await getParticipantId();
  if (!participantId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const { id } = await params;
  const post = await prisma.psCodePost.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "코드를 찾을 수 없습니다." }, { status: 404 });
  if (post.userId !== participantId) {
    return NextResponse.json({ error: "수정 권한이 없습니다." }, { status: 403 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = psCodePostBody.partial().omit({ topicId: true }).safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const updated = await prisma.psCodePost.update({
      where: { id },
      data: parsed.data,
      include: { user: { select: { id: true, name: true } } },
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
  const post = await prisma.psCodePost.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "코드를 찾을 수 없습니다." }, { status: 404 });
  if (post.userId !== participantId) {
    return NextResponse.json({ error: "삭제 권한이 없습니다." }, { status: 403 });
  }
  await prisma.psCodePost.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
