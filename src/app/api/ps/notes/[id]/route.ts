import { NextResponse } from "next/server";
import { getParticipantId } from "@/lib/participant";
import { db } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const participantId = await getParticipantId();
  if (!participantId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const { id } = await params;
  const note = await db.psNote.findUnique({ where: { id } }) as { id: string; userId: string } | null;
  if (!note) {
    return NextResponse.json({ error: "노트를 찾을 수 없습니다." }, { status: 404 });
  }
  if (note.userId !== participantId) {
    return NextResponse.json({ error: "삭제 권한이 없습니다." }, { status: 403 });
  }
  await db.psNote.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
