import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "警告(위험한 일을 조심하거나 삼가도록 미리 일러서 주의를 주다.)",
  description: "운동 출석 · 논문 스터디",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
