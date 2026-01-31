import { redirect } from "next/navigation";
import { getParticipantId } from "@/lib/participant";
import { ParticipantSelect } from "./ParticipantSelect";

export default async function Home() {
  const participantId = await getParticipantId();
  if (participantId) redirect("/dashboard");
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[hsl(var(--background))]">
      <ParticipantSelect />
    </div>
  );
}
