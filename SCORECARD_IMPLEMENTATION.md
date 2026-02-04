# Scorecard System Implementation - Complete

## Overview
The scorecard workflow system has been successfully implemented to evaluate practice sessions using AI-powered rubrics. The system integrates with your existing practice_sessions table and provides manual scoring via buttons in the practice history UI.

## What Was Implemented

### 1. Database Migration ✅
**File**: `supabase/migrations/20260102000000_add_scorecard_system.sql`

Created:
- Added `rubric_prompt` column to `activities` table
- Added `scoring_status` column to `practice_sessions` table
- Created `scorecards` table with proper relationships
- Created `scorecards_with_activity` view for easier querying
- Set up Row Level Security (RLS) policies
- Added indexes for performance

### 2. Workflow System ✅
**File**: `workflows/score/workflow.ts`

Updated to:
- Query `practice_sessions` instead of `transcripts`
- Flatten transcript JSON array to readable text format
- Query `activities.rubric_prompt` instead of separate scenarios table
- Use `session_id` throughout instead of `transcript_id`
- Update `scoring_status` on practice_sessions
- Export `scorePracticeSessionWorkflow` function

### 3. API Route ✅
**File**: `app/api/score/route.ts`

Updated to:
- Accept `session_id` parameter
- Verify user owns the practice session
- Start the `scorePracticeSessionWorkflow`

### 4. UI Components ✅

**New Files**:
- `components/practice/score-session-button.tsx` - Interactive button with loading states
- `components/practice/scorecard-display.tsx` - Display scorecard results with criteria breakdown

**Updated File**:
- `app/(app)/practice/history/page.tsx` - Integrated scorecard display and scoring buttons

### 5. TypeScript Types ✅
**File**: `lib/supabase/types.ts`

Added:
- `rubric_prompt` to activities table types
- `scoring_status` to practice_sessions table types
- Complete `scorecards` table type definition
- `scorecards_with_activity` view type

## How to Use

### Step 1: Run the Migration
```bash
# Using Supabase CLI
supabase migration up

# Or manually in Supabase dashboard
# Run the SQL from: supabase/migrations/20260102000000_add_scorecard_system.sql
```

### Step 2: Add Rubric Prompts to Activities
In your Supabase dashboard or via SQL, add rubric prompts to activities:

```sql
UPDATE activities
SET rubric_prompt = 'Evaluate this coaching conversation on the following criteria:

1. **Empathy & Active Listening** (0-25 points)
   - Did the coach acknowledge the client''s feelings?
   - Were reflective listening techniques used?

2. **Powerful Questions** (0-25 points)
   - Were open-ended questions asked?
   - Did questions promote self-discovery?

3. **Goal Clarity** (0-25 points)
   - Was a clear goal established?
   - Were action steps identified?

4. **Communication Skills** (0-25 points)
   - Was language clear and professional?
   - Was appropriate pacing maintained?

Provide an overall score (0-100) and constructive feedback.'
WHERE activity_type = 'roleplay' AND id = 'your-activity-id';
```

### Step 3: Test the System
1. Navigate to `/practice/history`
2. Find a practice session
3. Click "Score Conversation" button
4. Wait a few seconds for the AI evaluation
5. View the scorecard results inline

## Features

### Score Button States
- **Default**: "Score Conversation" - Ready to score
- **Loading**: "Starting..." - Initiating workflow
- **Scoring**: "Scoring..." - AI evaluation in progress
- **Failed**: "Retry Scoring" - Error occurred, can retry
- **Hidden**: Button disappears once scorecard exists

### Scorecard Display
- **Overall Score**: Percentage with color-coded badge
  - 90-100%: "Excellent" (default)
  - 75-89%: "Good" (secondary)
  - 60-74%: "Satisfactory" (outline)
  - 0-59%: "Needs Work" (destructive)
- **Progress Bar**: Visual representation of score
- **Feedback**: AI-generated constructive feedback
- **Criteria Breakdown**: Collapsible section showing:
  - Individual criterion scores
  - Rationale for each score
  - Progress bars for each criterion

## Architecture

### Data Flow
```
User clicks "Score" → API verifies ownership → Workflow starts
  ↓
Workflow Step 1: Fetch practice session + transcript
  ↓
Workflow Step 2: Fetch activity rubric_prompt
  ↓
Workflow Step 3: AI evaluation (OpenAI GPT-4)
  ↓
Workflow Step 4: Save scorecard + update status
  ↓
Page refreshes → Display scorecard inline
```

### Database Schema
```
practice_sessions
  ├── scoring_status (null | "scoring" | "scored" | "failed")
  └── transcript (JSON array)

activities
  └── rubric_prompt (TEXT)

scorecards
  ├── session_id → practice_sessions.id
  ├── user_id → auth.users.id
  ├── activity_id → activities.id
  ├── overall_score (0-100)
  ├── criteria_scores (JSONB array)
  └── feedback (TEXT)
```

## Environment Variables Required

Ensure these are set in your `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
```

## Troubleshooting

### Button doesn't appear
- Check that the practice session has a valid transcript
- Ensure the session doesn't already have a scorecard

### "Rubric prompt not configured" error
- Add a `rubric_prompt` to the activity in the database
- Ensure the practice session has an `activity_id`

### Scoring stays in "scoring" status
- Check Vercel workflow logs for errors
- Verify OpenAI API key is valid
- Check that the activity has a rubric_prompt

### Scorecard doesn't display
- Check browser console for errors
- Verify RLS policies allow SELECT on scorecards
- Ensure the query includes the scorecards join

## Next Steps (Optional Enhancements)

1. **Automatic Scoring**: Modify the ElevenLabs webhook to trigger scoring automatically after conversations
2. **Scorecard History**: Create a dedicated page showing all scorecards with filtering
3. **Rubric Builder**: Build a UI for creating/editing rubric prompts
4. **Analytics**: Track scoring trends over time
5. **Export**: Add PDF export functionality for scorecards
6. **Notifications**: Send email/push notifications when scoring completes

## Files Changed

### New Files (3)
- `supabase/migrations/20260102000000_add_scorecard_system.sql`
- `components/practice/score-session-button.tsx`
- `components/practice/scorecard-display.tsx`

### Modified Files (4)
- `workflows/score/workflow.ts`
- `app/api/score/route.ts`
- `app/(app)/practice/history/page.tsx`
- `lib/supabase/types.ts`

### Unchanged (Already Exist)
- `lib/schemas/scorecard.ts` - Zod schemas work as-is
- `lib/supabase/admin.ts` - Admin client works as-is

## Support

If you encounter issues:
1. Check the migration ran successfully
2. Verify environment variables are set
3. Check Vercel workflow logs
4. Review browser console for client-side errors
5. Verify RLS policies in Supabase dashboard

---

**Implementation Date**: January 2, 2026
**Status**: Complete ✅



