import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ElevenLabsWebhookPayload } from "@/lib/schemas/scorecard";

export const maxDuration = 30;

/**
 * ElevenLabs Webhook Endpoint
 * 
 * Receives webhook from ElevenLabs when a conversation ends.
 * Updates the practice_session with full call data, transcript, and metadata.
 * 
 * The practice_session is created client-side when the conversation starts,
 * and this webhook enriches it with the complete data after the call ends.
 */
export async function POST(req: Request) {
  try {
    const payload: ElevenLabsWebhookPayload = await req.json();
    
    console.log("[ElevenLabs Webhook] Received webhook for conversation:", payload.conversation_id);

    // Validate required fields
    if (!payload.conversation_id) {
      console.error("[ElevenLabs Webhook] Missing conversation_id");
      return NextResponse.json(
        { error: "conversation_id is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Find existing practice session by conversation_id or agent_id + recent timestamp
    // First try by conversation_id if it was stored
    let { data: session, error: sessionError } = await supabase
      .from("practice_sessions")
      .select("id, user_id")
      .eq("conversation_id", payload.conversation_id)
      .maybeSingle();

    // If not found by conversation_id, try to find by agent_id and recent timestamp
    if (!session && payload.agent_id) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data: recentSession, error: recentError } = await supabase
        .from("practice_sessions")
        .select("id, user_id")
        .eq("agent_id", payload.agent_id)
        .is("conversation_id", null)
        .gte("created_at", fiveMinutesAgo)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recentError) {
        console.error("[ElevenLabs Webhook] Error finding recent session:", recentError);
      }

      session = recentSession;
    }

    if (!session) {
      console.warn("[ElevenLabs Webhook] No matching practice session found for conversation:", payload.conversation_id);
      
      // Could create a new session here if needed, but for now we log and return success
      return NextResponse.json({
        message: "No matching session found. Session may have been created client-side.",
        status: "no_session_found",
      });
    }

    // Extract data from webhook payload
    const updateData = {
      conversation_id: payload.conversation_id,
      agent_id: payload.agent_id || null,
      transcript: payload.transcript || null,
      call_data: payload as any, // Store full payload for reference
      
      // Metadata
      start_time_unix_secs: payload.metadata?.start_time_unix_secs || null,
      call_duration_secs: payload.metadata?.call_duration_secs || null,
      termination_reason: payload.metadata?.termination_reason || null,
      cost_cents: (payload.metadata as any)?.cost || null,
      
      // Analysis
      call_successful: payload.analysis?.call_successful || null,
      transcript_summary: payload.analysis?.transcript_summary || null,
      call_summary_title: (payload.analysis as any)?.call_summary_title || null,
      did_coach_participate: (payload.analysis as any)?.data_collection_results?.did_coach_participate?.value ?? null,
      
      // Dynamic variables (if not already set)
      character_name: payload.conversation_initiation_client_data?.dynamic_variables?.character_name || null,
      activity_id: payload.conversation_initiation_client_data?.dynamic_variables?.activity_id || null,
    };

    // Update the practice session
    const { error: updateError } = await supabase
      .from("practice_sessions")
      .update(updateData)
      .eq("id", session.id);

    if (updateError) {
      console.error("[ElevenLabs Webhook] Error updating session:", updateError);
      return NextResponse.json(
        { error: "Failed to update practice session" },
        { status: 500 }
      );
    }

    console.log("[ElevenLabs Webhook] Successfully updated session:", session.id);

    // TODO: Optionally trigger automatic scoring here
    // await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/score`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ session_id: session.id }),
    // });

    return NextResponse.json({
      message: "Webhook processed successfully",
      session_id: session.id,
      status: "success",
    });
  } catch (error) {
    console.error("[ElevenLabs Webhook] Error processing webhook:", error);
    return NextResponse.json(
      {
        error: "Failed to process webhook",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
