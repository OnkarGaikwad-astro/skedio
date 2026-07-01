"use client";

import { useState } from "react";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { createTeacher, deleteTeacher, updateTeacher } from "@/app/actions/teacher";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TeacherClient({ initialTeachers, subjects }: { initialTeachers: any[], subjects: any[] }) {
  const [teachers, setTeachers] = useState(initialTeachers);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Edit State
  const [editingTeacher, setEditingTeacher] = useState<any | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  const handleOpenDialog = (teacher?: any) => {
    if (teacher) {
      setEditingTeacher(teacher);
      setSelectedSubjects(teacher.subjectIds || []);
    } else {
      setEditingTeacher(null);
      setSelectedSubjects([]);
    }
    setIsOpen(true);
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const maxPeriods = parseInt(formData.get("maxPeriods") as string) || 20;

    try {
      if (editingTeacher) {
        const updated = await updateTeacher(editingTeacher.id, { name, email, phone, maxPeriods, subjectIds: selectedSubjects });
        setTeachers(teachers.map(t => t.id === updated.id ? updated : t));
      } else {
        const newTeacher = await createTeacher({ name, email, phone, maxPeriods, subjectIds: selectedSubjects });
        setTeachers([newTeacher, ...teachers]);
      }
      setIsOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this teacher?")) return;
    try {
      await deleteTeacher(id);
      setTeachers(teachers.filter((t) => t.id !== id));
    } catch(err) {
      console.error(err);
    }
  }

  const toggleSubject = (id: string) => {
    if (selectedSubjects.includes(id)) {
      setSelectedSubjects(selectedSubjects.filter(sid => sid !== id));
    } else {
      setSelectedSubjects([...selectedSubjects, id]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <Input placeholder="Search teachers..." className="h-9 rounded-[14px]" />
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <button onClick={() => handleOpenDialog()} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-[14px] text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
            <Plus size={16} />
            Add Teacher
          </button>
          <DialogContent className="sm:max-w-[425px] rounded-[20px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">{editingTeacher ? "Edit Teacher" : "Add New Teacher"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" required defaultValue={editingTeacher?.name || ""} className="rounded-[14px]" placeholder="e.g. Rahul Sharma" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" name="email" type="email" required defaultValue={editingTeacher?.email || ""} className="rounded-[14px]" placeholder="rahul@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" defaultValue={editingTeacher?.phone || ""} className="rounded-[14px]" placeholder="+91 98765 43210" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxPeriods">Max Periods / Week</Label>
                <Input id="maxPeriods" name="maxPeriods" type="number" defaultValue={editingTeacher?.maxPeriods || 20} className="rounded-[14px]" />
              </div>

              <div className="space-y-2 pt-2 border-t border-border/50">
                <Label>Subject Specializations</Label>
                <p className="text-[11px] text-muted-foreground mb-2">Select the subjects this teacher is qualified to teach. The AI generator will only assign them to these subjects.</p>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                  {subjects.map(subject => (
                    <label key={subject.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1.5 rounded-lg border border-transparent hover:border-border/50 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={selectedSubjects.includes(subject.id)}
                        onChange={() => toggleSubject(subject.id)}
                        className="rounded border-border text-primary focus:ring-primary/50"
                      />
                      <span className="truncate" title={subject.name}>{subject.name}</span>
                    </label>
                  ))}
                  {subjects.length === 0 && (
                    <div className="col-span-2 text-xs text-muted-foreground py-2 italic">No subjects available. Please add subjects first.</div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground py-2.5 rounded-[14px] text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm mt-2 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Teacher"}
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-[18px] border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Specializations</TableHead>
              <TableHead>Max Periods</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teachers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No teachers found. Click "Add Teacher" to begin.
                </TableCell>
              </TableRow>
            ) : (
              teachers.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell className="font-medium text-foreground">{teacher.name}</TableCell>
                  <TableCell className="text-muted-foreground">{teacher.email}</TableCell>
                  <TableCell>
                    {teacher.subjectIds && teacher.subjectIds.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {teacher.subjectIds.slice(0, 2).map((sid: string) => {
                          const subjName = subjects.find(s => s.id === sid)?.name;
                          return subjName ? (
                            <span key={sid} className="bg-primary/10 text-primary px-2 py-0.5 rounded-[6px] text-[10px] font-semibold tracking-wide uppercase">
                              {subjName}
                            </span>
                          ) : null;
                        })}
                        {teacher.subjectIds.length > 2 && (
                          <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-[6px] text-[10px] font-semibold">
                            +{teacher.subjectIds.length - 2}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Any Subject</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="bg-secondary/20 text-secondary-foreground px-2.5 py-1 rounded-full text-xs font-medium">
                      {teacher.maxPeriods} / wk
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenDialog(teacher)}
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-[10px] transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(teacher.id)}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-[10px] transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
