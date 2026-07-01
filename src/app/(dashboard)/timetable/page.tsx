import { getClasses } from "@/app/actions/class";
import { getTeachers } from "@/app/actions/teacher";
import { getSubjects } from "@/app/actions/subject";
import { getBreaks } from "@/app/actions/break";
import { getTimetable } from "@/app/actions/timetable";
import { TimetableClient } from "./TimetableClient";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function TimetablePage() {
  const session = await getSession();
  if (!session?.schoolId) {
    redirect("/login");
  }

  const [classes, teachers, subjects, breaks, savedTimetable] = await Promise.all([
    getClasses(),
    getTeachers(),
    getSubjects(),
    getBreaks(),
    getTimetable()
  ]);

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-2rem)] animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-heading font-semibold text-foreground">Timetable</h1>
        <p className="text-muted-foreground mt-1">Generate and manage school schedules.</p>
      </div>

      <div className="bg-card flex-1 rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border/50 p-6 overflow-hidden">
        <TimetableClient 
          classes={classes} 
          teachers={teachers} 
          subjects={subjects} 
          customBreaks={breaks}
          initialTimetable={savedTimetable}
        />
      </div>
    </div>
  );
}
