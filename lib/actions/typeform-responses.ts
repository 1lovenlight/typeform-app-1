import { createClient } from "@/lib/supabase/server";
import { Tables } from "@/lib/supabase/types";

export type TypeformResponse = Tables<"activity_responses">;

export async function getUserActivityResponses(userId: string, limit = 20) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("activity_responses")
    .select(`
      id, 
      created_at, 
      user_id, 
      form_title, 
      form_type, 
      quiz_score, 
      max_score, 
      token,
      response
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error("Error fetching user typeform responses:", error);
    return [];
  }
  
  return data as TypeformResponse[];
}
