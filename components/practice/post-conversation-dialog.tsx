"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Home, RotateCcw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

interface PostConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string | null;
}

type DialogState = "idle" | "scoring" | "scored" | "error" | "waiting_transcript";

export function PostConversationDialog({
  open,
  onOpenChange,
  sessionId,
}: PostConversationDialogProps) {
  const router = useRouter();
  const [state, setState] = useState<DialogState>("idle");
  const [scorecardId, setScorecardId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setState("idle");
      setScorecardId(null);
      setErrorMessage(null);
    }
  }, [open]);

  // Poll for scoring status
  const pollScoringStatus = useCallback(async () => {
    if (!sessionId) return;

    try {
      const response = await fetch(`/api/score/status?session_id=${sessionId}`);
      
      if (!response.ok) {
        throw new Error("Failed to check scoring status");
      }

      const data = await response.json();

      if (data.scoring_status === "scored" && data.scorecard_id) {
        setState("scored");
        setScorecardId(data.scorecard_id);
      } else if (data.scoring_status === "failed") {
        setState("error");
        setErrorMessage("Scoring failed. Please try again.");
      } else if (data.scoring_status === "scoring") {
        // Still scoring, continue polling
        setTimeout(() => pollScoringStatus(), 2000);
      }
    } catch (error) {
      console.error("Error polling scoring status:", error);
      setState("error");
      setErrorMessage("Failed to check scoring status");
    }
  }, [sessionId]);

  // Check if transcript is ready
  const checkTranscriptReady = useCallback(async () => {
    if (!sessionId) return false;

    try {
      const response = await fetch(`/api/score/status?session_id=${sessionId}`);
      
      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.has_transcript;
    } catch (error) {
      console.error("Error checking transcript:", error);
      return false;
    }
  }, [sessionId]);

  // Wait for transcript with polling
  const waitForTranscript = useCallback(async () => {
    setState("waiting_transcript");
    
    let attempts = 0;
    const maxAttempts = 15; // 30 seconds max wait

    const checkTranscript = async (): Promise<boolean> => {
      if (attempts >= maxAttempts) {
        setState("error");
        setErrorMessage("Transcript is taking longer than expected. Please try scoring from the history page later.");
        return false;
      }

      const ready = await checkTranscriptReady();
      
      if (ready) {
        return true;
      }

      attempts++;
      await new Promise(resolve => setTimeout(resolve, 2000));
      return checkTranscript();
    };

    return checkTranscript();
  }, [checkTranscriptReady]);

  const handleGetScore = async () => {
    if (!sessionId) {
      toast.error("No session found");
      return;
    }

    setState("scoring");

    try {
      // First check if transcript is ready
      const transcriptReady = await checkTranscriptReady();
      
      if (!transcriptReady) {
        // Wait for transcript
        const ready = await waitForTranscript();
        if (!ready) {
          return; // Error state already set
        }
      }

      // Start scoring workflow
      const response = await fetch("/api/score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ session_id: sessionId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to start scoring");
      }

      // Start polling for completion
      setTimeout(() => pollScoringStatus(), 2000);
    } catch (error) {
      console.error("Error starting scoring:", error);
      setState("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to start scoring"
      );
    }
  };

  const handleStartOver = () => {
    onOpenChange(false);
    router.refresh();
  };

  const handleGoHome = () => {
    onOpenChange(false);
    router.push("/home");
  };

  const handleViewResults = () => {
    if (sessionId) {
      onOpenChange(false);
      router.push(`/practice/history/${sessionId}`);
    }
  };

  const handleRetry = () => {
    setState("idle");
    setErrorMessage(null);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {state === "idle" && "Practice Session Complete"}
            {state === "waiting_transcript" && "Finalizing Transcript..."}
            {state === "scoring" && "Scoring Your Performance"}
            {state === "scored" && "Score Ready!"}
            {state === "error" && "Oops!"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {state === "idle" &&
              "Great job! What would you like to do next?"}
            {state === "waiting_transcript" &&
              "Please wait while we finalize your conversation transcript..."}
            {state === "scoring" &&
              "Our AI is evaluating your conversation. This may take a few moments..."}
            {state === "scored" &&
              "Your performance has been scored! Click below to view your detailed results."}
            {state === "error" && (errorMessage || "Something went wrong.")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {state === "idle" && (
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              onClick={handleGetScore}
              className="w-full"
              variant="default"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Get My Score
            </Button>
            <div className="flex gap-2 w-full">
              <Button
                onClick={handleStartOver}
                className="flex-1"
                variant="outline"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Start Over
              </Button>
              <Button
                onClick={handleGoHome}
                className="flex-1"
                variant="outline"
              >
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </div>
          </AlertDialogFooter>
        )}

        {(state === "waiting_transcript" || state === "scoring") && (
          <div className="flex items-center justify-center py-8">
            <Spinner className="h-8 w-8" />
          </div>
        )}

        {state === "scored" && (
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => onOpenChange(false)}>
              Close
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleViewResults}>
              View Results
            </AlertDialogAction>
          </AlertDialogFooter>
        )}

        {state === "error" && (
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => onOpenChange(false)}>
              Close
            </AlertDialogCancel>
            <Button onClick={handleRetry} variant="default">
              Try Again
            </Button>
          </AlertDialogFooter>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}


