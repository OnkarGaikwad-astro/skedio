"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function createTeacher(data: { name: string; email: string; phone: string; maxPeriods: number; subjectIds: string[] }) {
  const session = await getSession();
  if (!session?.schoolId) throw new Error("Unauthorized");

  const { data: newTeacher, error } = await supabase
    .from("Teacher")
    .insert([{ schoolId: session.schoolId, ...data }])
    .select()
    .single();

  if (error) {
    console.error(error);
    throw new Error("Failed to add teacher");
  }

  revalidatePath("/teachers");
  return newTeacher;
}

export async function getTeachers() {
  const session = await getSession();
  if (!session?.schoolId) return [];

  const { data, error } = await supabase
    .from("Teacher")
    .select("*")
    .eq("schoolId", session.schoolId)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }
  return data;
}

export async function updateTeacher(id: string, data: { name: string; email: string; phone: string; maxPeriods: number; subjectIds: string[] }) {
  const session = await getSession();
  if (!session?.schoolId) throw new Error("Unauthorized");

  const { data: updatedTeacher, error } = await supabase
    .from("Teacher")
    .update(data)
    .eq("id", id)
    .eq("schoolId", session.schoolId)
    .select()
    .single();

  if (error) {
    console.error(error);
    throw new Error("Failed to update teacher");
  }

  revalidatePath("/teachers");
  return updatedTeacher;
}

export async function deleteTeacher(id: string) {
  const session = await getSession();
  if (!session?.schoolId) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("Teacher")
    .delete()
    .eq("id", id)
    .eq("schoolId", session.schoolId);

  if (error) {
    console.error(error);
    throw new Error("Failed to delete teacher");
  }

  revalidatePath("/teachers");
  return { success: true };
}
