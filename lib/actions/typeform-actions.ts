"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { TablesInsert, TablesUpdate } from "@/lib/supabase/types";

type TypeformInsert = TablesInsert<"activities">;
type TypeformUpdate = TablesUpdate<"activities">;

export async function createTypeform(data: Omit<TypeformInsert, "id" | "created_at" | "updated_at">) {
  const supabase = await createClient();

  // Validate required fields
  if (!data.internal_name || !data.display_name || !data.embed_id) {
    throw new Error("Typeform name, display name, and embed ID are required");
  }

  const { data: typeform, error } = await supabase
    .from("activities")
    .insert({
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating typeform:", error);
    throw new Error("Failed to create typeform");
  }

  revalidatePath("/manage");
  return typeform;
}

export async function updateTypeform(id: string, data: Omit<TypeformUpdate, "id" | "created_at" | "updated_at">) {
  const supabase = await createClient();

  // Validate required fields
  if (!data.internal_name || !data.display_name || !data.embed_id) {
    throw new Error("Typeform name, display name, and embed ID are required");
  }

  const { data: typeform, error } = await supabase
    .from("activities")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating typeform:", error);
    throw new Error("Failed to update typeform");
  }

  revalidatePath("/manage");
  return typeform;
}

export async function deleteTypeform(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("activities")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting typeform:", error);
    throw new Error("Failed to delete typeform");
  }

  revalidatePath("/manage");
}


