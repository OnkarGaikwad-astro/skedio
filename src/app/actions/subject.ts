"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function createSubject(data: { name: string; code: string; type: string; color?: string }) {
  const session = await getSession();
  if (!session?.schoolId) throw new Error("Unauthorized");

  const { data: newSubject, error } = await supabase
    .from("Subject")
    .insert([{ schoolId: session.schoolId, ...data }])
    .select()
    .single();

  if (error) {
    console.error(error);
    throw new Error("Failed to add subject");
  }

  revalidatePath("/subjects");
  return newSubject;
}

export async function getSubjects() {
  const session = await getSession();
  if (!session?.schoolId) return [];

  const { data, error } = await supabase
    .from("Subject")
    .select("*")
    .eq("schoolId", session.schoolId)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }
  return data;
}

export async function updateSubject(id: string, data: { name: string; color: string }) {
  const session = await getSession();
  if (!session?.schoolId) throw new Error("Unauthorized");

  const { data: updatedSubject, error } = await supabase
    .from("Subject")
    .update(data)
    .eq("id", id)
    .eq("schoolId", session.schoolId)
    .select()
    .single();

  if (error) {
    console.error(error);
    throw new Error("Failed to update subject");
  }

  revalidatePath("/subjects");
  return updatedSubject;
}

export async function deleteSubject(id: string) {
  const session = await getSession();
  if (!session?.schoolId) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("Subject")
    .delete()
    .eq("id", id)
    .eq("schoolId", session.schoolId);

  if (error) {
    console.error(error);
    throw new Error("Failed to delete subject");
  }

  revalidatePath("/subjects");
  return { success: true };
}
