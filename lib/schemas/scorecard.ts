import { z } from "zod";

// Individual criterion score
export const criterionScoreSchema = z.object({
  name: z.string().describe("Name of the scoring criterion"),
  score: z.number().min(0).describe("Score achieved for this criterion"),
  max_score: z.number().min(1).describe("Maximum possible score for this criterion"),
  rationale: z.string().describe("Explanation for why this score was given"),
});

// Complete scorecard output from AI
export const scorecardOutputSchema = z.object({
  overall_score: z
    .number()
    .min(0)
    .max(100)
    .describe("Overall percentage score from 0-100"),
  criteria_scores: z
    .array(criterionScoreSchema)
    .describe("Individual scores for each rubric criterion"),
  feedback: z
    .string()
    .describe("Constructive feedback summary for the user"),
});

// Type exports
export type CriterionScore = z.infer<typeof criterionScoreSchema>;
export type ScorecardOutput = z.infer<typeof scorecardOutputSchema>;

// ElevenLabs webhook payload types
export interface ElevenLabsTranscriptEntry {
  role: "agent" | "user";
  message: string;
  time_in_call_secs?: number;
  tool_calls?: unknown[];
  tool_results?: unknown[];
}

export interface ElevenLabsWebhookPayload {
  agent_id: string;
  conversation_id: string;
  status: string;
  transcript: ElevenLabsTranscriptEntry[];
  metadata?: {
    start_time_unix_secs?: number;
    call_duration_secs?: number;
    termination_reason?: string;
    [key: string]: unknown;
  };
  analysis?: {
    transcript_summary?: string;
    call_successful?: string;
    [key: string]: unknown;
  };
  conversation_initiation_client_data?: {
    dynamic_variables?: {
      user_id?: string;
      scenario_id?: string;
      persona_id?: string;
      [key: string]: string | undefined;
    };
    [key: string]: unknown;
  };
}
