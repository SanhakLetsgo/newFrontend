import { NextResponse } from "next/server";
import { getParticipantId } from "@/lib/participant";
import { prisma } from "@/lib/prisma";
import { psNoteBody } from "@/lib/validations";

type PsNoteDelegate = {
  findMany: (args: { where: object; orderBy?: object }) => Promise<unknown[]>;
  upsert: (args: object) => Promise<unknown>;
};
const db = prisma as typeof prisma & { psNote: PsNoteDelegate };

export async function GET(req: Request) {
  const participantId = await getParticipantId();
  if (!participantId) {
    return NextResponse.json({ error: "참여자를 선택해 주세요." }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const where: { userId: string; date?: { gte?: string; lte?: string } } = { userId: participantId };
  if (from && dateRegex.test(from)) where.date = { ...where.date, gte: from };
  if (to && dateRegex.test(to)) where.date = { ...where.date, lte: to };
  const notes = await db.psNote.findMany({
    where,
    orderBy: { date: "desc" },
  });
  return NextResponse.json(notes);
}

export async function POST(req: Request) {
  const participantId = await getParticipantId();
  if (!participantId) {
    return NextResponse.json({ error: "참여자를 선택해 주세요." }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = psNoteBody.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { date, content } = parsed.data;
    const note = await db.psNote.upsert({
      where: {
        userId_date: { userId: participantId, date },
      },
      create: {
        userId: participantId,
        date,
        content: content ?? "",
      },
      update: { content: content ?? "" },
    });
    return NextResponse.json(note);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "처리 실패" }, { status: 500 });
  }
}
