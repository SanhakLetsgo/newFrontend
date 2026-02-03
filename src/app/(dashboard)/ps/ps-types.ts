export type PsTopic = {
  id: string;
  userId: string;
  title: string;
  kind: string;
  createdAt: string;
  user: { id: string; name: string | null };
  _count?: { codePosts: number };
};

export type PsCodePost = {
  id: string;
  topicId: string;
  userId: string;
  kind: "solution" | "feedback";
  title: string | null;
  author: string | null;
  code: string;
  language: string;
  question: string | null;
  createdAt: string;
  user?: { id: string; name: string | null };
};
