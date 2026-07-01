"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function saveTimetable(scheduleData: Record<string, any>, settings: Record<string, any>) {
  const session = await getSession();
  if (!session?.schoolId) throw new Error("Unauthorized");

  // Check if a timetable already exists for this school
  const { data: existing } = await supabase
    .from("Timetable")
    .select("id")
    .eq("schoolId", session.schoolId)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("Timetable")
      .update({ scheduleData, settings, updatedAt: new Date().toISOString() })
      .eq("id", existing.id)
      .eq("schoolId", session.schoolId);

    if (error) {
      console.error(error);
      throw new Error(`Failed to update: ${error.message}`);
    }
  } else {
    const { error } = await supabase
      .from("Timetable")
      .insert([{ schoolId: session.schoolId, scheduleData, settings }]);

    if (error) {
      console.error(error);
      throw new Error(`Failed to save: ${error.message}`);
    }
  }

  revalidatePath("/timetable");
  return { success: true };
}

export async function getTimetable() {
  const session = await getSession();
  if (!session?.schoolId) return null;

  const { data, error } = await supabase
    .from("Timetable")
    .select("*")
    .eq("schoolId", session.schoolId)
    .single();

  if (error && error.code !== "PGRST116") { // Ignore "no rows returned" error
    console.error(error);
    return null;
  }
  return data;
}
