import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OnboardingStepDialog } from "@/components/onboarding/onboarding-step";
import { PageContainer } from "@/components/layout/page-container";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Clock } from "lucide-react";
import { ScoreSessionButton } from "@/components/practice/score-session-button";
import { ScorecardDisplay } from "@/components/practice/scorecard-display";

import { PageHeaderWithActions } from "@/components/layout/text-headers";

interface CriterionScore {
  name: string;
  score: number;
  max_score: number;
  rationale: string;
}

interface Scorecard {
  id: string;
  overall_score: number;
  criteria_scores: CriterionScore[];
  feedback: string;
  created_at: string;
}

interface PracticeSession {
  id: string;
  user_id: string;
  created_at: string;
  transcript: Array<{ role?: string; message?: string }> | string | null;
  conversation_id: string | null;
  character_name: string | null;
  call_duration_secs: number | null;
  call_successful: string | null;
  transcript_summary: string | null;
  call_summary_title: string | null;
  termination_reason: string | null;
  cost_cents: number | null;
  did_coach_participate: boolean | null;
  scoring_status: string | null;
  scorecards?: Scorecard[];
}

// Helper to safely parse transcript JSON
function parseTranscript(
  transcript: Array<{ role?: string; message?: string }> | string | null
): Array<{ role?: string; message?: string }> | null {
  if (!transcript) return null;

  // If already an array, return as-is
  if (Array.isArray(transcript)) {
    return transcript;
  }

  // If it's a string, try to parse it
  if (typeof transcript === "string") {
    try {
      // First, try parsing the entire string
      const parsed = JSON.parse(transcript);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return null;
    } catch {
      // If parsing fails, try to extract valid JSON
      try {
        // Try to find the first complete JSON array in the string
        // Look for array start and try to parse progressively
        const arrayStart = transcript.indexOf("[");
        if (arrayStart !== -1) {
          // Try to find the matching closing bracket
          let bracketCount = 0;
          let endIndex = arrayStart;
          for (let i = arrayStart; i < transcript.length; i++) {
            if (transcript[i] === "[") bracketCount++;
            if (transcript[i] === "]") bracketCount--;
            if (bracketCount === 0) {
              endIndex = i + 1;
              break;
            }
          }
          const jsonSubstring = transcript.substring(arrayStart, endIndex);
          const parsed = JSON.parse(jsonSubstring);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        }
      } catch (parseError) {
        // If all parsing attempts fail, return null
        console.error("Failed to parse transcript:", parseError);
        return null;
      }
      return null;
    }
  }

  return null;
}

// Helper to clean and filter transcript messages
function cleanTranscript(
  transcriptArray: Array<{ role?: string; message?: string }> | null
): Array<{ role: string; message: string }> {
  if (!transcriptArray || !Array.isArray(transcriptArray)) return [];

  return transcriptArray
    .map((msg) => {
      // Clean the message: remove HTML tags and trim whitespace
      const cleanMessage = (msg.message || "").replace(/<[^>]*>/g, "").trim();

      // Only include messages that have:
      // 1. A valid role (agent or user)
      // 2. Non-empty message content after cleaning
      if (
        (msg.role === "agent" || msg.role === "user") &&
        cleanMessage.length > 0
      ) {
        return {
          role: msg.role === "agent" ? "agent" : "user",
          message: cleanMessage,
        };
      }
      return null;
    })
    .filter((msg): msg is { role: string; message: string } => msg !== null);
}

