"use client";

import { Button } from "@/components/ui/button";
import { TestTube2 } from "lucide-react";

/**
 * Test button component to manually trigger activity completion dialog
 * This button calls the window.__triggerActivityCompletion function that
 * is set up by the ActivityCompletion component when testMode is enabled.
 */
export function ActivityCompletionTestButton() {
  const handleTestCompletion = () => {
    const trigger = (
      window as unknown as { __triggerActivityCompletion?: () => void }
    ).__triggerActivityCompletion;

    if (trigger) {
      trigger();
    } else {
      console.error(
        "Activity completion trigger not found. Make sure ActivityCompletion component is mounted with testMode={true}"
      );
    }
  };

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <Button
      onClick={handleTestCompletion}
      variant="outline"
      size="sm"
      className="fixed bottom-4 left-4 z-50 gap-2 shadow-lg"
    >
      <TestTube2 className="h-4 w-4" />
      Test Completion
    </Button>
  );
}
