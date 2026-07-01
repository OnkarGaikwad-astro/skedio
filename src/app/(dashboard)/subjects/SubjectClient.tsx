"use client";

import { useState } from "react";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { createSubject, deleteSubject, updateSubject } from "@/app/actions/subject";
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

export function SubjectClient({ initialSubjects }: { initialSubjects: any[] }) {
  const [subjects, setSubjects] = useState(initialSubjects);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Edit State
  const [editingSubject, setEditingSubject] = useState<any | null>(null);

  const handleOpenDialog = (subject?: any) => {
    if (subject) {
      setEditingSubject(subject);
    } else {
      setEditingSubject(null);
    }
    setIsOpen(true);
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const color = formData.get("color") as string;

    try {
      if (editingSubject) {
        const updated = await updateSubject(editingSubject.id, { name, color });
        setSubjects(subjects.map(s => s.id === updated.id ? updated : s));
      } else {
        const newSubject = await createSubject({ name, color });
        setSubjects([newSubject, ...subjects]);
      }
      setIsOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this subject?")) return;
    try {
      await deleteSubject(id);
      setSubjects(subjects.filter((s) => s.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <Input placeholder="Search subjects..." className="h-9 rounded-[14px]" />
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <button onClick={() => handleOpenDialog()} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-[14px] text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
            <Plus size={16} />
            Add Subject
          </button>
          <DialogContent className="sm:max-w-[425px] rounded-[20px]">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">{editingSubject ? "Edit Subject" : "Add New Subject"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Subject Name</Label>
                <Input id="name" name="name" required defaultValue={editingSubject?.name || ""} className="rounded-[14px]" placeholder="e.g. Mathematics" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Theme Color</Label>
                <div className="flex items-center gap-3">
                  <Input 
                    id="color" 
                    name="color" 
                    type="color" 
                    defaultValue={editingSubject?.color || "#0ea5e9"} 
                    className="w-12 h-10 p-1 rounded-[10px] cursor-pointer" 
                  />
                  <span className="text-xs text-muted-foreground">Choose a color to distinguish this subject in the timetable.</span>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground py-2.5 rounded-[14px] text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm mt-2 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Subject"}
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-[18px] border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Color</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                  No subjects found. Click "Add Subject" to begin.
                </TableCell>
              </TableRow>
            ) : (
              subjects.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell>
                    <div 
                      className="w-6 h-6 rounded-full shadow-inner border border-black/10" 
                      style={{ backgroundColor: subject.color || "#0ea5e9" }}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{subject.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenDialog(subject)}
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-[10px] transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(subject.id)}
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
