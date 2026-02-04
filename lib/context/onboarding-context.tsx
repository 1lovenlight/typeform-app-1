
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "./user-context";

// Define all onboarding steps
export type OnboardingStep =
  | "home_welcome"
  | "home_features"
  | "learn_first_visit"
  | "practice_first_visit"
  | "practice_history_intro"
  | "activity_roleplay_intro"
  | "activity_typeform_intro"
  | "settings_theme"
  | "settings_profile";

interface StepState {
  completed: boolean;
  dismissed: boolean;
  completedAt?: string;
  dismissedAt?: string;
}

interface OnboardingState {
  [key: string]: StepState;
}

interface OnboardingContextValue {
  state: OnboardingState;
  loading: boolean;
  isStepCompleted: (step: OnboardingStep) => boolean;
  isStepDismissed: (step: OnboardingStep) => boolean;
  shouldShowStep: (step: OnboardingStep) => boolean;
  markCompleted: (step: OnboardingStep) => Promise<void>;
  markDismissed: (step: OnboardingStep) => Promise<void>;
  resetOnboarding: () => Promise<void>;
  refreshState: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

const STORAGE_KEY = "onboarding_state_v1";

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { userId, loading: userLoading } = useUser();
  const [state, setState] = useState<OnboardingState>({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Load state from localStorage (fast) and database (authoritative)
  const loadState = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // First, load from localStorage for instant UI
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        setState(JSON.parse(cached));
      } catch (e) {
        console.error("Failed to parse cached onboarding state", e);
      }
    }

    // Then fetch from database (authoritative source)
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("user_onboarding")
        .select("*")
        .eq("user_id", userId);

      if (error) throw error;

      const newState: OnboardingState = {};
      data?.forEach((row) => {
        newState[row.step] = {
          completed: row.completed,
          dismissed: row.dismissed,
          completedAt: row.completed_at || undefined,
          dismissedAt: row.dismissed_at || undefined,
        };
      });

      setState(newState);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (error) {
      console.error("Failed to load onboarding state", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userLoading) {
      loadState();
    }
  }, [userId, userLoading, loadState]);

  // Sync to database
  const syncToDatabase = async (
    step: OnboardingStep,
    updates: Partial<StepState>
  ) => {
    if (!userId || syncing) return;

    setSyncing(true);
    try {
      const supabase = createClient();
      const now = new Date().toISOString();

      const payload: any = {
        user_id: userId,
        step,
        updated_at: now,
      };

      if (updates.completed !== undefined) {
        payload.completed = updates.completed;
        if (updates.completed) {
          payload.completed_at = now;
        }
      }

      if (updates.dismissed !== undefined) {
        payload.dismissed = updates.dismissed;
        if (updates.dismissed) {
          payload.dismissed_at = now;
        }
      }

      const { error } = await supabase.from("user_onboarding").upsert(payload, {
        onConflict: "user_id,step",
      });

      if (error) throw error;

      // Update local state
      setState((prev) => {
        const newState = {
          ...prev,
          [step]: {
            ...prev[step],
            ...updates,
            ...(updates.completed && { completedAt: now }),
            ...(updates.dismissed && { dismissedAt: now }),
          },
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        return newState;
      });
    } catch (error) {
      console.error("Failed to sync onboarding state", error);
    } finally {
      setSyncing(false);
    }
  };

  const isStepCompleted = (step: OnboardingStep) =>
    state[step]?.completed || false;

  const isStepDismissed = (step: OnboardingStep) =>
    state[step]?.dismissed || false;

  const shouldShowStep = (step: OnboardingStep) =>
    !loading && !isStepCompleted(step) && !isStepDismissed(step);

  const markCompleted = async (step: OnboardingStep) => {
    await syncToDatabase(step, { completed: true, dismissed: false });
  };

  const markDismissed = async (step: OnboardingStep) => {
    await syncToDatabase(step, { dismissed: true });
  };

  const resetOnboarding = async () => {
    if (!userId) return;

    try {
      const supabase = createClient();
      await supabase.from("user_onboarding").delete().eq("user_id", userId);

      setState({});
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to reset onboarding", error);
    }
  };

  const refreshState = async () => {
    await loadState();
  };

  return (
    <OnboardingContext.Provider
      value={{
        state,
        loading,
        isStepCompleted,
        isStepDismissed,
        shouldShowStep,
        markCompleted,
        markDismissed,
        resetOnboarding,
        refreshState,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
}