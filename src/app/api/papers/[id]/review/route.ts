import { NextResponse } from "next/server";
import { getParticipantId } from "@/lib/participant";
import { prisma } from "@/lib/prisma";
import { paperReviewBody } from "@/lib/validations";

export async function GET(
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
    include: { review: true },
  });
  if (!paper) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(paper.review ?? null);
}

export async function PUT(
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
    const parsed = paperReviewBody.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const paper = await prisma.paper.findFirst({
      where: { id, userId: participantId },
      include: { review: true },
    });
    if (!paper) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const { summary, contribution, method, experiment, limitation, idea } =
      parsed.data;
    const review = await prisma.paperReview.upsert({
      where: { paperId: id },
      create: {
        paperId: id,
        userId: participantId,
        summary: summary ?? null,
        contribution: contribution ?? null,
        method: method ?? null,
        experiment: experiment ?? null,
        limitation: limitation ?? null,
        idea: idea ?? null,
      },
      update: {
        summary: summary ?? null,
        contribution: contribution ?? null,
        method: method ?? null,
        experiment: experiment ?? null,
        limitation: limitation ?? null,
        idea: idea ?? null,
      },
    });
    return NextResponse.json(review);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "리뷰 저장 실패" }, { status: 500 });
  }
}
