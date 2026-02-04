# Scorecard System - Quick Setup Guide

## ✅ Implementation Complete

The scorecard workflow system has been implemented and is ready to use!

## 🚀 Quick Start (3 Steps)

### Step 1: Run the Database Migration

The migration will:
- Add `scoring_status` column to `practice_sessions` table
- Create `scorecards` table with RLS policies
- Insert a default rubric prompt into the `prompts` table

```bash
# Option A: Using Supabase CLI
supabase migration up

# Option B: Run manually in Supabase SQL Editor
# Copy and paste the contents of:
# supabase/migrations/20260102000000_add_scorecard_system.sql
```

### Step 2: Verify the Rubric Prompt

After running the migration, a default rubric will be automatically inserted into your `prompts` table with the label `scorecard_rubric`.

You can view/edit it in Supabase:
```sql
SELECT * FROM prompts WHERE label = 'scorecard_rubric';
```

### Step 3: Test It Out!

1. Navigate to `/practice/history` in your app
2. Find any practice session with a transcript
3. Click the "Score Conversation" button
4. Wait 5-10 seconds for the AI evaluation
5. View the scorecard results inline!

## 📊 How It Works

### The Rubric (Default)

The system evaluates conversations on 4 criteria (25 points each):

1. **Empathy & Active Listening** (0-25 points)
   - Acknowledging feelings and emotions
   - Using reflective listening techniques
   - Demonstrating genuine understanding

2. **Powerful Questions** (0-25 points)
   - Asking open-ended questions
   - Helping clients gain insights
   - Demonstrating curiosity

3. **Goal Clarity & Action Planning** (0-25 points)
   - Establishing clear objectives
   - Identifying specific action steps
   - Securing commitment

4. **Communication & Presence** (0-25 points)
   - Clear, professional language
   - Appropriate pacing
   - Full engagement

**Overall Score**: Sum of all criteria (0-100)

### Customizing the Rubric

Edit the rubric in your Supabase dashboard:

```sql
UPDATE prompts
SET template = 'Your custom rubric here...'
WHERE label = 'scorecard_rubric';
```

**Rubric Format Tips:**
- Use numbered criteria (1, 2, 3, 4)
- Include point ranges (0-25 points)
- Add specific evaluation questions
- End with instructions for overall score and feedback

## 🎨 UI Features

### Score Button States
- **"Score Conversation"** - Ready to score (blue outline)
- **"Starting..."** - Initiating workflow (loading spinner)
- **"Scoring..."** - AI evaluation in progress (disabled)
- **"Retry Scoring"** - Failed, can retry (outline)
- **Hidden** - Already scored (button disappears)

### Scorecard Display
- **Overall Score Badge**:
  - 90-100%: "Excellent" (green)
  - 75-89%: "Good" (blue)
  - 60-74%: "Satisfactory" (gray)
  - 0-59%: "Needs Work" (red)
- **Progress Bar**: Visual score representation
- **Feedback Section**: AI-generated constructive feedback
- **Criteria Breakdown** (collapsible):
  - Individual scores for each criterion
  - Rationale explaining each score
  - Progress bars for visual comparison

## 🔧 Technical Details

### Workflow Steps
1. **Fetch Session**: Get practice session + transcript from database
2. **Fetch Rubric**: Get rubric template from `prompts` table (label: `scorecard_rubric`)
3. **AI Evaluation**: Send to OpenAI GPT-4 for structured scoring
4. **Save Results**: Store scorecard + update `scoring_status` to "scored"

### Database Schema
```
prompts
  └── label: "scorecard_rubric" (the rubric template)

practice_sessions
  ├── transcript (JSON array)
  └── scoring_status (null | "scoring" | "scored" | "failed")

scorecards
  ├── session_id → practice_sessions.id
  ├── user_id → auth.users.id
  ├── activity_id → activities.id (nullable)
  ├── overall_score (0-100)
  ├── criteria_scores (JSONB array)
  └── feedback (TEXT)
```

### API Endpoint
```typescript
POST /api/score
Body: { session_id: "uuid" }
Response: { message, run_id, session_id }
```

## 🐛 Troubleshooting

### "Scorecard rubric not found" error
**Solution**: Run the migration - it automatically inserts the default rubric.

### Button doesn't appear
**Possible causes**:
- Session already has a scorecard (button is hidden)
- Session has no transcript data
- Page needs refresh

### Scoring stuck in "scoring" status
**Check**:
1. Vercel workflow logs for errors
2. OpenAI API key is valid (`OPENAI_API_KEY` in env)
3. Rubric exists in prompts table

### Scorecard doesn't display after scoring
**Check**:
1. Browser console for errors
2. RLS policies on `scorecards` table
3. Page refresh (should happen automatically)

## 📝 Environment Variables

Ensure these are set:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
```

## 🎯 Key Benefits

✅ **Single Rubric**: One rubric for all practice sessions (easy to maintain)  
✅ **No Activity Required**: Works even if `activity_id` is null  
✅ **Easy Updates**: Edit rubric in database, affects all future scorings  
✅ **Manual Control**: Users trigger scoring when ready  
✅ **Inline Display**: Results show right in practice history  
✅ **Detailed Feedback**: Criterion-by-criterion breakdown with rationales  

## 🔄 Future Enhancements

Consider adding:
- [ ] Automatic scoring after conversations (webhook integration)
- [ ] Multiple rubric templates (e.g., by conversation type)
- [ ] Scorecard comparison across sessions
- [ ] Export to PDF functionality
- [ ] Trend analytics over time
- [ ] Admin UI for editing rubrics

---

**Need Help?** Check the full implementation details in `SCORECARD_IMPLEMENTATION.md`



