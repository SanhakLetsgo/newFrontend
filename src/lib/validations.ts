import { z } from "zod";

const timeRegex = /^([01]?\d|2[0-3]):([0-5]\d)$/;

export const workoutLogBody = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식"),
  attended: z.boolean().optional(),
  startTime: z.string().regex(timeRegex).nullable().optional(),
  endTime: z.string().regex(timeRegex).nullable().optional(),
});

export const workoutStartBody = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const workoutEndBody = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const paperBody = z.object({
  title: z.string().min(1, "제목을 입력하세요"),
  url: z.union([z.string().url(), z.literal("")]).optional(),
  tags: z.array(z.string()).default([]),
  readAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식"),
  mySummary: z.string().max(50000).optional(),
});

export const paperCommentBody = z.object({
  content: z.string().min(1, "댓글을 입력하세요").max(2000),
});

export const paperReviewBody = z.object({
  summary: z.string().optional(),
  contribution: z.string().optional(),
  method: z.string().optional(),
  experiment: z.string().optional(),
  limitation: z.string().optional(),
  idea: z.string().optional(),
});
