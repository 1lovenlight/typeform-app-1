"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "./user-context";

export interface NextActivityResult {
  id: string;
  display_name: string;
  activity_type: string | null;
  module_title?: string;
  course_title?: string;
}

interface ActivityWithModule {
  id: string;
  display_name: string;
  activity_type: string | null;
  order_index: number | null;
  published: boolean | null;
  modules:
    | {
        id: string;
        title: string;
        course_id: string;
        courses: { title: string } | { title: string }[] | null;
      }
    | {
        id: string;
        title: string;
        course_id: string;
        courses: { title: string } | { title: string }[] | null;
      }[]
    | null;
}

interface UserProgressContextValue {
  completedActivityIds: Set<string>;
  isActivityCompleted: (activityId: string) => boolean;
  markActivityCompleted: (activityId: string) => Promise<void>;
  nextActivity: NextActivityResult | null;
  loading: boolean;
  refreshProgress: () => Promise<void>;
}

const UserProgressContext = createContext<UserProgressContextValue | null>(
  null
);

const STORAGE_KEY = "user_progress_v1";

export function UserProgressProvider({ children }: { children: ReactNode }) {
  const { userId, loading: userLoading } = useUser();
  const [completedActivityIds, setCompletedActivityIds] = useState<Set<string>>(
    new Set()
  );
  const [allActivities, setAllActivities] = useState<ActivityWithModule[]>([]);
  const [loading, setLoading] = useState(true);

  // Load progress from localStorage (fast) and database (authoritative)
  const loadProgress = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // First, load from localStorage for instant UI
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.userId === userId && Array.isArray(parsed.activityIds)) {
          setCompletedActivityIds(new Set(parsed.activityIds));
        }
      } catch (e) {
        console.error("Failed to parse cached progress state", e);
      }
    }

    // Then fetch from database (authoritative source)
    try {
      const supabase = createClient();

      // Fetch completed activities
      const { data: completedData, error: completedError } = await supabase
        .from("user_progress")
        .select("activity_id")
        .eq("user_id", userId);

      if (completedError) throw completedError;

      const completedIds = completedData?.map((c) => c.activity_id) || [];
      setCompletedActivityIds(new Set(completedIds));

      // Cache in localStorage
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ userId, activityIds: completedIds })
      );

      // Fetch all published activities for next activity calculation
      const { data: activitiesData, error: activitiesError } = await supabase
        .from("activities")
        .select(
          `
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
        `
        )
        .eq("published", true)
        .order("order_index", { ascending: true });

      if (activitiesError) throw activitiesError;

      setAllActivities((activitiesData as ActivityWithModule[]) || []);
    } catch (error) {
      console.error("Failed to load progress state", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Set up realtime subscription
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    const channel = supabase
      .channel("user_progress_context")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_progress",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newActivityId = payload.new.activity_id;
          setCompletedActivityIds((prev) => {
            const newSet = new Set(prev);
            newSet.add(newActivityId);

            // Update localStorage
            localStorage.setItem(
              STORAGE_KEY,
              JSON.stringify({ userId, activityIds: Array.from(newSet) })
            );

            return newSet;
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "user_progress",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Refetch on delete to ensure consistency
          loadProgress();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, loadProgress]);

  // Load progress when user is ready
  useEffect(() => {
    if (!userLoading) {
      loadProgress();
    }
  }, [userId, userLoading, loadProgress]);

  // Compute next activity from all activities minus completed
  const nextActivity = useMemo((): NextActivityResult | null => {
    if (loading || allActivities.length === 0) return null;

    const next = allActivities.find(
      (activity) => !completedActivityIds.has(activity.id)
    );

    if (!next) return null;

    const moduleData = Array.isArray(next.modules)
      ? next.modules[0]
      : next.modules;

    const courseData = Array.isArray(moduleData?.courses)
      ? moduleData.courses[0]
      : moduleData?.courses;

    return {
      id: next.id,
      display_name: next.display_name,
      activity_type: next.activity_type,
      module_title: moduleData?.title,
      course_title: courseData?.title,
    };
  }, [allActivities, completedActivityIds, loading]);

  const isActivityCompleted = useCallback(
    (activityId: string) => completedActivityIds.has(activityId),
    [completedActivityIds]
  );

  const markActivityCompleted = useCallback(
    async (activityId: string) => {
      if (!userId) return;

      try {
        const supabase = createClient();
        const { error } = await supabase.from("user_progress").upsert(
          {
            user_id: userId,
            activity_id: activityId,
            completed_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,activity_id",
          }
        );

        if (error) throw error;

        // Optimistic update (realtime will also update, but this is faster)
        setCompletedActivityIds((prev) => {
          const newSet = new Set(prev);
          newSet.add(activityId);
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ userId, activityIds: Array.from(newSet) })
          );
          return newSet;
        });
      } catch (error) {
        console.error("Failed to mark activity as completed", error);
      }
    },
    [userId]
  );

  const refreshProgress = useCallback(async () => {
    await loadProgress();
  }, [loadProgress]);

  return (
    <UserProgressContext.Provider
      value={{
        completedActivityIds,
        isActivityCompleted,
        markActivityCompleted,
        nextActivity,
        loading,
        refreshProgress,
      }}
    >
      {children}
    </UserProgressContext.Provider>
  );
}

export function useUserProgress() {
  const context = useContext(UserProgressContext);
  if (!context) {
    throw new Error(
      "useUserProgress must be used within UserProgressProvider"
    );
  }
  return context;
}

