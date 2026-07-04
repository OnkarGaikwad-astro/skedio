"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export type Break = {
  id: string;
  schoolId: string;
  name: string;
  startTime: string;
  endTime: string;
  applyTo?: string;
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

  return data.map((b: any) => {
    let name = b.name;
    let applyTo = "ALL";
    if (name.includes(":::_")) {
      const parts = name.split(":::_");
      name = parts[0];
      applyTo = parts[1] || "ALL";
    }
    return { ...b, name, applyTo };
  }) as Break[];
}

export async function createBreak(formData: FormData) {
  const session = await getSession();
  if (!session?.schoolId) {
    return { error: "Not authenticated" };
  }

  const rawName = formData.get("name") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const applyTo = formData.get("applyTo") as string || "ALL";

  if (!rawName || !startTime || !endTime) {
    return { error: "All fields are required" };
  }

  const name = `${rawName}:::_${applyTo}`;

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

  return { success: true, break: { ...data, name: rawName, applyTo } };
}

export async function updateBreak(id: string, data: { name: string; startTime: string; endTime: string, applyTo?: string }) {
  const session = await getSession();
  if (!session?.schoolId) throw new Error("Unauthorized");

  const applyTo = data.applyTo || "ALL";
  const name = `${data.name}:::_${applyTo}`;

  const { data: updatedBreak, error } = await supabase
    .from("Break")
    .update({ name, startTime: data.startTime, endTime: data.endTime })
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
