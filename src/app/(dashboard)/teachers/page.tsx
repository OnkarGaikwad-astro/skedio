import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getTeachers } from "@/app/actions/teacher";
import { getSubjects } from "@/app/actions/subject";
import { TeacherClient } from "./TeacherClient";

export default async function TeachersPage() {
  const session = await getSession();
  if (!session?.schoolId) {
    redirect("/login");
  }

  const teachers = await getTeachers();
  const subjects = await getSubjects();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-heading font-semibold text-foreground">Teachers</h1>
        <p className="text-muted-foreground mt-1">Manage teaching staff and their subject specializations.</p>
      </div>

      <div className="bg-card rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border/50 p-6">
        <TeacherClient initialTeachers={teachers} subjects={subjects} />
      </div>
    </div>
  );
}
