import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  scorecardOutputSchema,
  type ScorecardOutput,
} from "@/lib/schemas/scorecard";

// Helper: Flatten transcript array to readable text
function flattenTranscript(transcript: any): string {
  if (!transcript) {
    return "";
  }

  // If it's already a string, return it
  if (typeof transcript === "string") {
    return transcript.trim();
  }

  // If it's an array, process it
  if (Array.isArray(transcript)) {
    const filtered = transcript.filter(
      (entry) =>
        entry &&
        typeof entry === "object" &&
        entry.role &&
        entry.message &&
        typeof entry.message === "string" &&
        entry.message.trim().length > 0
    );

    if (filtered.length === 0) {
      return "";
    }

    return filtered
      .map((entry) => `${entry.role.toUpperCase()}: ${entry.message}`)
      .join("\n\n");
  }

  return "";
}

// Step: Fetch practice session from database
async function fetchPracticeSession(sessionId: string) {
  "use step";

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("practice_sessions")
    .select("id, user_id, activity_id, transcript, scoring_status")
    .eq("id", sessionId)
    .single();

  if (error || !data) {
    throw new Error(`Practice session not found: ${sessionId}`);
  }

  // Update status to scoring
  await supabase
    .from("practice_sessions")
    .update({ scoring_status: "scoring" })
    .eq("id", sessionId);

  // Flatten transcript to text
  const transcriptText = flattenTranscript(data.transcript);

  if (!transcriptText || transcriptText.trim().length === 0) {
    throw new Error(
      `No valid transcript found for session: ${sessionId}. Transcript data type: ${typeof data.transcript}, is array: ${Array.isArray(data.transcript)}, length: ${Array.isArray(data.transcript) ? data.transcript.length : "N/A"}`
    );
  }

  return {
    id: data.id,
    user_id: data.user_id,
    activity_id: data.activity_id,
    transcript_text: transcriptText,
  };
}

// Step: Fetch rubric prompt from prompts table
async function fetchRubric() {
  "use step";

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("prompts")
    .select("id, template")
    .eq("label", "scorecard_rubric")
    .single();

  if (error || !data) {
    throw new Error(
      "Scorecard rubric not found. Please add a prompt with label 'scorecard_rubric' to the prompts table."
    );
  }

  if (!data.template) {
    throw new Error("Rubric template is empty");
  }

  return { id: data.id, prompt: data.template };
}

// Step: Score transcript using AI
async function scoreWithAI(
  transcriptText: string,
  rubricPrompt: string
): Promise<ScorecardOutput> {
  "use step";

  const { object } = await generateObject({
    model: openai("gpt-5.2"),
    schema: scorecardOutputSchema,
    system: `You are an expert conversation evaluator.
Score the following conversation transcript according to the provided rubric.
Be fair, constructive, and specific in your feedback.
Provide scores that accurately reflect performance with clear rationale.`,
    prompt: `## Rubric
${rubricPrompt}

## Transcript
${transcriptText}

Evaluate this conversation according to the rubric criteria above.`,
  });

  return object;
}

// Step: Save scorecard to database
async function saveScorecard(
  sessionId: string,
  userId: string,
  activityId: string | null,
  scores: ScorecardOutput
) {
  "use step";

  const supabase = createAdminClient();

  // Insert scorecard
  const { error: scorecardError } = await supabase.from("scorecards").insert({
    session_id: sessionId,
    user_id: userId,
    activity_id: activityId,
    overall_score: scores.overall_score,
    criteria_scores: scores.criteria_scores,
    feedback: scores.feedback,
  });

  if (scorecardError) {
    // Update session status to failed
    await supabase
      .from("practice_sessions")
      .update({ scoring_status: "failed" })
      .eq("id", sessionId);
    throw new Error(`Failed to save scorecard: ${scorecardError.message}`);
  }

  // Update session status to scored
  await supabase
    .from("practice_sessions")
    .update({ scoring_status: "scored" })
    .eq("id", sessionId);

  return { success: true };
}

// Main workflow orchestrator
export async function scorePracticeSessionWorkflow(sessionId: string) {
  "use workflow";

  // Step 1: Fetch the practice session
  const session = await fetchPracticeSession(sessionId);

  // Step 2: Fetch the rubric from prompts table
  const rubric = await fetchRubric();

  // Step 3: Score with AI
  const scores = await scoreWithAI(session.transcript_text, rubric.prompt);

  // Step 4: Save results
  await saveScorecard(
    session.id,
    session.user_id,
    session.activity_id,
    scores
  );

  return {
    session_id: sessionId,
    overall_score: scores.overall_score,
    status: "completed",
  };
}
