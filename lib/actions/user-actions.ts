"use server";

import { createClient } from "@/lib/supabase/server";

export interface NextActivityResult {
  id: string;
  display_name: string;
  activity_type: string | null;
  module_title?: string;
  course_title?: string;
}

export async function getUserNextActivity(userId: string): Promise<NextActivityResult | null> {
  try {
    const supabase = await createClient();

    // Get all published activities with their order
    const { data: allActivities } = await supabase
      .from("activities")
      .select(`
        id,
        display_name,
        activity_type,
        order_index,
        published,
        modules (
          id,
          title,
          course_id,
          courses (
            title
          )
        )
      `)
      .eq("published", true)
      .order("order_index", { ascending: true });

    if (!allActivities || allActivities.length === 0) return null;

    // Get user's completed activities
    const { data: completedActivities } = await supabase
      .from("user_progress")
      .select("activity_id")
      .eq("user_id", userId);

    const completedIds = new Set(
      completedActivities?.map((c) => c.activity_id) || []
    );

    // Find first incomplete activity
    const nextActivity = allActivities.find(
      (activity) => !completedIds.has(activity.id)
    );

    if (!nextActivity) return null;

    const moduleData = Array.isArray(nextActivity.modules) 
      ? nextActivity.modules[0] 
      : nextActivity.modules;
    
    const courseData = Array.isArray(moduleData?.courses) 
      ? moduleData.courses[0] 
      : moduleData?.courses;

    return {
      id: nextActivity.id,
      display_name: nextActivity.display_name,
      activity_type: nextActivity.activity_type,
      module_title: moduleData?.title,
      course_title: courseData?.title,
    };
  } catch (error) {
    console.error("Error fetching next activity:", error);
    return null;
  }
}


