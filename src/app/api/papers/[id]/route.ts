import { NextResponse } from "next/server";
import { getParticipantId } from "@/lib/participant";
import { prisma } from "@/lib/prisma";
import { paperBody } from "@/lib/validations";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const participantId = await getParticipantId();
  if (!participantId) {
    return NextResponse.json({ error: "참여자를 선택해 주세요." }, { status: 401 });
  }
  const { id } = await params;
  const paper = await prisma.paper.findUnique({
    where: { id },
    include: {
      review: true,
      user: { select: { name: true } },
      comments: { include: { user: { select: { name: true } } }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!paper) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(paper);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const participantId = await getParticipantId();
  if (!participantId) {
    return NextResponse.json({ error: "참여자를 선택해 주세요." }, { status: 401 });
  }
  const { id } = await params;
  try {
    const body = await req.json();
    const parsed = paperBody.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const existing = await prisma.paper.findFirst({
      where: { id, userId: participantId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const paper = await prisma.paper.update({
      where: { id },
      data: {
        ...(parsed.data.title != null && { title: parsed.data.title }),
        ...(parsed.data.url !== undefined && { url: parsed.data.url || null }),
        ...(parsed.data.tags != null && { tags: parsed.data.tags }),
        ...(parsed.data.readAt != null && { readAt: parsed.data.readAt }),
      },
    });
    return NextResponse.json(paper);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "수정 실패" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const participantId = await getParticipantId();
  if (!participantId) {
    return NextResponse.json({ error: "참여자를 선택해 주세요." }, { status: 401 });
  }
  const { id } = await params;
  const paper = await prisma.paper.findFirst({
    where: { id, userId: participantId },
  });
  if (!paper) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.paper.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
