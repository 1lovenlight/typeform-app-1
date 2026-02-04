import { createClient } from "@/lib/supabase/server";
import {} from "@/components/ui/breadcrumb";
import { CourseBrowser } from "@/components/courses/course-browser";
import { OnboardingStepDialog } from "@/components/onboarding/onboarding-step";
import { PageContainer } from "@/components/layout/page-container";

export default async function CoursesPage() {
  const supabase = await createClient();

  // Get user ID from auth (guaranteed to exist due to layout guard)
  const { data } = await supabase.auth.getClaims();
  const userId = data!.claims.sub;

  // Fetch curriculum hierarchy from the view
  const { data: rows, error } = await supabase
    .from("curriculum_hierarchy")
    .select("*");

  if (error) {
    console.error("Error fetching curriculum:", error);
  }

  // Transform into nested structure
  const courses = rows?.reduce((acc: any[], row: any) => {
    // Find or create course
    let course = acc.find((c) => c.id === row.course_id);
    if (!course) {
      course = {
        id: row.course_id,
        title: row.course_title,
        description: row.course_description,
        order_index: row.course_order,
        is_published: row.course_published,
        modules: [],
        course_progress: [], // Will be populated below
      };
      acc.push(course);
    }

    // Find or create module (if exists)
    if (row.module_id) {
      let courseModule = course.modules.find(
        (m: any) => m.id === row.module_id
      );
      if (!courseModule) {
        courseModule = {
          id: row.module_id,
          title: row.module_title,
          description: row.module_description,
          order_index: row.module_order,
          activities: [],
        };
        course.modules.push(courseModule);
      }

      // Add activity (if exists)
      if (row.activity_id) {
        courseModule.activities.push({
          id: row.activity_id,
          display_name: row.activity_name,
          internal_name: row.activity_internal_name,
          short_description: row.activity_description,
          order_index: row.activity_order,
          activity_type: row.activity_type,
          difficulty: row.difficulty,
          is_quiz: row.is_quiz,
          published: row.activity_published,
          module_id: row.module_id,
          loop_type: row.loop_type,
          avatar_name: row.avatar_name,
          avatar_image_url: row.avatar_image_url,
          activity_image_url: row.activity_image_url,
        });
      }
    }

    return acc;
  }, []);

  // Fetch user course progress separately
  const { data: courseProgress } = await supabase
    .from("course_progress")
    .select("*")
    .eq("user_id", userId);

  // Add course progress to each course
  courses?.forEach((course) => {
    course.course_progress =
      courseProgress?.filter((p) => p.course_id === course.id) || [];
  });

  return (
    <>
      <OnboardingStepDialog step="learn_first_visit" />
      <CourseBrowser courses={courses || []} />
    </>
  );
}
