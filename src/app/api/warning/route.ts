import { NextResponse } from "next/server";
import { getParticipantId } from "@/lib/participant";
import { prisma } from "@/lib/prisma";

type EntryRow = {
  id: string;
  userId: string;
  targetName: string;
  count: number;
  weight: number;
  memo: string | null;
  createdAt: Date;
  user: { name: string | null } | null;
};


export async function GET() {
  const participantId = await getParticipantId();
  if (!participantId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const entries = (await prisma.warningBoardEntry.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: { select: { name: true } } },
  })) as unknown as EntryRow[];
  return NextResponse.json({
    entries: entries.map((e) => ({
      id: e.id,
      userId: e.userId,
      addedByName: e.user?.name ?? "이름 없음",
      targetName: e.targetName,
      count: e.count,
      weight: typeof e.weight === "number" ? e.weight : 100,
      memo: e.memo ?? null,
      createdAt: e.createdAt.toISOString(),
    })),
    currentUserId: participantId,
  });
}

export async function POST(req: Request) {
  const participantId = await getParticipantId();
  if (!participantId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  let body: { targetName?: string; count?: number; weight?: number; memo?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const targetName = typeof body.targetName === "string" ? body.targetName.trim() : "";
  const count =
    typeof body.count === "number"
      ? Math.round(body.count)
      : typeof body.count === "string"
        ? Math.round(Number(body.count))
        : NaN;
  const weightRaw =
    typeof body.weight === "number"
      ? Math.round(body.weight)
      : typeof body.weight === "string"
        ? Math.round(Number(body.weight))
        : 100;
  const weight = Number.isFinite(weightRaw) && weightRaw >= 0 && weightRaw <= 100 ? weightRaw : 100;
  const memo = typeof body.memo === "string" ? body.memo.trim() || null : null;

  if (!targetName) {
    return NextResponse.json({ error: "대상 이름을 입력해 주세요." }, { status: 400 });
  }
  if (!Number.isFinite(count) || count < 1) {
    return NextResponse.json({ error: "횟수는 1 이상으로 입력해 주세요." }, { status: 400 });
  }

  const created = (await prisma.warningBoardEntry.create({
    data: {
      userId: participantId,
      targetName,
      count,
      weight,
      memo: memo ?? undefined,
    },
    include: { user: { select: { name: true } } },
  })) as unknown as EntryRow & { createdAt: Date };

  return NextResponse.json({
    id: created.id,
    userId: created.userId,
    addedByName: created.user?.name ?? "이름 없음",
    targetName: created.targetName,
    count: created.count,
    weight: typeof created.weight === "number" ? created.weight : 100,
    memo: created.memo ?? null,
    createdAt: created.createdAt.toISOString(),
  });
}
