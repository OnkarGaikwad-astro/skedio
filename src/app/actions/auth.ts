"use server";

import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { createSession, clearSession } from "@/lib/session";
import { redirect } from "next/navigation";

export async function registerSchool(formData: FormData) {
  const name = formData.get("name") as string;
  const udiseCode = formData.get("udiseCode") as string;
  const password = formData.get("password") as string;

  if (!name || !udiseCode || !password) {
    return { error: "All fields are required" };
  }

  // Check if school already exists
  const { data: existingSchool } = await supabase
    .from("School")
    .select("id")
    .eq("udiseCode", udiseCode)
    .single();

  if (existingSchool) {
    return { error: "A school with this UDISE code is already registered." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // Insert into Supabase
  const { data: newSchool, error } = await supabase
    .from("School")
    .insert([
      { name, udiseCode, passwordHash }
    ])
    .select()
    .single();

  if (error || !newSchool) {
    return { error: error?.message || "Failed to register school" };
  }

  await createSession(newSchool.id, newSchool.name);
  redirect("/");
}

export async function loginSchool(formData: FormData) {
  const udiseCode = formData.get("udiseCode") as string;
  const password = formData.get("password") as string;

  if (!udiseCode || !password) {
    return { error: "All fields are required" };
  }

  // Fetch school from Supabase
  const { data: school, error } = await supabase
    .from("School")
    .select("*")
    .eq("udiseCode", udiseCode)
    .single();

  if (error || !school) {
    return { error: "Invalid UDISE code or password." };
  }

  const isPasswordValid = await bcrypt.compare(password, school.passwordHash);

  if (!isPasswordValid) {
    return { error: "Invalid UDISE code or password." };
  }

  await createSession(school.id, school.name);
  redirect("/");
}

export async function logoutSchool() {
  await clearSession();
  redirect("/login");
}
