"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function createRoom(data: { name: string; capacity: number; type: string }) {
  const session = await getSession();
  if (!session?.schoolId) throw new Error("Unauthorized");

  const { data: newRoom, error } = await supabase
    .from("Room")
    .insert([{ schoolId: session.schoolId, ...data }])
    .select()
    .single();

  if (error) {
    console.error(error);
    throw new Error("Failed to add room");
  }

  revalidatePath("/rooms");
  return newRoom;
}

export async function getRooms() {
  const session = await getSession();
  if (!session?.schoolId) return [];

  const { data, error } = await supabase
    .from("Room")
    .select("*")
    .eq("schoolId", session.schoolId)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }
  return data;
}

export async function updateRoom(id: string, data: { name: string; capacity: number }) {
  const session = await getSession();
  if (!session?.schoolId) throw new Error("Unauthorized");

  const { data: updatedRoom, error } = await supabase
    .from("Room")
    .update(data)
    .eq("id", id)
    .eq("schoolId", session.schoolId)
    .select()
    .single();

  if (error) {
    console.error(error);
    throw new Error("Failed to update room");
  }

  revalidatePath("/rooms");
  return updatedRoom;
}

export async function deleteRoom(id: string) {
  const session = await getSession();
  if (!session?.schoolId) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("Room")
    .delete()
    .eq("id", id)
    .eq("schoolId", session.schoolId);

  if (error) {
    console.error(error);
    throw new Error("Failed to delete room");
  }

  revalidatePath("/rooms");
  return { success: true };
}
