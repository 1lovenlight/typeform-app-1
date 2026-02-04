/**
 * Example Usage of Onboarding System
 * 
 * This file demonstrates how to use the onboarding context and dialog
 * on different pages throughout your application.
 */

"use client";

import { OnboardingDialog } from "@/components/onboarding/onboarding-dialog";
import { useOnboarding } from "@/lib/context/onboarding-context";
import { SparklesIcon, ZapIcon } from "lucide-react";

// Example 1: Simple onboarding dialog on a page
export function HomePageOnboarding() {
  const { shouldShowStep, markCompleted, markDismissed } = useOnboarding();

  const items = [
    {
      icon: SparklesIcon,
      text: "Welcome to your learning dashboard",
    },
    {
      icon: ZapIcon,
      text: "Start with any activity to begin your journey",
    },
  ];

  return (
    <OnboardingDialog
      open={shouldShowStep("home_welcome")}
      onClose={(open) => !open && markDismissed("home_welcome")}
      title="Welcome Home!"
      description="Let's get you started with the basics"
      items={items}
      continueText="Get Started"
      onContinue={() => markCompleted("home_welcome")}
    />
  );
}

// Example 2: Inline banner for feature introduction
export function InlineOnboardingBanner() {
  const { shouldShowStep, markCompleted, markDismissed } = useOnboarding();

  if (!shouldShowStep("practice_first_visit")) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-blue-900">New to Practice Mode?</h3>
          <p className="text-sm text-blue-700 mt-1">
            Practice mode helps you improve your skills through interactive exercises.
          </p>
        </div>
        <div className="flex gap-2 ml-4">
          <button
            onClick={() => markDismissed("practice_first_visit")}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Dismiss
          </button>
          <button
            onClick={() => markCompleted("practice_first_visit")}
            className="text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}

// Example 3: Conditional rendering based on onboarding state
export function ConditionalFeature() {
  const { isStepCompleted } = useOnboarding();

  // Only show advanced features after user completes basic onboarding
  if (!isStepCompleted("home_welcome")) {
    return null;
  }

  return (
    <div>
      <h2>Advanced Features</h2>
      {/* Your advanced features here */}
    </div>
  );
}

// Example 4: Multi-step onboarding flow
export function MultiStepOnboarding() {
  const { shouldShowStep, markCompleted, markDismissed } = useOnboarding();

  // Step 1
  if (shouldShowStep("home_welcome")) {
    return (
      <OnboardingDialog
        open={true}
        onClose={(open) => !open && markDismissed("home_welcome")}
        title="Welcome!"
        description="Let's get you started"
        items={[]}
        continueText="Next"
        onContinue={() => markCompleted("home_welcome")}
      />
    );
  }

  // Step 2 - only shows after step 1 is completed
  if (shouldShowStep("home_features")) {
    return (
      <OnboardingDialog
        open={true}
        onClose={(open) => !open && markDismissed("home_features")}
        title="Key Features"
        description="Here's what you can do"
        items={[]}
        continueText="Finish"
        onContinue={() => markCompleted("home_features")}
      />
    );
  }

  return null;
}

















