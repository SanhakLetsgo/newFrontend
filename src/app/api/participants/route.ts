import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET() {
  const users = await prisma.user.findMany({
    where: { name: { not: null } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(
    users.map((u) => ({ id: u.id, name: u.name ?? "" }))
  );
}

const bodySchema = z.object({
  name: z.string().min(1, "이름을 입력하세요").max(50),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { name } = parsed.data;
    const trimmed = name.trim();
    // Unique email so we don't hit MongoDB's "multiple null = duplicate" on User_email_key
    const user = await prisma.user.create({
      data: { name: trimmed, email: `participant+${encodeURIComponent(trimmed)}-${randomUUID()}@local` },
    });
    return NextResponse.json({ id: user.id, name: user.name });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "추가 실패" }, { status: 500 });
  }
}
