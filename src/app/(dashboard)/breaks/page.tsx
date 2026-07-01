import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getBreaks } from "@/app/actions/break";
import { BreakClient } from "./BreakClient";

export default async function BreaksPage() {
  const session = await getSession();
  if (!session?.schoolId) {
    redirect("/login");
  }

  const breaks = await getBreaks();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-heading font-semibold text-foreground">Breaks & Recess</h1>
        <p className="text-muted-foreground mt-1">Configure custom break times and lunch periods to reserve slots in your timetable.</p>
      </div>

      <BreakClient initialBreaks={breaks} />
    </div>
  );
}
