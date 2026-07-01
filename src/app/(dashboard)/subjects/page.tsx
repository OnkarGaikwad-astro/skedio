import { getSubjects } from "@/app/actions/subject";
import { SubjectClient } from "./SubjectClient";

export default async function SubjectsPage() {
  const subjects = await getSubjects();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-heading font-semibold text-foreground">Subjects</h1>
        <p className="text-muted-foreground mt-1">Manage curriculum subjects and their types.</p>
      </div>

      <div className="bg-card rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border/50 p-6">
        <SubjectClient initialSubjects={subjects} />
      </div>
    </div>
  );
}
