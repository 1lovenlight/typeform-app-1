import { NextResponse } from "next/server";
import { start } from "workflow/api";
import { scorePracticeSessionWorkflow } from "@/workflows/score/workflow";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { session_id } = await req.json();

    if (!session_id) {
      return NextResponse.json(
        { error: "session_id is required" },
        { status: 400 }
      );
    }

    // Verify user has access to this practice session
    const supabase = await createClient();
    const { data: session, error } = await supabase
      .from("practice_sessions")
      .select("id, user_id")
      .eq("id", session_id)
      .single();

    if (error || !session) {
      return NextResponse.json(
        { error: "Practice session not found or access denied" },
        { status: 404 }
      );
    }

    // Start the scoring workflow
    const run = await start(scorePracticeSessionWorkflow, [session_id]);

    return NextResponse.json({
      message: "Scoring workflow started",
      run_id: run.runId,
      session_id,
    });
  } catch (error) {
    console.error("Error in /api/score:", error);
    return NextResponse.json(
      {
        error: "Failed to start scoring workflow",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
