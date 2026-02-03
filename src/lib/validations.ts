import { z } from "zod";

const timeRegex = /^([01]?\d|2[0-3]):([0-5]\d)$/;
const detailsValue = z.union([z.string(), z.number(), z.boolean()]);

export const workoutLogBody = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식"),
  attended: z.boolean().optional(),
  startTime: z.string().regex(timeRegex).nullable().optional(),
  endTime: z.string().regex(timeRegex).nullable().optional(),
  details: z.record(z.string(), detailsValue).nullable().optional(),
});

export const workoutStartBody = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(timeRegex).optional(),
  workoutType: z.string().max(100).optional(),
});

export const workoutEndBody = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endTime: z.string().regex(timeRegex).optional(),
  details: z.record(z.string(), detailsValue).optional(),
});

/** 수동으로 운동 기록 추가 시 사용 */
export const workoutCreateBody = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식"),
  attended: z.boolean().optional(),
  startTime: z.string().regex(timeRegex).nullable().optional(),
  endTime: z.string().regex(timeRegex).nullable().optional(),
  workoutType: z.string().max(100).nullable().optional(),
  details: z.record(z.string(), detailsValue).nullable().optional(),
});

export const paperBody = z.object({
  title: z.string().min(1, "제목을 입력하세요"),
  url: z.union([z.string().url(), z.literal("")]).optional(),
  tags: z.array(z.string()).default([]),
  authors: z.array(z.string()).default([]),
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

/** 창고리즘(PS) 일일 정리 노트 */
export const psNoteBody = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식"),
  content: z.string().max(50000).optional(),
});

/** 창고리즘 주제/수업노트 */
export const psTopicBody = z.object({
  title: z.string().min(1, "제목을 입력하세요").max(200),
  kind: z.enum(["subject", "lesson"]).default("subject"),
});

/** 창고리즘 코드 포스트 (정답 코드 / 피드백 요청) */
export const psCodePostBody = z.object({
  topicId: z.string().min(1, "주제를 선택하세요"),
  kind: z.enum(["solution", "feedback"]),
  title: z.string().max(200).optional(),
  code: z.string().max(100000),
  language: z.string().max(50).default("javascript"),
});
