"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ScoreSessionButtonProps {
  sessionId: string;
  hasScorecard: boolean;
  scoringStatus?: string | null;
}

export function ScoreSessionButton({
  sessionId,
  hasScorecard,
  scoringStatus,
}: ScoreSessionButtonProps) {
  const [isScoring, setIsScoring] = useState(false);
  const router = useRouter();

  // Don't show button if already scored
  if (hasScorecard) {
    return null;
  }

  // Show loading state if currently scoring
  if (scoringStatus === "scoring") {
    return (
      <Button variant="secondary" size="sm" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
        Scoring...
      </Button>
    );
  }

  // Show retry button if failed
  if (scoringStatus === "failed") {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleScore}
        disabled={isScoring}
      >
        {isScoring ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Retrying...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Retry Scoring
          </>
        )}
      </Button>
    );
  }

  async function handleScore() {
    setIsScoring(true);

    try {
      const response = await fetch("/api/score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ session_id: sessionId }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to start scoring";
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      toast.success("Scoring started!", {
        description: "Your conversation is being evaluated. This may take a few seconds.",
      });

      // Refresh the page to show updated status
      router.refresh();
    } catch (error) {
      console.error("Error starting scoring:", error);
      toast.error("Failed to start scoring", {
        description:
          error instanceof Error ? error.message : "Please try again later",
      });
    } finally {
      setIsScoring(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleScore}
      disabled={isScoring}
    >
      {isScoring ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Starting...
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          Score Conversation
        </>
      )}
    </Button>
  );
}

