import { prisma } from "@/lib/prisma";

/** 논문에 댓글 달렸을 때: 글쓴이 + 그 논문에 댓글 단 사람들에게 알림 (댓글 작성자 제외) */
export async function createPaperCommentNotifications(
  paperId: string,
  commenterUserId: string,
  commenterName: string,
  paperTitle: string
) {
  const paper = await prisma.paper.findUnique({
    where: { id: paperId },
    select: { userId: true },
  });
  if (!paper) return;

  const commenters = await prisma.paperComment.findMany({
    where: { paperId },
    select: { userId: true },
    distinct: ["userId"],
  });

  const recipientIds = new Set<string>();
  if (paper.userId !== commenterUserId) recipientIds.add(paper.userId);
  commenters.forEach((c) => {
    if (c.userId !== commenterUserId) recipientIds.add(c.userId);
  });

  const message = `"${paperTitle}" 글에 ${commenterName}님이 댓글을 남겼어요.`;
  const link = `/papers/${paperId}`;

  await Promise.all(
    Array.from(recipientIds).map((userId) =>
      (prisma as { notification: { create: (args: object) => Promise<unknown> } }).notification.create({
        data: {
          userId,
          type: "paper_comment",
          actorId: commenterUserId,
          actorName: commenterName,
          message,
          link,
        },
      })
    )
  );
}

/** 창고리즘 코드에 댓글 달렸을 때: 글쓴이 + 그 코드에 댓글 단 사람들에게 알림 (댓글 작성자 제외) */
export async function createCodeCommentNotifications(
  codePostId: string,
  commenterUserId: string,
  commenterName: string
) {
  const post = await (prisma as { psCodePost: { findUnique: (args: object) => Promise<{ userId: string; topicId: string } | null> } }).psCodePost.findUnique({
    where: { id: codePostId },
    select: { userId: true, topicId: true },
  });
  if (!post) return;
  const topicId = post.topicId;

  const commenters = await (prisma as { psCodePostComment: { findMany: (args: object) => Promise<{ userId: string }[]> } })
    .psCodePostComment.findMany({
      where: { codePostId },
      select: { userId: true },
      distinct: ["userId"],
    });

  const recipientIds = new Set<string>();
  if (post.userId !== commenterUserId) recipientIds.add(post.userId);
  commenters.forEach((c) => {
    if (c.userId !== commenterUserId) recipientIds.add(c.userId);
  });

  const message = `창고리즘 코드에 ${commenterName}님이 댓글을 남겼어요.`;
  const link = `/ps/topics/${topicId}`;

  await Promise.all(
    Array.from(recipientIds).map((userId) =>
      (prisma as { notification: { create: (args: object) => Promise<unknown> } }).notification.create({
        data: {
          userId,
          type: "code_comment",
          actorId: commenterUserId,
          actorName: commenterName,
          message,
          link,
        },
      })
    )
  );
}
