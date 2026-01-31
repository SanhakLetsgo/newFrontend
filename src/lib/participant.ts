import { cookies } from "next/headers";

const COOKIE_NAME = "participant_id";

export async function getParticipantId(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value ?? null;
}

export function participantCookieHeader(value: string, maxAge = 365 * 24 * 60 * 60) {
  return {
    "Set-Cookie": `${COOKIE_NAME}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax`,
  };
}

export function clearParticipantCookieHeader() {
  return {
    "Set-Cookie": `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
  };
}
