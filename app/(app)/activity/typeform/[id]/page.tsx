import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ActivityCompletion } from "@/components/activities/activity-completion";
import { TypeformReactWidget } from "@/components/typeforms/typeform-react-widget";
import { Skeleton } from "@/components/ui/skeleton";
import { OnboardingStepDialog } from "@/components/onboarding/onboarding-step";
import { ActivityInfoDialog } from "@/components/activities/activity-hint-dialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface ActivityPageProps {
  params: { id: string };
}

export default async function ActivityPage({ params }: ActivityPageProps) {
  const supabase = await createClient();

  // Get user ID from auth (guaranteed to exist due to layout guard)
  const { data } = await supabase.auth.getClaims();
  const userId = data!.claims.sub;

  // Fetch typeform with related data
  const { id: typeformId } = await params;

  const { data: typeform } = await supabase
    .from("activities")
    .select(
      `
      *,
      modules!activities_module_id_fkey (
        id,
        title,
        course_id,
        courses (
          id,
          title
        )
      ),
      topics!activities_topic_id_fkey (
        id,
        title
      )
    `
    )
    .eq("id", typeformId)
    .single();

  if (!typeform) {
    redirect("/learn");
  }

  if (!typeform.form_id) {
    redirect("/learn");
  }

  return (
    <div className="relative flex flex-col w-full h-full mx-auto">
      <OnboardingStepDialog step="activity_typeform_intro" />
      <div className="w-full mb-2 flex flex-row items-center justify-between">
        <Breadcrumb className="">
          <BreadcrumbList>
            <BreadcrumbItem className="text-text-secondary text-base">
              <BreadcrumbLink href="/learn">Learn</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="text-text-secondary text-base">
              {typeform.modules?.course_id && typeform.modules?.title ? (
                <BreadcrumbLink asChild className="pointer-events-none">
                  <Link href={`/learn/${typeform.modules.course_id}`}>
                    {typeform.modules.title}
                  </Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbLink className="pointer-events-none">
                  <Skeleton className="h-5 w-24" />
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="text-text-primary text-base">
              <BreadcrumbLink asChild>
                <Link href={`/activity/typeform/${typeform.id}`}>
                  {typeform.display_name || "Activity"}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <ActivityInfoDialog />
      </div>

      <div className="flex-1">
        <AspectRatio ratio={16 / 9}>
          <TypeformReactWidget
            formId={typeform.form_id}
            userId={userId}
            hiddenFields={{
              supabase_typeform_id: typeform.id,
              module_id: typeform.modules?.id || "",
              course_id: typeform.modules?.course_id || "",
              activities_display_name: typeform.display_name || "",
              modules_title: typeform.modules?.title || "",
              topics_title: typeform.topics?.title || "",
            }}
          />
        </AspectRatio>
      </div>

      <ActivityCompletion
        typeformId={typeform.id}
        subjectId={typeform.modules?.id}
        courseId={typeform.modules?.course_id}
      />
    </div>
  );
}
