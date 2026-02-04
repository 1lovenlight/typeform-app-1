import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "session_id is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch practice session with scoring status
    const { data: session, error: sessionError } = await supabase
      .from("practice_sessions")
      .select("id, user_id, scoring_status, transcript")
      .eq("id", sessionId)
      .eq("user_id", user.id) // Ensure user owns this session
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Session not found or access denied" },
        { status: 404 }
      );
    }

    // Check if scorecard exists
    const { data: scorecard, error: scorecardError } = await supabase
      .from("scorecards")
      .select("id")
      .eq("session_id", sessionId)
      .maybeSingle();

    if (scorecardError) {
      console.error("Error fetching scorecard:", scorecardError);
    }

    // Check if transcript exists and has content
    const hasTranscript = Boolean(
      session.transcript &&
        Array.isArray(session.transcript) &&
        session.transcript.length > 0
    );

    return NextResponse.json({
      session_id: sessionId,
      scoring_status: session.scoring_status,
      scorecard_id: scorecard?.id || null,
      has_transcript: hasTranscript,
    });
  } catch (error) {
    console.error("Error in /api/score/status:", error);
    return NextResponse.json(
      {
        error: "Failed to get scoring status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


