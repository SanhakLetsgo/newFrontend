import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

async function main() {
  const participantNames = ["신현호", "창민석", "송수현", "강태영", "이윤지", "조수민"];
  const participants: { id: string; name: string }[] = [];

  for (const name of participantNames) {
    let user = await prisma.user.findFirst({ where: { name } });
    if (!user) {
      user = await prisma.user.create({ data: { name } });
    }
    participants.push({ id: user.id, name: user.name ?? name });
  }
  console.log("참여자:", participants.map((p) => p.name).join(", "));

  const uid = participants[0].id;

  for (let i = 0; i < 7; i++) {
    const date = daysAgo(i);
    await prisma.workoutLog.upsert({
      where: { userId_date: { userId: uid, date } },
      create: {
        userId: uid,
        date,
        attended: true,
        startTime: i < 5 ? "07:00" : null,
        endTime: i < 5 ? "07:45" : null,
      },
      update: {},
    });
  }
  console.log("Created/updated 7 days workout logs");

  const papersData = [
    { title: "Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", tags: ["NLP", "Transformer"], readAt: daysAgo(3) },
    { title: "BERT: Pre-training of Deep Bidirectional Transformers", url: "https://arxiv.org/abs/1810.04805", tags: ["NLP", "BERT"], readAt: daysAgo(5) },
    { title: "ResNet: Deep Residual Learning", url: "https://arxiv.org/abs/1512.03385", tags: ["CV", "ResNet"], readAt: daysAgo(7) },
  ];

  for (const p of papersData) {
    await prisma.paper.create({ data: { userId: uid, ...p } });
  }
  console.log("Created 3 papers");

  const firstPaper = await prisma.paper.findFirst({
    where: { userId: uid },
    orderBy: { readAt: "desc" },
  });
  if (firstPaper) {
    await prisma.paperReview.upsert({
      where: { paperId: firstPaper.id },
      create: {
        paperId: firstPaper.id,
        userId: uid,
        summary: "트랜스포머는 self-attention만으로 시퀀스 모델링을 수행하는 구조다.",
        contribution: "RNN/CNN 없이 attention만 사용.\nEncoder-Decoder 구조.\n병렬화 가능.",
        method: "Multi-head self-attention, positional encoding",
        experiment: "WMT 2014 영독 번역 SOTA",
        limitation: "긴 시퀀스에서 메모리 비용",
        idea: "Longformer, BigBird 등으로 확장",
      },
      update: {},
    });
    console.log("Created 1 paper review");
  }

  console.log("Seed done. 시작할 때 신현호, 창민석, 송수현, 강태영, 이윤지, 조수민 중 선택하세요.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
