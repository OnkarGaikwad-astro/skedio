"use server";

import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export type Break = {
  id: string;
  schoolId: string;
  name: string;
  startTime: string;
  endTime: string;
  createdAt?: string;
};

export async function getBreaks() {
  const session = await getSession();
  if (!session?.schoolId) return [];

  const { data, error } = await supabase
    .from("Break")
    .select("*")
    .eq("schoolId", session.schoolId)
    .order("startTime", { ascending: true });

  if (error) {
    console.error("Error fetching breaks:", error);
    return [];
  }

  return data as Break[];
}

export async function createBreak(formData: FormData) {
  const session = await getSession();
  if (!session?.schoolId) {
    return { error: "Not authenticated" };
  }

  const name = formData.get("name") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;

  if (!name || !startTime || !endTime) {
    return { error: "All fields are required" };
  }

  const { data, error } = await supabase
    .from("Break")
    .insert([
      {
        schoolId: session.schoolId,
        name,
        startTime,
        endTime,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating break:", error);
    return { error: error.message };
  }

  return { success: true, break: data };
}

export async function updateBreak(id: string, data: { name: string; startTime: string; endTime: string }) {
  const session = await getSession();
  if (!session?.schoolId) throw new Error("Unauthorized");

  const { data: updatedBreak, error } = await supabase
    .from("Break")
    .update(data)
    .eq("id", id)
    .eq("schoolId", session.schoolId)
    .select()
    .single();

  if (error) {
    console.error(error);
    throw new Error("Failed to update break");
  }

  revalidatePath("/timetable");
  return updatedBreak;
}

export async function deleteBreak(id: string) {
  const session = await getSession();
  if (!session?.schoolId) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("Break")
    .delete()
    .eq("id", id)
    .eq("schoolId", session.schoolId);

  if (error) {
    console.error("Error deleting break:", error);
    return { error: error.message };
  }

  return { success: true };
}
