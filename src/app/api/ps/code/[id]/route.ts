import { NextResponse } from "next/server";
import { getParticipantId } from "@/lib/participant";
import { db } from "@/lib/prisma";
import { psCodePostBody } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

type CodePostRow = { userId: string };

export async function PATCH(req: Request, { params }: Params) {
  const participantId = await getParticipantId();
  if (!participantId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const { id } = await params;
  const post = await db.psCodePost.findUnique({ where: { id } }) as CodePostRow | null;
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
    const updated = await db.psCodePost.update({
      where: { id },
      data: {
        ...(parsed.data.title !== undefined && { title: parsed.data.title ?? null }),
        ...(parsed.data.author !== undefined && { author: parsed.data.author?.trim() || null }),
        ...(parsed.data.code !== undefined && { code: parsed.data.code }),
        ...(parsed.data.language !== undefined && { language: parsed.data.language }),
        ...(parsed.data.question !== undefined && { question: parsed.data.question?.trim() || null }),
      },
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
  const post = await db.psCodePost.findUnique({ where: { id } }) as CodePostRow | null;
  if (!post) return NextResponse.json({ error: "코드를 찾을 수 없습니다." }, { status: 404 });
  if (post.userId !== participantId) {
    return NextResponse.json({ error: "삭제 권한이 없습니다." }, { status: 403 });
  }
  await db.psCodePost.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
