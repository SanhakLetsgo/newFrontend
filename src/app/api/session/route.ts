import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { participantCookieHeader } from "@/lib/participant";

const bodySchema = z.object({
  participantId: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid" }, { status: 400 });
    }
    const { participantId } = parsed.data;
    const user = await prisma.user.findUnique({
      where: { id: participantId },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "참여자를 찾을 수 없습니다" }, { status: 404 });
    }
    const res = NextResponse.json({ ok: true });
    Object.entries(participantCookieHeader(participantId)).forEach(([key, value]) => {
      res.headers.append(key, value);
    });
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "실패" }, { status: 500 });
  }
}
