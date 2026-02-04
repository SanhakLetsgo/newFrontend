"use client";

import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "p", "br", "strong", "em", "b", "i", "a", "img", "ul", "ol", "li",
  "pre", "code", "span", "div", "h2", "h3", "h4", "blockquote",
];
const ALLOWED_ATTR = ["href", "target", "rel", "src", "alt", "title", "class"];

type SafeHtmlProps = {
  html: string;
  className?: string;
};

/** 리뷰/블로그용 HTML만 허용해 XSS 방지 후 렌더링 */
export function SafeHtml({ html, className }: SafeHtmlProps) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ADD_ATTR: ["target", "rel"],
  });
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}

/** 내용이 HTML인지(태그 포함) 여부 */
export function looksLikeHtml(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  const trimmed = text.trim();
  return /<[a-z][\s\S]*>/i.test(trimmed);
}
