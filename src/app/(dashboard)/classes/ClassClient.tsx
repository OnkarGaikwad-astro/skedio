"use client";

import { useState } from "react";
import { Plus, Trash2, Edit2, User } from "lucide-react";
import { createClass, deleteClass, updateClass } from "@/app/actions/class";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ClassClient({ initialClasses, teachers }: { initialClasses: any[], teachers: any[] }) {
  const [classes, setClasses] = useState(initialClasses);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Edit State
  const [editingClass, setEditingClass] = useState<any | null>(null);
  const [selectedClassTeacher, setSelectedClassTeacher] = useState<string>("none");

  const handleOpenDialog = (cls?: any) => {
    if (cls) {
      setEditingClass(cls);
      setSelectedClassTeacher(cls.classTeacherId || "none");
    } else {
      setEditingClass(null);
      setSelectedClassTeacher("none");
    }
    setIsOpen(true);
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const division = formData.get("division") as string;
    
    const classTeacherId = selectedClassTeacher === "none" ? undefined : selectedClassTeacher;

    try {
      if (editingClass) {
        const updated = await updateClass(editingClass.id, { name, division, classTeacherId });
        setClasses(classes.map(c => c.id === updated.id ? updated : c));
      } else {
        const newClass = await createClass({ name, division, classTeacherId });
        setClasses([newClass, ...classes]);
      }
      setIsOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this class?")) return;
    try {
      await deleteClass(id);
      setClasses(classes.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <Input placeholder="Search classes..." className="h-9 rounded-[14px]" />
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <button onClick={() => handleOpenDialog()} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-[14px] text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
            <Plus size={16} />
            Add Class
          </button>
          <DialogContent className="sm:max-w-[425px] rounded-[20px]">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">{editingClass ? "Edit Class" : "Add New Class"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Grade / Standard</Label>
                <Input id="name" name="name" required defaultValue={editingClass?.name || ""} className="rounded-[14px]" placeholder="e.g. Grade 10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="division">Division / Section</Label>
                <Input id="division" name="division" required defaultValue={editingClass?.division || ""} className="rounded-[14px]" placeholder="e.g. A" />
              </div>
              
              <div className="space-y-2 pt-2 border-t border-border/50">
                <Label>Class Teacher</Label>
                <p className="text-[11px] text-muted-foreground mb-2">The Class Teacher will automatically be assigned to the first period of the day for this class.</p>
                <Select value={selectedClassTeacher} onValueChange={setSelectedClassTeacher}>
                  <SelectTrigger className="w-full rounded-[14px]">
                    <SelectValue placeholder="Select a teacher">
                      {selectedClassTeacher !== "none" 
                        ? teachers.find(t => t.id === selectedClassTeacher)?.name 
                        : "No Class Teacher"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Class Teacher</SelectItem>
                    {teachers.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground py-2.5 rounded-[14px] text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm mt-2 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Class"}
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-[18px] border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Grade</TableHead>
              <TableHead>Division</TableHead>
              <TableHead>Class Teacher</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No classes found. Click "Add Class" to begin.
                </TableCell>
              </TableRow>
            ) : (
              classes.map((cls) => {
                const classTeacher = cls.classTeacherId ? teachers.find(t => t.id === cls.classTeacherId) : null;
                
                return (
                  <TableRow key={cls.id}>
                    <TableCell className="font-medium text-foreground">{cls.name}</TableCell>
                    <TableCell className="text-muted-foreground">{cls.division}</TableCell>
                    <TableCell>
                      {classTeacher ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                            {classTeacher.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium">{classTeacher.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">None Assigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenDialog(cls)}
                          className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-[10px] transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(cls.id)}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-[10px] transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