// Helper to format duration
function formatDuration(seconds: number | null): string {
  if (!seconds) return "N/A";
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

export default async function PracticeHistoryPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // Fetch practice sessions for this user
  const { data: sessions, error: sessionsError } = await supabase
    .from("practice_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (sessionsError) {
    console.error("Error fetching practice sessions:", sessionsError);
  }

  // Fetch scorecards separately for these sessions
  const sessionIds = sessions?.map((s) => s.id) || [];
  const { data: scorecards, error: scorecardsError } = await supabase
    .from("scorecards")
    .select(
      "id, session_id, overall_score, criteria_scores, feedback, created_at"
    )
    .in("session_id", sessionIds);

  if (scorecardsError) {
    console.error("Error fetching scorecards:", scorecardsError);
  }

  // Merge scorecards into sessions
  const sessionsWithScorecards = sessions?.map((session) => ({
    ...session,
    scorecards: scorecards?.filter((sc) => sc.session_id === session.id) || [],
  }));

  return (
    <PageContainer>
      <OnboardingStepDialog step="practice_history_intro" />
      <PageHeaderWithActions
        className="items-end"
        title="History"
        actions={
          <span className="text-text-secondary">
            Total Sessions: {sessionsWithScorecards?.length || 0}
          </span>
        }
      />

      {!sessionsWithScorecards || sessionsWithScorecards.length === 0 ? (
        <Card className="border-none shadow-none">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No practice sessions yet. Start your first practice session to see
              it here!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sessionsWithScorecards.map((session: PracticeSession) => {
            return (
              <Card
                key={session.id}
                className="border-none shadow-none rounded-2xl bg-card gap-2"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="mb-2">
                        {session.call_summary_title ||
                          session.character_name ||
                          "Practice Session"}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 flex-wrap">
                        <span>
                          {new Date(session.created_at).toLocaleString(
                            "en-US",
                            {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }
                          )}
                        </span>
                        {session.character_name && (
                          <Badge variant="outline">
                            {session.character_name}
                          </Badge>
                        )}
                        {/* {session.did_coach_participate === false && (
                          <Badge variant="secondary" className="text-xs">
                            Incomplete
                          </Badge>
                        )} */}
                        {session.call_duration_secs && (
                          <span className="flex items-center gap-1 text-xs">
                            <Clock className="h-3 w-3" />
                            {formatDuration(session.call_duration_secs)}
                          </span>
                        )}
                        {/* {session.call_successful && (
                          <span className="flex items-center gap-1 text-xs">
                            {isSuccessful ? (
                              <>
                                <CheckCircle2 className="h-3 w-3 text-green-600" />
                                <span className="text-green-600">Success</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 text-red-600" />
                                <span className="text-red-600">Failed</span>
                              </>
                            )}
                          </span>
                        )} */}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Score Button */}
                  <div className="flex justify-end">
                    <ScoreSessionButton
                      sessionId={session.id}
                      hasScorecard={
                        Array.isArray(session.scorecards) &&
                        session.scorecards.length > 0
                      }
                      scoringStatus={session.scoring_status}
                    />
                  </div>

                  {/* Scorecard Display */}
                  {Array.isArray(session.scorecards) &&
                    session.scorecards.length > 0 && (
                      <ScorecardDisplay scorecard={session.scorecards[0]} />
                    )}

                  {/* Summary */}
                  {session.transcript_summary && (
                    <div>
                      <h3 className="font-semibold text-sm mb-2">Summary:</h3>
                      <p className="text-sm text-muted-foreground">
                        {session.transcript_summary}
                      </p>
                    </div>
                  )}

                  {/* Transcript Preview */}
                  {/* {transcriptPreview.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        Conversation Preview:
                      </h3>
                      <div className="bg-muted rounded-lg p-3 space-y-1">
                        {transcriptPreview.map((preview, idx) => (
                          <p key={idx} className="text-xs font-mono">
                            {preview}
                          </p>
                        ))}
                      </div>
                    </div>
                  )} */}

                  {/* Termination Reason */}
                  {/* {session.termination_reason && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Ended:{" "}
                        {session.termination_reason.replace(
                          "Client disconnected: ",
                          ""
                        )}
                      </p>
                    </div>
                  )} */}

                  {/* Full Transcript (Collapsible) */}
                  {(() => {
                    const transcriptArray = parseTranscript(session.transcript);
                    const cleanedMessages = cleanTranscript(transcriptArray);

                    if (cleanedMessages.length === 0) {
                      return null;
                    }

                    return (
                      <Collapsible>
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="w-full text-xs mt-2"
                          >
                            <ChevronDown />
                            View Full Transcript ({cleanedMessages.length}{" "}
                            messages)
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="mt-2 bg-muted rounded-lg p-4 overflow-auto max-h-96 space-y-3">
                            {cleanedMessages.map((msg, idx) => (
                              <div key={idx} className="text-sm">
                                <div className="font-semibold text-xs uppercase text-muted-foreground mb-1">
                                  {msg.role === "agent" ? "AI" : "You"}
                                </div>
                                <div className="whitespace-pre-wrap break-words">
                                  {msg.message}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })()}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
