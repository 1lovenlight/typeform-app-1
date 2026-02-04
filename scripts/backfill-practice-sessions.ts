/**
 * Backfill Practice Sessions Script
 * 
 * This script extracts data from the call_data JSON field and populates
 * the new flattened columns in the practice_sessions table.
 * 
 * Usage:
 *   npx tsx scripts/backfill-practice-sessions.ts
 * 
 * Add --dry-run flag to preview changes without writing to database
 * Add --limit N to process only N records (useful for testing)
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../lib/supabase/types";
import { readFileSync } from "fs";
import { join } from "path";

// Load environment variables from .env.local
function loadEnvFile() {
  try {
    const envPath = join(process.cwd(), ".env.local");
    const envFile = readFileSync(envPath, "utf8");
    
    envFile.split("\n").forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith("#")) {
        const [key, ...valueParts] = trimmedLine.split("=");
        const value = valueParts.join("=").trim();
        // Remove quotes if present
        const cleanValue = value.replace(/^["']|["']$/g, "");
        process.env[key.trim()] = cleanValue;
      }
    });
  } catch {
    console.error("⚠️  Could not load .env.local file");
  }
}

loadEnvFile();

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing required environment variables:");
  console.error("   NEXT_PUBLIC_SUPABASE_URL");
  console.error("   SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Parse CLI arguments
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const limitIndex = args.indexOf("--limit");
const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1]) : undefined;

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

interface CallData {
  conversation_id?: string;
  agent_id?: string;
  status?: string;
  transcript?: Array<{ 
    role?: string; 
    message?: string;
    agent_metadata?: unknown;
    time_in_call_secs?: number;
  }>;
  metadata?: {
    start_time_unix_secs?: number;
    accepted_time_unix_secs?: number;
    call_duration_secs?: number;
    cost?: number;
    termination_reason?: string;
  };
  analysis?: {
    call_successful?: string;
    transcript_summary?: string;
    call_summary_title?: string;
    data_collection_results?: {
      did_coach_participate?: {
        data_collection_id?: string;
        value?: boolean | null;
        json_schema?: unknown;
        rationale?: string;
      };
    };
  };
  conversation_initiation_client_data?: {
    dynamic_variables?: {
      user_id?: string;
      activity_id?: string;
      character_name?: string;
      [key: string]: any;
    };
  };
}

async function backfillPracticeSessions() {
  console.log("\n🔄 Starting practice sessions backfill...\n");
  console.log(`Mode: ${isDryRun ? "DRY RUN (no changes will be made)" : "LIVE"}`);
  if (limit) console.log(`Limit: Processing ${limit} records\n`);

  try {
    // Fetch sessions that need backfilling (where conversation_id is null)
    let query = supabase
      .from("practice_sessions")
      .select("id, call_data, conversation_id")
      .is("conversation_id", null)
      .not("call_data", "is", null);

    if (limit) {
      query = query.limit(limit);
    }

    const { data: sessions, error: fetchError } = await query;

    if (fetchError) {
      console.error("❌ Error fetching sessions:", fetchError);
      process.exit(1);
    }

    if (!sessions || sessions.length === 0) {
      console.log("✅ No sessions found that need backfilling!");
      return;
    }

    console.log(`📊 Found ${sessions.length} session(s) to backfill\n`);

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const session of sessions) {
      let callData: CallData;

      // Parse call_data if it's a string
      try {
        if (typeof session.call_data === 'string') {
          callData = JSON.parse(session.call_data);
        } else {
          callData = session.call_data as CallData;
        }
      } catch {
        console.log(`⚠️  Skipping ${session.id} - invalid JSON in call_data`);
        skippedCount++;
        continue;
      }

      if (!callData || typeof callData !== 'object') {
        console.log(`⚠️  Skipping ${session.id} - no call_data`);
        skippedCount++;
        continue;
      }
      
      // Debug: Show structure on first record
      if (sessions.indexOf(session) === 0) {
        console.log(`🔍 Debug: call_data structure for first record:`);
        console.log(`   - Top-level keys: ${Object.keys(callData).slice(0, 15).join(", ")}`);
        console.log(`   - conversation_id: ${callData.conversation_id || 'missing'}`);
        console.log(`   - Has metadata: ${!!callData.metadata}`);
        console.log(`   - Has analysis: ${!!callData.analysis}`);
        console.log(`   - Has conversation_initiation_client_data: ${!!callData.conversation_initiation_client_data}`);
        console.log();
      }

      // Extract fields from call_data (direct structure, no wrapper)
      const updateData = {
        conversation_id: callData.conversation_id || null,
        agent_id: callData.agent_id || null,
        activity_id: callData.conversation_initiation_client_data?.dynamic_variables?.activity_id || null,
        character_name: callData.conversation_initiation_client_data?.dynamic_variables?.character_name || null,
        
        start_time_unix_secs: callData.metadata?.start_time_unix_secs || null,
        accepted_time_unix_secs: callData.metadata?.accepted_time_unix_secs || null,
        call_duration_secs: callData.metadata?.call_duration_secs || null,
        
        call_successful: callData.analysis?.call_successful || null,
        did_coach_participate: callData.analysis?.data_collection_results?.did_coach_participate?.value ?? null,
        termination_reason: callData.metadata?.termination_reason || null,
        
        transcript_summary: callData.analysis?.transcript_summary || null,
        call_summary_title: callData.analysis?.call_summary_title || null,
        transcript: (callData.transcript || null) as any, // Cast to Json type
        
        cost_cents: callData.metadata?.cost || null,
      };

      // Show what we're about to do
      console.log(`📝 Session ${session.id}:`);
      console.log(`   - conversation_id: ${updateData.conversation_id}`);
      console.log(`   - character_name: ${updateData.character_name}`);
      console.log(`   - duration: ${updateData.call_duration_secs}s`);
      console.log(`   - did_coach_participate: ${updateData.did_coach_participate}`);

      if (!isDryRun) {
        const { error: updateError } = await supabase
          .from("practice_sessions")
          .update(updateData)
          .eq("id", session.id);

        if (updateError) {
          console.log(`   ❌ Error updating: ${updateError.message}\n`);
          errorCount++;
        } else {
          console.log(`   ✅ Updated successfully\n`);
          successCount++;
        }
      } else {
        console.log(`   ℹ️  Dry run - no changes made\n`);
        successCount++;
      }
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 Backfill Summary");
    console.log("=".repeat(60));
    console.log(`Total processed: ${sessions.length}`);
    console.log(`✅ Successful: ${successCount}`);
    if (errorCount > 0) console.log(`❌ Errors: ${errorCount}`);
    if (skippedCount > 0) console.log(`⚠️  Skipped: ${skippedCount}`);
    console.log("=".repeat(60) + "\n");

    if (isDryRun) {
      console.log("ℹ️  This was a dry run. Run without --dry-run to apply changes.\n");
    } else {
      console.log("✅ Backfill complete!\n");
    }

  } catch (error) {
    console.error("❌ Unexpected error:", error);
    process.exit(1);
  }
}

// Run the backfill
backfillPracticeSessions();

