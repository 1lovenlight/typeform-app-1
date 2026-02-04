"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

import confetti from "canvas-confetti";
import { Check, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useMediaQuery } from "@/hooks/use-media-query";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useUserProgress } from "@/lib/context/user-progress-context";

interface ActivityCompletionProps {
  typeformId: string;
  subjectId?: string;
  courseId?: string;
  testMode?: boolean;
}

interface NextActivity {
  id: string;
  display_name: string;
  short_description: string | null;
  loop_type: "introduce" | "practice" | "assess" | null;
  activity_type: "typeform" | "roleplay" | null;
  activity_image_url: string | null;
  avatar_name: string | null;
  avatar_image_url: string | null;
  published: boolean | null;
  subject_title?: string;
}

export function ActivityCompletion({
  typeformId,
  subjectId,
  courseId,
  testMode = false,
}: ActivityCompletionProps) {
  const { isActivityCompleted } = useUserProgress();
  const [isCompleted, setIsCompleted] = useState(false);
  const [nextActivity, setNextActivity] = useState<NextActivity | null>(null);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const supabase = createClient();
  const hasTriggeredCompletion = useRef(false);

  // Function to trigger confetti
  const triggerConfetti = useCallback(() => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });

    fire(0.2, {
      spread: 60,
    });

    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  }, []);

  // Function to find the next activity
  const findNextActivity =
    useCallback(async (): Promise<NextActivity | null> => {
      if (!subjectId) return null;

      try {
        // Get all activities in the current module, ordered by order_index
        const { data: moduleActivities } = await supabase
          .from("activities")
          .select(
            "id, display_name, short_description, loop_type, activity_type, activity_image_url, avatar_name, avatar_image_url, published, order_index"
          )
          .eq("module_id", subjectId)
          .order("order_index", { ascending: true });

        if (!moduleActivities) return null;

        // Find current activity index
        const currentIndex = moduleActivities.findIndex(
          (tf) => tf.id === typeformId
        );

        // Check if there's a next activity in the same module (skip unpublished)
        if (currentIndex >= 0) {
          for (let i = currentIndex + 1; i < moduleActivities.length; i++) {
            const nextAct = moduleActivities[i];
            if (nextAct.published === true) {
              return {
                id: nextAct.id,
                display_name: nextAct.display_name,
                short_description: nextAct.short_description,
                loop_type: nextAct.loop_type,
                activity_type: nextAct.activity_type,
                activity_image_url: nextAct.activity_image_url,
                avatar_name: nextAct.avatar_name,
                avatar_image_url: nextAct.avatar_image_url,
                published: nextAct.published,
              };
            }
          }
        }

        // If no next activity in current module, find next module
        if (courseId) {
          const { data: courseModules } = await supabase
            .from("modules")
            .select(
              `
              id,
              title,
              order_index,
              activities (
                id,
                display_name,
                short_description,
                loop_type,
                activity_type,
                activity_image_url,
                avatar_name,
                avatar_image_url,
                published,
                order_index
              )
            `
            )
            .eq("course_id", courseId)
            .order("order_index", { ascending: true });

          if (!courseModules) return null;

          // Find current module index
          const currentModuleIndex = courseModules.findIndex(
            (s) => s.id === subjectId
          );

          // Look for next module with activities (skip unpublished)
          for (let i = currentModuleIndex + 1; i < courseModules.length; i++) {
            const moduleItem = courseModules[i];
            if (moduleItem.activities && moduleItem.activities.length > 0) {
              const sortedActivities = moduleItem.activities.sort(
                (a, b) => (a.order_index || 0) - (b.order_index || 0)
              );
              // Find first published activity in this module
              const firstPublishedActivity = sortedActivities.find(
                (a) => a.published === true
              );
              if (firstPublishedActivity) {
                return {
                  id: firstPublishedActivity.id,
                  display_name: firstPublishedActivity.display_name,
                  short_description: firstPublishedActivity.short_description,
                  loop_type: firstPublishedActivity.loop_type,
                  activity_type: firstPublishedActivity.activity_type,
                  activity_image_url: firstPublishedActivity.activity_image_url,
                  avatar_name: firstPublishedActivity.avatar_name,
                  avatar_image_url: firstPublishedActivity.avatar_image_url,
                  published: firstPublishedActivity.published,
                  subject_title: moduleItem.title,
                };
              }
            }
          }
        }

        return null;
      } catch (error) {
        console.error("Error finding next activity:", error);
        return null;
      }
    }, [subjectId, courseId, typeformId, supabase]);

  // Handle completion (moved outside useEffect for manual trigger access)
  const handleCompletion = useCallback(async () => {
    setIsCompleted(true);
    setIsLoadingNext(true);
    triggerConfetti();

    // Find next activity
    const next = await findNextActivity();
    setNextActivity(next);
    setIsLoadingNext(false);
  }, [triggerConfetti, findNextActivity]);

  // Handle manual trigger for testing
  useEffect(() => {
    if (testMode) {
      const handleManualTrigger = () => {
        console.log("🧪 Test Mode: Manual completion triggered");
        handleCompletion();
      };

      // Store the handler so it can be called externally
      (
        window as unknown as { __triggerActivityCompletion?: () => void }
      ).__triggerActivityCompletion = handleManualTrigger;
    }
  }, [testMode, handleCompletion]);

  // Watch for activity completion from context (realtime updates handled by context)
  useEffect(() => {
    const activityIsCompleted = isActivityCompleted(typeformId);
    
    // Only trigger once when activity becomes completed
    if (activityIsCompleted && !hasTriggeredCompletion.current) {
      hasTriggeredCompletion.current = true;
      handleCompletion();
    }
  }, [isActivityCompleted, typeformId, handleCompletion]);

  // Determine route based on activity type
  const getActivityRoute = (activity: NextActivity) => {
    if (activity.activity_type === "roleplay") {
      return `/activity/roleplay/${activity.id}`;
    }
    return `/activity/typeform/${activity.id}`;
  };

  // Shared content for both desktop and mobile
  const dialogContent = (
    <>
      {isLoadingNext ? (
        <div className="min-h-32 flex items-center justify-center p-6">
          <Spinner className="size-8" />
        </div>
      ) : nextActivity ? (
        <div className="min-h-32 flex items-center justify-center">
          <Link href={getActivityRoute(nextActivity)} className="block w-full">
            <div className="border border-primary hover:ring-1 hover:shadow-lg w-full overflow-hidden rounded-2xl bg-white transition-all duration-300">
              {nextActivity.activity_image_url && (
                <AspectRatio ratio={2 / 1}>
                  <Image
                    src={nextActivity.activity_image_url}
                    alt=""
                    fill={true}
                  />
                </AspectRatio>
              )}
              <div className="flex flex-col p-4 border-t border-primary gap-6">
                <div className="flex flex-col items-start justify-between gap-2 w-full">
                  <span className="text-2xl font-semibold">
                    {nextActivity.display_name}
                  </span>
                  {nextActivity.short_description && (
                    <span className="text-base text-muted-foreground">
                      {nextActivity.short_description}
                    </span>
                  )}
                  {nextActivity.subject_title && (
                    <span className="text-sm text-muted-foreground italic">
                      From: {nextActivity.subject_title}
                    </span>
                  )}
                </div>
                <div className="flex flex-row items-center justify-between gap-2">
                  {getLoopTypeBadge(nextActivity.loop_type)}
                  {nextActivity.avatar_name && (
                    <div className="flex flex-row items-center justify-center gap-2">
                      <span className="text-base">
                        Hosted by <strong>{nextActivity.avatar_name}</strong>
                      </span>
                      <Avatar className="size-10">
                        <AvatarImage
                          src={nextActivity.avatar_image_url || undefined}
                          alt={nextActivity.avatar_name}
                        />
                        <AvatarFallback></AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Link>
        </div>
      ) : (
        <div className="min-h-32 flex items-center justify-center p-6">
          <div className="border border-primary rounded-2xl bg-white p-6 text-center">
            <p className="text-lg">
              🎉 You&apos;ve completed all activities in this course section!
            </p>
          </div>
        </div>
      )}
    </>
  );

  if (isDesktop) {
    return (
      <AlertDialog open={isCompleted} onOpenChange={setIsCompleted}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              Activity Completed
              <Check className="text-green-500" />
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Ready for the next one?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="">{dialogContent}</div>

          <AlertDialogFooter className="w-full pt-4">
            <Link href="/learn">
              <Button variant="link" className="text-primary">
                <ArrowLeft className="" />
                Back to Courses
              </Button>
            </Link>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <Drawer open={isCompleted} onOpenChange={setIsCompleted}>
      <DrawerContent className="px-12 pb-8">
        <DrawerHeader className="pt-12 pb-6 px-0 border-none">
          <DrawerTitle className="flex flex-row gap-2 px-0">
            Great job!
            <Check className="text-green-500" />
          </DrawerTitle>
          <DrawerDescription className="text-left">
            Ready for the next challenge?
          </DrawerDescription>
        </DrawerHeader>
        <div className="">{dialogContent}</div>
        <DrawerFooter className="px-0">
          <Link href="/courses">
            <Button variant="outline" className="text-muted-foreground">
              <ArrowLeft className="" />
              Back to Courses
            </Button>
          </Link>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function getLoopTypeBadge(loopType: string | null) {
  if (!loopType) return null;

  const variants: Record<string, { label: string; className: string }> = {
    introduce: {
      label: "Intro",
      className: "text-base bg-blue-600 text-white rounded-full px-4",
    },
    practice: {
      label: "Practice",
      className: "text-base bg-orange-600 text-white rounded-full px-4",
    },
    assess: {
      label: "Test",
      className: "text-base bg-green-600 text-white rounded-full px-4",
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
