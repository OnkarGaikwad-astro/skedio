"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function createClass(data: { name: string; division: string; classTeacherId?: string; subjectIds?: string[] }) {
  const session = await getSession();
  if (!session?.schoolId) throw new Error("Unauthorized");

  const { data: newClass, error } = await supabase
    .from("Class")
    .insert([{ schoolId: session.schoolId, ...data }])
    .select()
    .single();

  if (error) {
    console.error(error);
    throw new Error("Failed to add class");
  }

  revalidatePath("/classes");
  return newClass;
}

export async function getClasses() {
  const session = await getSession();
  if (!session?.schoolId) return [];

  const { data, error } = await supabase
    .from("Class")
    .select("*")
    .eq("schoolId", session.schoolId)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }
  return data;
}

export async function updateClass(id: string, data: { name: string; division: string; classTeacherId?: string; subjectIds?: string[] }) {
  const session = await getSession();
  if (!session?.schoolId) throw new Error("Unauthorized");

  const { data: updatedClass, error } = await supabase
    .from("Class")
    .update(data)
    .eq("id", id)
    .eq("schoolId", session.schoolId)
    .select()
    .single();

  if (error) {
    console.error(error);
    throw new Error("Failed to update class");
  }

  revalidatePath("/classes");
  return updatedClass;
}

export async function deleteClass(id: string) {
  const session = await getSession();
  if (!session?.schoolId) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("Class")
    .delete()
    .eq("id", id)
    .eq("schoolId", session.schoolId);

  if (error) {
    console.error(error);
    throw new Error("Failed to delete class");
  }

  revalidatePath("/classes");
  return { success: true };
}
