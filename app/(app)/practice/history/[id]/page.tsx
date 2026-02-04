import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, User, Calendar } from "lucide-react";
import { ScorecardDisplay } from "@/components/practice/scorecard-display";
import { PageContainer } from "@/components/layout/page-container";

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

  if (typeof transcript === "string") {
    try {
      const parsed = JSON.parse(transcript);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  return Array.isArray(transcript) ? transcript : null;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "0m";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default async function PracticeSessionDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // Fetch the specific practice session
  const { data: session, error: sessionError } = await supabase
    .from("practice_sessions")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id) // Ensure user owns this session
    .single();

  if (sessionError || !session) {
    notFound();
  }

  // Fetch scorecard for this session
  const { data: scorecards, error: scorecardsError } = await supabase
    .from("scorecards")
    .select("id, overall_score, criteria_scores, feedback, created_at")
    .eq("session_id", id);

  if (scorecardsError) {
    console.error("Error fetching scorecards:", scorecardsError);
  }

  const sessionWithScorecard: PracticeSession = {
    ...session,
    scorecards: scorecards || [],
  };

  const transcript = parseTranscript(sessionWithScorecard.transcript);
  const hasScorecard =
    Array.isArray(sessionWithScorecard.scorecards) &&
    sessionWithScorecard.scorecards.length > 0;

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/practice/history">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Session Details</h1>
            <p className="text-muted-foreground text-sm">
              {formatDate(sessionWithScorecard.created_at)}
            </p>
          </div>
        </div>

        {/* Session Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>
              {sessionWithScorecard.call_summary_title || "Practice Session"}
            </CardTitle>
            <CardDescription>
              <div className="flex flex-wrap gap-3 mt-2">
                {sessionWithScorecard.character_name && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {sessionWithScorecard.character_name}
                  </Badge>
                )}
                {sessionWithScorecard.call_duration_secs && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(sessionWithScorecard.call_duration_secs)}
                  </Badge>
                )}
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(sessionWithScorecard.created_at)}
                </Badge>
              </div>
            </CardDescription>
          </CardHeader>
          {sessionWithScorecard.transcript_summary && (
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {sessionWithScorecard.transcript_summary}
              </p>
            </CardContent>
          )}
        </Card>

        {/* Scorecard */}
        {hasScorecard && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Performance Score</h2>
            <ScorecardDisplay scorecard={sessionWithScorecard.scorecards![0]} />
          </div>
        )}

        {/* Full Transcript */}
        {transcript && transcript.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Full Transcript</h2>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {transcript.map((entry, index) => {
                    const role = entry.role || "unknown";
                    const message = entry.message || "";

                    if (!message) return null;

                    return (
                      <div
                        key={index}
                        className={`flex ${
                          role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-xs font-semibold mb-1 opacity-70">
                            {role === "user" ? "You" : "Assistant"}
                          </p>
                          <p className="text-sm whitespace-pre-wrap">{message}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* No transcript message */}
        {(!transcript || transcript.length === 0) && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <p>No transcript available for this session.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}


