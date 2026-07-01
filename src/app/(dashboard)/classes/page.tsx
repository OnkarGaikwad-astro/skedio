import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getClasses } from "@/app/actions/class";
import { getTeachers } from "@/app/actions/teacher";
import { ClassClient } from "./ClassClient";

export default async function ClassesPage() {
  const session = await getSession();
  if (!session?.schoolId) {
    redirect("/login");
  }

  const classes = await getClasses();
  const teachers = await getTeachers();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-heading font-semibold text-foreground">Classes</h1>
        <p className="text-muted-foreground mt-1">Manage grades, sections, and class teachers.</p>
      </div>

      <div className="bg-card rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border/50 p-6">
        <ClassClient initialClasses={classes} teachers={teachers} />
      </div>
    </div>
  );
}
