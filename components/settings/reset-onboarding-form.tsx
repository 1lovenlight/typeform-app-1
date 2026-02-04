"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";
import { useOnboarding } from "@/lib/context/onboarding-context";
import { toast } from "sonner";

export function ResetOnboardingForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isResettingOnboarding, setIsResettingOnboarding] = useState(false);
  const { resetOnboarding } = useOnboarding();

  const handleResetOnboarding = async () => {
    setIsResettingOnboarding(true);

    try {
      await resetOnboarding();

      // Close the dialog first
      setIsOpen(false);

      toast.success("Onboarding reset successfully!", {
        description:
          "You'll see the introduction dialogs again on your next visit to each page.",
      });

      // Reload the page after a delay to show the toast
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Failed to reset onboarding:", error);
      toast.error("Failed to reset onboarding", {
        description: "Please try again.",
      });
      setIsResettingOnboarding(false);
    }
  };

  return (
    <div className="flex flex-row gap-12 w-full items-start justify-between py-12">
      <div className="flex-1 flex-col gap-1">
        <h2 className="text-text-primary text-2xl">Reset Onboarding</h2>
        <p className="text-text-secondary text-sm text-pretty">
          Reset your onboarding progress to see all introduction dialogs and
          tutorials again. This is useful if you want to review the features or
          if you skipped something important.
        </p>
      </div>

      <div className="flex-1 w-full flex justify-end">
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="brand" className="w-full">
              Reset Onboarding
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="border-none">
            <AlertDialogHeader>
              <AlertDialogTitle>Reset onboarding?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to reset your onboarding? You&apos;ll see
                all introduction dialogs again on your next visit to each page.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-row justify-end">
              <AlertDialogCancel disabled={isResettingOnboarding}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleResetOnboarding();
                }}
                disabled={isResettingOnboarding}
              >
                {isResettingOnboarding ? (
                  <>
                    <Spinner className="size-4" />
                    Resetting...
                  </>
                ) : (
                  "Reset"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
