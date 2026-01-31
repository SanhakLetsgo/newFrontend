import { NextResponse } from "next/server";
import { getParticipantId } from "@/lib/participant";
import { prisma } from "@/lib/prisma";
import { paperBody } from "@/lib/validations";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function GET() {
  const participantId = await getParticipantId();
  if (!participantId) {
    return NextResponse.json({ error: "참여자를 선택해 주세요." }, { status: 401 });
  }
  const papers = await prisma.paper.findMany({
    where: { userId: participantId },
    include: { review: true },
    orderBy: { readAt: "desc" },
  });
  return NextResponse.json(papers);
}

export async function POST(req: Request) {
  const participantId = await getParticipantId();
  if (!participantId) {
    return NextResponse.json({ error: "참여자를 선택해 주세요." }, { status: 401 });
  }
  try {
    const contentType = req.headers.get("content-type") ?? "";
    let title: string;
    let url: string | undefined;
    let tags: string[] = [];
    let readAt: string;
    let mySummary: string | null = null;
    let pdfFile: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      title = (formData.get("title") as string)?.trim() ?? "";
      const urlVal = formData.get("url");
      url = typeof urlVal === "string" && urlVal.trim() ? urlVal.trim() : undefined;
      const tagsVal = formData.get("tags");
      if (typeof tagsVal === "string") {
        tags = tagsVal.split(",").map((t) => t.trim()).filter(Boolean);
      }
      readAt = ((formData.get("readAt") as string) ?? "").trim() || new Date().toISOString().slice(0, 10);
      const summaryVal = formData.get("mySummary");
      mySummary = typeof summaryVal === "string" && summaryVal.trim() ? summaryVal.trim() : null;
      const file = formData.get("pdf");
      if (file instanceof File && file.size > 0) {
        const ext = path.extname(file.name).toLowerCase();
        if (ext !== ".pdf") {
          return NextResponse.json({ error: "PDF 파일만 업로드할 수 있습니다." }, { status: 400 });
        }
        pdfFile = file;
      }
    } else {
      const body = await req.json();
      const parsed = paperBody.safeParse({
        ...body,
        url: body.url && body.url.trim() ? body.url : undefined,
      });
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }
      title = parsed.data.title;
      url = parsed.data.url || undefined;
      tags = parsed.data.tags ?? [];
      readAt = parsed.data.readAt;
      mySummary = (parsed.data.mySummary && parsed.data.mySummary.trim()) ? parsed.data.mySummary.trim() : null;
    }

    if (!title) {
      return NextResponse.json({ error: { title: ["제목을 입력하세요"] } }, { status: 400 });
    }
    const readAtRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!readAtRegex.test(readAt)) {
      readAt = new Date().toISOString().slice(0, 10);
    }

    const paper = await prisma.paper.create({
      data: {
        userId: participantId,
        title,
        url: url || null,
        tags,
        readAt,
        mySummary,
      },
    });

    if (pdfFile) {
      const dir = path.join(process.cwd(), "public", "uploads", "papers");
      await mkdir(dir, { recursive: true });
      const filename = `${paper.id}.pdf`;
      const filePath = path.join(dir, filename);
      const buf = Buffer.from(await pdfFile.arrayBuffer());
      await writeFile(filePath, buf);
      await prisma.paper.update({
        where: { id: paper.id },
        data: { pdfPath: `/uploads/papers/${filename}` },
      });
      paper.pdfPath = `/uploads/papers/${filename}`;
    }

    return NextResponse.json(paper);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "등록 실패" }, { status: 500 });
  }
}
