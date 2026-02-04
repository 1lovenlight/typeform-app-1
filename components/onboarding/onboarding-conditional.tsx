import { OnboardingStep } from "@/lib/context/onboarding-context";
import { ReactNode, Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getUserNextActivity } from "@/lib/actions/user-actions";
import { Skeleton } from "../ui/skeleton";
import Link from "next/link";
import { ArrowRight, ChevronRightIcon } from "lucide-react";
import { ItemContent, ItemTitle, Item } from "@/components/ui/item";
import { Button } from "../ui/button";

interface OnboardingConditionalProps {
  step: OnboardingStep;
  showWhenCompleted?: boolean;
  showWhenNotCompleted?: boolean;
  children: ReactNode;
}

interface OnboardingConditionalClientProps {
  step: OnboardingStep;
  showWhenCompleted?: boolean;
  showWhenNotCompleted?: boolean;
  children: ReactNode;
  isCompleted: boolean;
}

/**
 * Client component that conditionally renders based on completion status
 */
function OnboardingConditionalClient({
  showWhenCompleted = false,
  showWhenNotCompleted = false,
  children,
  isCompleted,
}: Omit<OnboardingConditionalClientProps, "step">) {
  if (showWhenCompleted && isCompleted) return <>{children}</>;
  if (showWhenNotCompleted && !isCompleted) return <>{children}</>;

  return null;
}

/**
 * Server component that fetches onboarding state
 */
async function OnboardingConditionalServer({
  step,
  showWhenCompleted = false,
  showWhenNotCompleted = false,
  children,
}: OnboardingConditionalProps) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;

  if (!userId) {
    // If not logged in, only show content when showWhenNotCompleted is true
    if (showWhenNotCompleted) return <>{children}</>;
    return null;
  }

  // Fetch onboarding state from database
  const { data: onboardingData } = await supabase
    .from("user_onboarding")
    .select("completed")
    .eq("user_id", userId)
    .eq("step", step)
    .single();

  const isCompleted = onboardingData?.completed || false;

  return (
    <OnboardingConditionalClient
      showWhenCompleted={showWhenCompleted}
      showWhenNotCompleted={showWhenNotCompleted}
      isCompleted={isCompleted}
    >
      {children}
    </OnboardingConditionalClient>
  );
}

/**
 * Conditionally render content based on onboarding completion status
 *
 * Usage in server components:
 * <Suspense fallback={null}>
 *   <OnboardingConditional step="home_welcome" showWhenCompleted>
 *     <p>You've seen the welcome message!</p>
 *   </OnboardingConditional>
 * </Suspense>
 */
export function OnboardingConditional(props: OnboardingConditionalProps) {
  return (
    <Suspense fallback={null}>
      <OnboardingConditionalServer {...props} />
    </Suspense>
  );
}

/**
 * Server component that fetches next activity
 */
async function WelcomeBackMessageServer() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;

  if (!userId) {
    return null;
  }

  const nextActivity = await getUserNextActivity(userId);

  // Determine destination
  const destination = nextActivity
    ? `/activity/${
        nextActivity.activity_type === "roleplay" ? "roleplay" : "typeform"
      }/${nextActivity.id}`
    : "/practice";

  // Show the link
  return (
    <Button
      asChild
      variant="brand"
      size="xl"
      className="w-full rounded justify-between"
    >
      <Link href={destination}>
        {nextActivity ? (
          <>
            <span className="truncate">
              Next Activity – {nextActivity.display_name}
            </span>
            <ChevronRightIcon />
          </>
        ) : (
          <>
            <span className="truncate">Ready for a roleplay?</span>
            <ArrowRight />
          </>
        )}
      </Link>
    </Button>
  );
}

/*
 * Show a welcome back message with next activity link
 */
export function WelcomeBackMessage() {
  return (
    <Suspense fallback={<Skeleton className="h-12 rounded-full w-full" />}>
      <WelcomeBackMessageServer />
    </Suspense>
  );
}
