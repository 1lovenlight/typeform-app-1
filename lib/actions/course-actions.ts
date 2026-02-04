"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface CourseEnrollmentResult {
  success: boolean;
  message: string;
  error?: string;
}

export async function getUserCourses(userId: string) {
  try {
    const supabase = await createClient();

    // Fetch all published courses (enrollment no longer required)
    const { data: courses, error } = await supabase
      .from("courses")
      .select(`
        id,
        title,
        description,
        is_published,
        order_index,
        created_at,
        updated_at,
        modules (
          id,
          title,
          order_index
        )
      `)
      .eq("is_published", true)
      .order("order_index", { ascending: true });

    if (error) {
      console.error("Error fetching courses:", error);
      return { courses: [], error: error.message };
    }

    return { courses: courses || [], error: null };
  } catch (error) {
    console.error("Unexpected error fetching courses:", error);
    return { 
      courses: [], 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function getCourseProgress(userId: string, courseId: string) {
  try {
    const supabase = await createClient();

    // Get all activities for this course
    const { data: courseActivities } = await supabase
      .from("activities")
      .select(`
        id,
        display_name,
        module_id,
        modules (
          id,
          title,
          course_id
        )
      `)
      .eq("modules.course_id", courseId);

    if (!courseActivities) {
      return { progress: 0, completedCount: 0, totalCount: 0 };
    }

    // Get user's completed activities for this course
    const activityIds = courseActivities.map(a => a.id);
    const { data: completedActivities } = await supabase
      .from("user_progress")
      .select("activity_id")
      .eq("user_id", userId)
      .in("activity_id", activityIds);

    const completedCount = completedActivities?.length || 0;
    const totalCount = courseActivities.length;
    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return { progress, completedCount, totalCount };
  } catch (error) {
    console.error("Error calculating course progress:", error);
    return { progress: 0, completedCount: 0, totalCount: 0 };
  }
}


