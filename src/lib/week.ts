/** 로컬 날짜를 YYYY-MM-DD로 (UTC가 아닌 로컬 기준) */
export function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 해당 날짜가 속한 주의 월요일 (YYYY-MM-DD). 주는 월요일 시작, 일요일 끝. */
export function getMondayOfWeek(date: Date): string {
  const d = new Date(date);
  const day = d.getDay(); // 0=일, 1=월, ..., 6=토
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return toLocalDateString(monday);
}

/** 월요일 날짜(YYYY-MM-DD)로 해당 주의 일요일 (YYYY-MM-DD) */
export function getSundayOfWeek(mondayStr: string): string {
  const m = new Date(mondayStr + "T12:00:00");
  m.setDate(m.getDate() + 6);
  return toLocalDateString(m);
}

/** 이번 주 월요일(시작) ~ 일요일(끝) (YYYY-MM-DD), 로컬 기준 */
export function getWeekRange(): { start: string; end: string } {
  const now = new Date();
  const start = getMondayOfWeek(now);
  const end = getSundayOfWeek(start);
  return { start, end };
}

/** HH:mm 두 개로 분 단위 차이 (음수면 0) */
export function minutesBetween(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  return mins > 0 ? mins : 0;
}
