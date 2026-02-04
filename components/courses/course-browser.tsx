"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Check } from "lucide-react";
import { LockClosedIcon } from "@heroicons/react/24/solid";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import { useUserProgress } from "@/lib/context/user-progress-context";
import { ENABLE_ACTIVITY_LOCKING } from "@/lib/constants";
import { PageHeaderWithActions } from "../layout/text-headers";

// Types for the course data structure
type ActivityState = "locked" | "available" | "in_progress" | "completed";
type CourseState = "available" | "coming_soon";

interface Activity {
  id: string;
  display_name: string;
  short_description: string | null;
  loop_type?: "introduce" | "practice" | "assess" | null;
  difficulty: "fundamentals" | "intermediate" | "advanced" | null;
  activity_type: "typeform" | "roleplay" | null;
  order_index: number | null;
  module_id: string | null;
  activity_image_url?: string | null;
  avatar_name?: string | null;
  avatar_image_url?: string | null;
  published: boolean | null;
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  order_index: number | null;
  avatar_image?: string | null;
  course_image?: string | null;
  activities: Activity[];
}

interface CourseData {
  id: string;
  title: string;
  description: string | null;
  modules: Module[];
  course_progress: any[];
}

interface CourseBrowserProps {
  courses: CourseData[];
}

export function CourseBrowser({ courses }: CourseBrowserProps) {
  const { completedActivityIds } = useUserProgress();

  // Convert Set to array for compatibility with existing code
  const completedActivities = useMemo(
    () => Array.from(completedActivityIds),
    [completedActivityIds]
  );

  // Get filtered activities
  const filteredActivities = useMemo(() => {
    const results: {
      module: Module;
      activity: Activity;
    }[] = [];

    courses.forEach((course) => {
      course.modules
        ?.sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
        .forEach((module) => {
          // All activities are now directly in modules
          module.activities
            ?.filter((a) => {
              // Filter out unpublished activities
              if (a.published !== true) return false;
              return true;
            })
            .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
            .forEach((activity) => {
              results.push({ module, activity });
            });
        });
    });

    return results;
  }, [courses]);

  const getCourseState = (course: CourseData): CourseState => {
    // Check if course has any modules with activities
    const hasModulesWithActivities = course.modules?.some(
      (module) => module.activities && module.activities.length > 0
    );

    if (!hasModulesWithActivities) {
      return "coming_soon";
    }

    return "available";
  };

  const getActivityState = (
    activity: Activity,
    module: Module,
    course: CourseData,
    completedActivities: string[]
  ): ActivityState => {
    // Check if activity is unpublished - always locked
    if (activity.published === false || activity.published === null) {
      return "locked";
    }

    // Check if activity is completed
    if (completedActivities.includes(activity.id)) {
      return "completed";
    }

    // Check if course is coming soon
    const courseState = getCourseState(course);
    if (courseState === "coming_soon") {
      return "locked";
    }

    // If locking is disabled, all published activities are available
    if (!ENABLE_ACTIVITY_LOCKING) {
      return "available";
    }

    // Get all activities in this module
    const allModuleActivities: Activity[] = [...(module.activities || [])];
    allModuleActivities.sort(
      (a, b) => (a.order_index || 0) - (b.order_index || 0)
    );

    const currentIndex = allModuleActivities.findIndex(
      (a) => a.id === activity.id
    );

    // First activity in module
    if (currentIndex === 0) {
      // Check if previous module is completed (if exists)
      const courseModules =
        course.modules?.sort(
          (a, b) => (a.order_index || 0) - (b.order_index || 0)
        ) || [];
      const moduleIndex = courseModules.findIndex((m) => m.id === module.id);

      if (moduleIndex === 0) {
        return "available"; // First activity in first module
      }

      // Check if previous module is completed
      const prevModule = courseModules[moduleIndex - 1];
      const prevModuleActivities: Activity[] = [
        ...(prevModule.activities || []),
      ];
      const prevModuleCompleted = prevModuleActivities.every((a) =>
        completedActivities.includes(a.id)
      );

      return prevModuleCompleted ? "available" : "locked";
    }

    // Check if previous activity in same module is completed
    const prevActivity = allModuleActivities[currentIndex - 1];
    return completedActivities.includes(prevActivity.id)
      ? "available"
      : "locked";
  };

  // Group filtered activities by module
  const groupedActivities = useMemo(() => {
    const groups: Map<string, { module: Module; activity: Activity }[]> =
      new Map();

    filteredActivities.forEach((item) => {
      const moduleKey = item.module.id;

      if (!groups.has(moduleKey)) {
        groups.set(moduleKey, []);
      }

      groups.get(moduleKey)!.push(item);
    });

    return groups;
  }, [filteredActivities]);

  return (
    <div className="space-y-6">
      {/* Activities List */}
      {courses?.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No courses available
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No activities match the selected filters
        </div>
      ) : (
        <div className="space-y-12">
          {courses.map((course) => {
            const courseModules = course.modules
              ?.filter((m) =>
                Array.from(groupedActivities.keys()).includes(m.id)
              )
              .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

            if (!courseModules || courseModules.length === 0) return null;

            return (
              <div key={course.id} className="gap-y-16 divide-y divide-border-default flex flex-col">
                {courseModules.map((module) => {
                  const moduleActivities = groupedActivities.get(module.id);
                  if (!moduleActivities || moduleActivities.length === 0)
                    return null;

                  return (
                    <div key={module.id} className="gap-y-8 flex flex-col">
                      {/* Module Header */}
                      <div className="">
                        <PageHeaderWithActions title={module.title} />
                        {module.description && (
                          <p className="text-text-secondary text-xl/8 mt-2">
                            {module.description}
                          </p>
                        )}
                      </div>

                      {/* Activities in Module */}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-16">
                        {moduleActivities.map(({ activity }) => {
                          const activityState = getActivityState(
                            activity,
                            module,
                            course,
                            completedActivities
                          );

                          return (
                            <ActivityCard
                              key={activity.id}
                              activity={activity}
                              activityState={activityState}
                              image={activity.activity_image_url}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface ActivityCardProps {
  activity: Activity;
  activityState: ActivityState;
  image?: string | null;
}

function ActivityCard({ activity, activityState, image }: ActivityCardProps) {
  const isLocked = activityState === "locked";
  const isCompleted = activityState === "completed";

  const cardContent = (
    <div
      className={`hover:ring-1 ring-border-hover hover:shadow-lg hover:bg-card-active w-full overflow-hidden rounded-xl corner-squircle bg-card-default transition-all duration-300 ${
        isLocked ? "opacity-60 cursor-not-allowed" : ""
      }`}
    >
      {image && (
        <AspectRatio ratio={2 / 1}>
          <Image src={image} alt="" fill={true} priority />
          {(isCompleted || isLocked) && (
            <div className="absolute top-0 right-0 p-4 w-full">
              <div className="flex flex-row-reverse gap-4 items-start justify-between">
                {(activity.published === false ||
                  activity.published === null) &&
                  getComingSoonBadge()}
                <div className=" rounded-full h-10 w-10 flex items-center justify-center bg-card-active">
                  {isCompleted && (
                    <Check className="size-6 text-green flex-shrink-0" />
                  )}
                  {isLocked && (
                    <LockClosedIcon className="size-6 text-text-secondary flex-shrink-0" />
                  )}
                </div>
              </div>
            </div>
          )}
        </AspectRatio>
      )}
      <div className="flex flex-col p-4 gap-6">
        <div className="flex flex-col items-start justify-between gap-2 w-full">
          <span className="text-2xl">{activity.display_name}</span>
          <span className="text-base text-text-secondary">
            {activity.short_description}
          </span>
        </div>
        <div className="flex flex-row items-center justify-between gap-2">
          <div className="flex flex-row items-center gap-2">
            {getLoopTypeBadge(activity.loop_type || null)}
          </div>
          <div className="flex flex-row items-center justify-center gap-2">
            <span className="text-sm text-text-secondary">
              Hosted by{" "}
              <strong className="text-text-primary">
                {activity.avatar_name}
              </strong>
            </span>
            <Avatar className="size-10">
              <AvatarImage
                src={activity.avatar_image_url || undefined}
                alt={activity.display_name}
              />
              <AvatarFallback></AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </div>
  );

  if (isLocked) {
    return cardContent;
  }

  // Determine route based on activity type
  const getActivityRoute = (activityType: string | null) => {
    if (activityType === "roleplay") {
      return `/activity/roleplay/${activity.id}`;
    }
    // Default to typeform route for typeform activities or null/unknown types
    return `/activity/typeform/${activity.id}`;
  };

  return (
    <Link
      href={getActivityRoute(activity.activity_type)}
      className="block w-full"
    >
      {cardContent}
    </Link>
  );
}

function getLoopTypeBadge(loopType: string | null) {
  if (!loopType) return null;

  const variants: Record<string, { label: string; className: string }> = {
    introduce: {
      label: "Intro",
      className: "text-sm bg-blue text-white rounded-full",
    },
    practice: {
      label: "Practice",
      className: "text-sm bg-purple text-white rounded-full",
    },
    assess: {
      label: "Test",
      className: "text-sm bg-red text-white rounded-full",
    },
  };

  const variant = variants[loopType];
  if (!variant) return null;

  return (
    <Badge variant="secondary" className={variant.className}>
      {variant.label}
    </Badge>
  );
}

function getComingSoonBadge() {
  return (
    <Badge
      variant="secondary"
      className="text-base text-muted rounded-full px-4 h-10 bg-foreground/50"
    >
      Coming Soon
    </Badge>
  );
}
