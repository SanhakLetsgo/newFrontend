import { NextResponse } from "next/server";
import { getParticipantId } from "@/lib/participant";
import { prisma } from "@/lib/prisma";

type NotificationRow = {
  id: string;
  userId: string;
  type: string;
  read: boolean;
  actorId: string;
  actorName: string;
  message: string;
  link: string;
  createdAt: Date;
};

/** 내 알림 목록 (최신순) + 읽지 않은 개수 */
export async function GET() {
  const participantId = await getParticipantId();
  if (!participantId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const notifications = (await (prisma as { notification: { findMany: (args: object) => Promise<NotificationRow[]> } }).notification.findMany({
    where: { userId: participantId },
    orderBy: { createdAt: "desc" },
    take: 50,
  })) as NotificationRow[];

  const unreadCount = notifications.filter((n) => !n.read).length;

  return NextResponse.json({
    notifications: notifications.map((n) => ({
      id: n.id,
      type: n.type,
      read: n.read,
      actorName: n.actorName,
      message: n.message,
      link: n.link,
      createdAt: n.createdAt.toISOString(),
    })),
    unreadCount,
  });
}

/** 알림 읽음 처리 (전체 또는 특정 id) */
export async function PATCH(req: Request) {
  const participantId = await getParticipantId();
  if (!participantId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let body: { id?: string; all?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const where = { userId: participantId } as { userId: string; id?: string };
  if (body.id) where.id = body.id;
  if (body.all) {
    await (prisma as { notification: { updateMany: (args: object) => Promise<unknown> } }).notification.updateMany({
      where: { userId: participantId },
      data: { read: true },
    });
  } else if (body.id) {
    await (prisma as { notification: { updateMany: (args: object) => Promise<unknown> } }).notification.updateMany({
      where: { userId: participantId, id: body.id },
      data: { read: true },
    });
  }

  return NextResponse.json({ ok: true });
}
