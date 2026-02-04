# Troubleshooting Guide

App-specific issues and quirks for the NBG Coaching Practice Platform.

> **Note:** This guide focuses on platform-specific issues, unique integrations, and architectural quirks. For basic development setup (port conflicts, module installation, IDE configuration), please refer to standard Next.js and Node.js documentation.

## Table of Contents

- [Database Issues](#database-issues)
- [Authentication Issues](#authentication-issues)
- [Integration Issues](#integration-issues)

## Database Issues

### Supabase Connection Failed

**Error:**
```
Failed to fetch
Network error
FetchError: request to https://xxx.supabase.co failed
```

**App-specific causes:**

1. **Project paused (free tier):**
   - Free tier projects pause after inactivity
   - Resume in Supabase Dashboard
   - This is a common gotcha with Supabase free tier

2. **Wrong client configuration:**
   - This app uses multiple Supabase clients (client, server, admin, middleware)
   - Verify you're using the correct client for the context:
     ```typescript
     // Client-side components
     import { createClient } from '@/lib/supabase/client';
     
     // Server components/actions
     import { createServerClient } from '@/lib/supabase/server';
     
     // Admin operations (bypasses RLS)
     import { createAdminClient } from '@/lib/supabase/admin';
     ```

3. **Service role key missing:**
   - Required for server-side operations and workflows
   - Check `SUPABASE_SERVICE_ROLE_KEY` is set (not just anon key)

**Note:** If you modify the database schema, regenerate TypeScript types:
```bash
npx supabase gen types typescript --project-id your-project-ref --schema public > lib/supabase/types.ts
# Or for local Supabase
npx supabase gen types typescript --local > lib/supabase/types.ts
```

---

### Migration Errors

**Error:**
```
Migration failed: relation "table_name" already exists
Error: duplicate key value violates unique constraint
```

**Cause:** Database state conflicts with migrations

**Solutions:**

1. **Check migration status:**
   ```bash
   supabase migration list
   ```

2. **Reset database (WARNING: destroys all data):**
   ```bash
   supabase db reset
   ```

3. **Manual fix via SQL Editor:**
   - Go to Supabase Dashboard > SQL Editor
   - Drop conflicting tables/constraints
   - Re-run migrations

4. **Create new migration for fixes:**
   ```bash
   supabase migration new fix_conflicts
   # Edit migration file to resolve conflicts
   supabase migration up
   ```

---

### RLS Policy Errors

**Error:**
```
new row violates row-level security policy
permission denied for table xxx
```

**Cause:** Row Level Security policies blocking access

**Solutions:**

1. **Check RLS policies:**
   ```sql
   -- View policies for a table
   SELECT * FROM pg_policies WHERE tablename = 'your_table';
   ```

2. **Verify user authentication:**
   ```typescript
   const { data: { user } } = await supabase.auth.getUser();
   console.log('User ID:', user?.id);
   ```

3. **Temporarily disable RLS (development only):**
   ```sql
   ALTER TABLE your_table DISABLE ROW LEVEL SECURITY;
   ```

4. **Add missing policies:**
   ```sql
   -- Example: Allow users to read their own data
   CREATE POLICY "Users can view own data"
   ON your_table FOR SELECT
   USING (auth.uid() = user_id);
   ```

5. **Use service role for admin operations:**
   ```typescript
   import { createAdminClient } from '@/lib/supabase/admin';
   const supabase = createAdminClient(); // Bypasses RLS
   ```

---

### Slow Queries

**Error:** Queries taking > 5 seconds on app-specific tables

**App-specific optimization:**

1. **Common slow tables in this app:**
   - `practice_sessions` - Large transcript JSONB fields
   - `scorecards` - Joined with sessions frequently
   - `user_progress` - Aggregated for dashboard views

2. **App-specific indexes to add:**
   ```sql
   -- Practice sessions by user (history page)
   CREATE INDEX idx_practice_sessions_user_id 
   ON practice_sessions(user_id);
   
   -- Scorecards by session (display after scoring)
   CREATE INDEX idx_scorecards_session_id 
   ON scorecards(session_id);
   
   -- Progress tracking (dashboard queries)
   CREATE INDEX idx_user_progress_user_activity 
   ON user_progress(user_id, activity_id);
   ```

3. **Avoid fetching large JSONB fields:**
   - `practice_sessions.transcript` is large - only fetch when viewing session details
   - Use `.select()` to exclude transcript for list views

---

## Authentication Issues

### Login Not Working

**Error:** Can't log in, redirect loops, or session not persisting

**App-specific causes:**

1. **Middleware configuration:**
   - This app uses Next.js middleware for auth (`lib/supabase/middleware.ts`)
   - Verify middleware is running and not blocking requests
   - Check terminal for middleware errors

2. **Site URL mismatch in Supabase:**
   - Dashboard > Authentication > URL Configuration
   - Site URL must match your domain exactly
   - Redirect URLs must include all callback paths
   - Common issue: missing redirect URL for `/auth/callback`

3. **Client/server client mismatch:**
   - Client components must use `createClient()` from `@/lib/supabase/client`
   - Server components must use `createServerClient()` from `@/lib/supabase/server`
   - Using wrong client causes session issues

---

### Session Expired

**Error:**
```
Session expired
Invalid session
```

**App-specific notes:**

1. **Middleware auto-refresh:**
   - This app's middleware (`lib/supabase/middleware.ts`) should auto-refresh tokens
   - If sessions expire frequently, check middleware is running correctly

2. **JWT expiry configuration:**
   - Supabase Dashboard > Authentication > Settings
   - Default: 3600 seconds (1 hour)
   - Adjust if needed for longer sessions

3. **Session refresh in app:**
   - The app uses `onAuthStateChange` listeners in context providers
   - Check `lib/context/user-context.tsx` for session management

---

### Email Confirmation Issues

**Error:** Confirmation emails not sending or links not working

**App-specific solutions:**

1. **Development: Disable email confirmation**
   - Supabase Dashboard > Authentication > Settings
   - Disable "Enable email confirmations" for local dev
   - Or manually confirm users:
     ```sql
     UPDATE auth.users 
     SET email_confirmed_at = NOW() 
     WHERE email = 'user@example.com';
     ```

2. **Local Supabase email testing:**
   - With `supabase start`, emails go to Inbucket
   - Access at http://127.0.0.1:54324
   - Useful for testing email templates

3. **Production: Configure SMTP**
   - Dashboard > Authentication > Email Templates
   - Set up custom SMTP for production emails

---

## Integration Issues

### ElevenLabs Conversation Not Starting

**Error:** Audio doesn't work, connection fails, or no response

**App-specific troubleshooting:**

1. **Agent ID configuration:**
   - This app uses `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` (not API key)
   - Must be in format: `agent_xxxxxxxxxxxxxxxxxxxxx`
   - Set in `.env.local` and restart dev server

2. **App-specific components:**
   - Conversation UI: `components/elevenlabs/conversation-bar.tsx`
   - Session management: `hooks/use-practice-session.ts`
   - Check these files for connection logic

3. **Webhook dependency:**
   - Conversation must complete for transcript to save
   - If conversation starts but transcript missing, check webhook (see below)

4. **Browser requirements:**
   - Chrome recommended for WebRTC
   - Microphone permission required
   - Check browser console for WebRTC errors

---

### ElevenLabs Webhook Not Firing

**Error:** Transcripts not saving, sessions not updating

**App-specific webhook setup:**

1. **Webhook endpoint:**
   - Handler: `app/api/webhooks/elevenlabs/route.ts`
   - URL format: `https://your-domain.com/api/webhooks/elevenlabs`
   - Configure in ElevenLabs Dashboard > Agent > Webhooks

2. **Local development:**
   - Use ngrok or similar to expose local server
   - Webhook URL must be publicly accessible
   - Test with: `curl -X POST http://localhost:3000/api/webhooks/elevenlabs`

3. **Webhook updates practice_sessions:**
   - Updates `transcript` JSONB field
   - Sets `conversation_id` and `call_duration_secs`
   - Check database to verify webhook fired

4. **Function timeout:**
   - Default timeout may be too short for large transcripts
   - Check `app/api/webhooks/elevenlabs/route.ts` for `maxDuration` setting

---

### OpenAI API Errors

**Error:**
```
401 Unauthorized
429 Rate limit exceeded
500 Internal server error
```

**App-specific usage:**

1. **Used in scoring workflow:**
   - OpenAI is called via Vercel Workflow (`workflows/score/workflow.ts`)
   - Uses GPT-4 for conversation evaluation
   - API key: `OPENAI_API_KEY` (server-side only)

2. **Check workflow logs:**
   - Vercel Dashboard > Workflow
   - View execution logs for specific errors
   - Workflow failures appear here, not in app logs

3. **Common issues:**
   - Billing/credits: https://platform.openai.com/account/billing
   - Rate limits: https://platform.openai.com/account/limits
   - API key format: Should start with `sk-proj-...` or `sk-...`

4. **Workflow-specific errors:**
   - If scoring fails, check workflow execution logs
   - Transcript may be too long (check `practice_sessions.transcript` size)
   - Rubric may be missing (check `prompts` table for `scorecard_rubric`)

---

### Scoring Workflow Stuck

**Error:** Scoring status stays "scoring" forever

**Cause:** Workflow failure, timeout, or missing data

**Solutions:**

1. **Check workflow logs:**
   - Vercel Dashboard > Workflow
   - Find the specific run
   - Check error messages

2. **Verify transcript exists:**
   ```sql
   SELECT id, transcript, scoring_status 
   FROM practice_sessions 
   WHERE id = 'your-session-id';
   ```

3. **Check rubric exists:**
   ```sql
   SELECT * FROM prompts WHERE label = 'scorecard_rubric';
   ```

4. **Manually reset status:**
   ```sql
   UPDATE practice_sessions 
   SET scoring_status = NULL 
   WHERE id = 'your-session-id';
   ```

5. **Retry scoring:**
   - Click "Retry Scoring" button
   - Or trigger via API

