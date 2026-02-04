"use client";

import { OnboardingDialog } from "@/components/onboarding/onboarding-dialog";
import {
  useOnboarding,
  OnboardingStep,
} from "@/lib/context/onboarding-context";
import { getOnboardingContent } from "@/lib/config/onboarding-content";

interface OnboardingStepProps {
  step: OnboardingStep;
}

/**
 * Simplified component that automatically loads content from config
 *
 * Usage:
 * <OnboardingStep step="home_welcome" />
 */
export function OnboardingStepDialog({ step }: OnboardingStepProps) {
  const { shouldShowStep, markCompleted, markDismissed } = useOnboarding();
  const config = getOnboardingContent(step);

  // If config is missing, don't render anything
  if (!config) {
    console.warn(`Onboarding config not found for step: ${step}`);
    return null;
  }

  return (
    <OnboardingDialog
      open={shouldShowStep(step)}
      onClose={(open) => !open && markDismissed(step)}
      title={config.title}
      description={config.description}
      items={config.items}
      imageSrc={config.imageSrc}
      aspectRatio={config.aspectRatio}
      continueText={config.continueText}
      videoPoster={config.videoPoster}
      videoAutoplay={config.videoAutoplay}
      videoControls={config.videoControls}
      videoMuted={config.videoMuted}
      videoLoop={config.videoLoop}
      onContinue={() => markCompleted(step)}
    />
  );
}
