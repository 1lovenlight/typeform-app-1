import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Service role client for workflow operations.
 * Bypasses RLS - use only in server-side workflows, not in user-facing routes.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
