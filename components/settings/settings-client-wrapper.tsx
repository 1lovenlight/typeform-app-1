"use client";

import { OnboardingStepDialog } from "@/components/onboarding/onboarding-step";

/**
 * Client wrapper for onboarding dialog on settings page
 * This allows the main settings page to be a server component
 */
export function SettingsClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <OnboardingStepDialog step="settings_theme" />
      {children}
    </>
  );
}

















