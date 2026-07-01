"use client";

import { useState } from "react";
import { Plus, Coffee, Clock, Search, Trash2, CalendarDays, Edit2 } from "lucide-react";
import { Dialog } from "@base-ui/react";
import { createBreak, deleteBreak, updateBreak, Break } from "@/app/actions/break";
import { useRouter } from "next/navigation";

export function BreakClient({ initialBreaks }: { initialBreaks: Break[] }) {
  const router = useRouter();
  const [breaks, setBreaks] = useState(initialBreaks);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Edit State
  const [editingBreak, setEditingBreak] = useState<Break | null>(null);

  const handleOpenDialog = (brk?: Break) => {
    if (brk) {
      setEditingBreak(brk);
    } else {
      setEditingBreak(null);
    }
    setIsOpen(true);
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;

    try {
      if (editingBreak) {
        const updated = await updateBreak(editingBreak.id, { name, startTime, endTime });
        setBreaks(breaks.map(b => b.id === updated.id ? updated : b));
      } else {
        const res = await createBreak(formData);
        if (res.success && res.break) {
          setBreaks([res.break, ...breaks]);
        }
      }
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to save break. Make sure you ran the SQL query in Supabase.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this break?")) return;
    try {
      await deleteBreak(id);
      setBreaks(breaks.filter((b) => b.id !== id));
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to delete break.");
    }
  }

  const filteredBreaks = breaks.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-muted-foreground" />
          </div>
          <input
            type="text"
            placeholder="Search custom breaks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-[14px] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
          />
        </div>

        <button 
          onClick={() => handleOpenDialog()}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-[14px] text-sm font-medium hover:bg-primary/90 transition-all shadow-[0_4px_14px_rgba(0,78,100,0.25)] hover:shadow-[0_6px_20px_rgba(0,78,100,0.3)] w-full sm:w-auto justify-center"
        >
          <Plus size={16} />
          Add Custom Break
        </button>
      </div>

      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
          <Dialog.Popup className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-[425px] bg-background border border-border/50 rounded-[24px] shadow-2xl p-6 z-50 animate-in zoom-in-95 duration-200">
            <Dialog.Title className="text-xl font-heading font-semibold text-foreground mb-1">
              {editingBreak ? "Edit Break" : "Add Custom Break"}
            </Dialog.Title>
            <Dialog.Description className="text-sm text-muted-foreground mb-6">
              This break will be automatically applied to the AI schedule generator across all classes and teachers.
            </Dialog.Description>
            
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Break Name</label>
                <input 
                  id="name" 
                  name="name" 
                  required 
                  defaultValue={editingBreak?.name || ""}
                  className="w-full h-11 px-3 bg-muted/50 border border-border rounded-[12px] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow" 
                  placeholder="e.g. Lunch Break, Morning Assembly" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="startTime" className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><Clock size={14}/> Start Time</label>
                  <input 
                    id="startTime" 
                    name="startTime" 
                    type="time" 
                    required 
                    defaultValue={editingBreak?.startTime || "12:00"}
                    className="w-full h-11 px-3 bg-muted/50 border border-border rounded-[12px] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow" 
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="endTime" className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><Clock size={14}/> End Time</label>
                  <input 
                    id="endTime" 
                    name="endTime" 
                    type="time" 
                    required 
                    defaultValue={editingBreak?.endTime || "13:00"}
                    className="w-full h-11 px-3 bg-muted/50 border border-border rounded-[12px] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow" 
                  />
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <Dialog.Close className="flex-1 bg-muted hover:bg-muted/80 text-foreground py-2.5 rounded-[14px] text-sm font-medium transition-colors">
                  Cancel
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-[14px] text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Break"}
                </button>
              </div>
            </form>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Grid of Breaks */}
      {filteredBreaks.length === 0 ? (
        <div className="border border-dashed border-border/60 rounded-[24px] p-12 flex flex-col items-center justify-center text-center animate-in fade-in duration-700 bg-background/50">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Coffee size={28} className="text-primary/60" />
          </div>
          <h3 className="font-heading text-lg text-foreground font-medium mb-1">No custom breaks found</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            {searchQuery ? "Try adjusting your search criteria." : "Add breaks like Recess or Lunch that will automatically span across all generated timetables."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in slide-in-from-bottom-4 duration-500">
          {filteredBreaks.map((b) => (
            <div key={b.id} className="group relative bg-card border border-border/50 rounded-[20px] p-5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-10 h-10 rounded-[12px] bg-primary/10 text-primary flex items-center justify-center">
                  <Coffee size={20} />
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => handleOpenDialog(b)}
                    className="p-1.5 text-muted-foreground hover:text-primary bg-background/50 hover:bg-primary/10 rounded-[8px] transition-colors border border-transparent hover:border-primary/20"
                    title="Edit Break"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={() => handleDelete(b.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive bg-background/50 hover:bg-destructive/10 rounded-[8px] transition-colors border border-transparent hover:border-destructive/20"
                    title="Delete Break"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              
              <div className="relative z-10 space-y-1">
                <h3 className="font-semibold text-foreground truncate">{b.name}</h3>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium bg-muted/30 w-fit px-2.5 py-1 rounded-full border border-border/50">
                  <Clock size={12} className="text-primary/70" />
                  {b.startTime} - {b.endTime}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
