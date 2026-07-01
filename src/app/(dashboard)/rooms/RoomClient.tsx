"use client";

import { useState } from "react";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { createRoom, deleteRoom, updateRoom } from "@/app/actions/room";
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

export function RoomClient({ initialRooms }: { initialRooms: any[] }) {
  const [rooms, setRooms] = useState(initialRooms);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Edit State
  const [editingRoom, setEditingRoom] = useState<any | null>(null);

  const handleOpenDialog = (room?: any) => {
    if (room) {
      setEditingRoom(room);
    } else {
      setEditingRoom(null);
    }
    setIsOpen(true);
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const capacity = parseInt(formData.get("capacity") as string) || 30;

    try {
      if (editingRoom) {
        const updated = await updateRoom(editingRoom.id, { name, capacity });
        setRooms(rooms.map(r => r.id === updated.id ? updated : r));
      } else {
        const newRoom = await createRoom({ name, capacity });
        setRooms([newRoom, ...rooms]);
      }
      setIsOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this room?")) return;
    try {
      await deleteRoom(id);
      setRooms(rooms.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <Input placeholder="Search rooms..." className="h-9 rounded-[14px]" />
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <button onClick={() => handleOpenDialog()} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-[14px] text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
            <Plus size={16} />
            Add Room
          </button>
          <DialogContent className="sm:max-w-[425px] rounded-[20px]">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">{editingRoom ? "Edit Room" : "Add New Room"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Room Name / Number</Label>
                <Input id="name" name="name" required defaultValue={editingRoom?.name || ""} className="rounded-[14px]" placeholder="e.g. Room 101" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity (Students)</Label>
                <Input id="capacity" name="capacity" type="number" required defaultValue={editingRoom?.capacity || 30} className="rounded-[14px]" placeholder="e.g. 30" />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground py-2.5 rounded-[14px] text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm mt-2 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Room"}
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-[18px] border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Room</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rooms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                  No rooms found. Click "Add Room" to begin.
                </TableCell>
              </TableRow>
            ) : (
              rooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell className="font-medium text-foreground">{room.name}</TableCell>
                  <TableCell className="text-muted-foreground">{room.capacity} Students</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenDialog(room)}
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-[10px] transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(room.id)}
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
