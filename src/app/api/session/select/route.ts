import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { participantCookieHeader } from "@/lib/participant";

const bodySchema = z.object({
  name: z.string().min(1, "이름을 선택하세요"),
});

const ALLOWED_NAMES = ["신현호", "창민석", "송수현", "강태영", "이윤지", "조수민"];

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "이름을 선택해 주세요." }, { status: 400 });
    }
    const name = parsed.data.name.trim();
    if (!ALLOWED_NAMES.includes(name)) {
      return NextResponse.json({ error: "허용된 참여자가 아닙니다" }, { status: 400 });
    }
    let user = await prisma.user.findFirst({ where: { name } });
    if (!user) {
      try {
        // Unique email so we don't hit MongoDB's "multiple null = duplicate" on User_email_key
        user = await prisma.user.create({
          data: { name, email: `participant+${encodeURIComponent(name)}-${randomUUID()}@local` },
        });
      } catch (createErr) {
        console.error(createErr);
        user = await prisma.user.findFirst({ where: { name } });
        if (!user) {
          return NextResponse.json(
            { error: "참여자 생성에 실패했습니다. DB 연결을 확인하세요." },
            { status: 500 }
          );
        }
      }
    }
    const res = NextResponse.json({ ok: true });
    for (const [key, value] of Object.entries(participantCookieHeader(user.id))) {
      res.headers.append(key, value);
    }
    return res;
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : "선택 처리 중 오류가 났습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
